
import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // === REST API ===
  
  app.post(api.events.create.path, async (req, res) => {
    try {
      const input = api.events.create.input.parse(req.body);
      
      // Generate a unique 4-digit PIN
      let pin = "";
      let attempts = 0;
      let existingEvent = null;
      
      do {
        pin = Math.floor(1000 + Math.random() * 9000).toString();
        existingEvent = await storage.getEventByPin(pin);
        attempts++;
      } while (existingEvent && attempts < 10);
      
      if (existingEvent) {
        return res.status(500).json({ message: "Failed to generate unique PIN" });
      }
      
      const event = await storage.createEvent({
        ...input,
        pin,
      });
      res.status(201).json(event);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.get(api.events.join.path, async (req, res) => {
    const event = await storage.getEventByPin(req.params.pin);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json(event);
  });

  app.get(api.events.get.path, async (req, res) => {
    const event = await storage.getEvent(Number(req.params.id));
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json(event);
  });

  app.get(api.events.stats.path, async (req, res) => {
    const event = await storage.getEvent(Number(req.params.id));
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    const activeNow = await storage.getActiveSessionCount(Number(req.params.id));
    const totalJoined = await storage.getTotalSessionCount(Number(req.params.id));
    
    res.json({ activeNow, totalJoined });
  });

  // === SOCKET.IO ===
  
  const io = new SocketIOServer(httpServer, {
    path: "/socket.io",
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("join_event", async (data) => {
      const { pin, eventId, role } = data;
      console.log(`Socket ${socket.id} joining event:${pin} as ${role}`);
      
      // Track session in database
      try {
        await storage.joinSession(socket.id, eventId, role);
      } catch (err) {
        console.error('Failed to join session:', err);
      }
      
      socket.join(`event:${pin}`);
      
      // Broadcast participant update to all hosts in the event room
      const activeNow = await storage.getActiveSessionCount(eventId);
      const totalJoined = await storage.getTotalSessionCount(eventId);
      io.to(`event:${pin}`).emit("participants_update", { activeNow, totalJoined });
    });

    socket.on("leave_event", async (data) => {
      const { pin, eventId } = data;
      
      // Update session status
      try {
        await storage.leaveSession(socket.id);
      } catch (err) {
        console.error('Failed to leave session:', err);
      }
      
      socket.leave(`event:${pin}`);
      
      // Broadcast updated participant count
      const activeNow = await storage.getActiveSessionCount(eventId);
      const totalJoined = await storage.getTotalSessionCount(eventId);
      io.to(`event:${pin}`).emit("participants_update", { activeNow, totalJoined });
    });

    // Host triggering an effect
    socket.on("host_effect", (payload) => {
      // payload: { pin: string, effect: EffectPayload }
      // We broadcast to the room
      if (payload.pin && payload.effect) {
        // Add server timestamp for strict sync
        const broadcastPayload = {
          ...payload.effect,
          // If host didn't provide startAt, set it to now + 200ms
          startAt: payload.effect.startAt || (Date.now() + 200) 
        };
        
        io.to(`event:${payload.pin}`).emit("effect", broadcastPayload);
      }
    });

    // Time Sync (NTP-like)
    socket.on("time_sync", (payload, callback) => {
      const serverReceiveTime = Date.now();
      if (typeof callback === "function") {
        callback({
          clientSendTime: payload.clientSendTime,
          serverReceiveTime,
          serverSendTime: Date.now()
        });
      }
    });

    socket.on("disconnect", async () => {
      console.log("Client disconnected:", socket.id);
      
      // Mark session as inactive on disconnect
      try {
        await storage.leaveSession(socket.id);
      } catch (err) {
        console.error('Failed to mark session as inactive:', err);
      }
    });
  });

  return httpServer;
}
