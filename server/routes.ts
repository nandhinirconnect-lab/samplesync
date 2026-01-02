
import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { performance } from 'perf_hooks';
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
      
      // Generate a unique PIN for attendees (8 digits + 1 capital letter)
      let pin = "";
      let attempts = 0;
      let existingEvent = null;
      
      do {
        // Generate 8 random digits
        const digits = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
        // Generate 1 random capital letter
        const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
        pin = digits + letter;
        existingEvent = await storage.getEventByPin(pin);
        attempts++;
      } while (existingEvent && attempts < 10);
      
      if (existingEvent) {
        return res.status(500).json({ message: "Failed to generate unique PIN" });
      }
      
      // Generate a host password (4 random digits)
      const password = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      
      const event = await storage.createEvent({
        ...input,
        pin,
        password,
      });
      
      // Return both PIN and hostId so frontend can show both
      res.status(201).json({
        ...event,
        eventPin: pin,
      });
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

  // Get event by host ID (for host rejoin)
  app.get("/api/events/host/:hostId", async (req, res) => {
    const event = await storage.getEventByHostId(req.params.hostId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json(event);
  });

  // Host login by Event ID and Password
  app.get(api.events.hostLogin.path, async (req, res) => {
    const event = await storage.getEvent(Number(req.params.id));
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    if (event.password !== req.params.password) {
      return res.status(401).json({ message: 'Invalid Event ID or Password' });
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

    res.json({
      activeNow,
      totalJoined,
      capacity: event.capacity ?? 1000,
    });
  });

  // === WEBSOCKET ===

  const io = new SocketIOServer(httpServer, {
    cors: { origin: "*" },
  });

  const roomState = new Map<string, { lastEffect: any; hostSocketId: string | null }>();

  io.on("connection", (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`, { query: socket.handshake.query });

    // Auto-join if client provided eventId and role in the connection query
    try {
      const q: any = socket.handshake.query || {};
      const maybeEventId = q.eventId || q.eventid || q.eventID;
      const maybeRole = q.role;
      if (maybeEventId) {
        (async () => {
          const eventId = Number(maybeEventId);
          const role = maybeRole === 'host' ? 'host' : 'attendee';
          try {
            const event = await storage.getEvent(eventId);
            if (!event) {
              console.log(`[Socket] Auto-join: event not found ${eventId}`);
              return;
            }

            const eventRoom = `event-${event.id}`;
            socket.join(eventRoom);

            if (!roomState.has(eventRoom)) {
              roomState.set(eventRoom, { lastEffect: null, hostSocketId: null });
            }

            if (role === 'host') {
              const state = roomState.get(eventRoom)!;
              state.hostSocketId = socket.id;
              console.log(`[Socket] Auto-join: set hostSocketId for ${eventRoom} = ${socket.id}`);
            }

            await storage.joinSession(socket.id, event.id, role as 'host' | 'attendee');
            socket.emit('joined', { eventId: event.id });
            io.to(eventRoom).emit('participant_update', {
              active: await storage.getActiveSessionCount(event.id),
              total: await storage.getTotalSessionCount(event.id),
            });
            console.log(`[Socket] Auto-join complete for ${socket.id} -> ${eventRoom}`);
          } catch (err) {
            console.error('[Socket] Auto-join error:', err);
          }
        })();
      }
    } catch (err) {
      console.error('[Socket] Auto-join setup failed', err);
    }

    socket.on("join_event", async (data: { eventId: number; role: 'host' | 'attendee' }) => {
      try {
        const event = await storage.getEvent(data.eventId);
        if (!event) {
          return socket.emit("error", { message: "Event not found" });
        }

        const eventRoom = `event-${event.id}`;
        socket.join(eventRoom);

        if (!roomState.has(eventRoom)) {
          roomState.set(eventRoom, { lastEffect: null, hostSocketId: null });
        }

        if (data.role === "host") {
          const state = roomState.get(eventRoom)!;
          state.hostSocketId = socket.id;
        }

        await storage.joinSession(socket.id, event.id, data.role);
        socket.emit("joined", { eventId: event.id });
        io.to(eventRoom).emit("participant_update", {
          active: await storage.getActiveSessionCount(event.id),
          total: await storage.getTotalSessionCount(event.id),
        });
      } catch (err) {
        console.error("[Socket] Error joining event:", err);
      }
    });

    socket.on("host_effect", (data: { eventId: number; effect: any }) => {
      console.log(`[Socket] host_effect from ${socket.id}:`, data && typeof data === 'object' ? { eventId: data.eventId, effectType: data.effect?.type } : data);
      const eventRoom = `event-${data.eventId}`;
      const roomState_data = roomState.get(eventRoom);
      if (roomState_data && roomState_data.hostSocketId === socket.id) {
        roomState_data.lastEffect = data.effect;
        io.to(eventRoom).emit("effect", data.effect);
        console.log(`[Socket] broadcasted effect to ${eventRoom}`);
      } else {
        console.log(`[Socket] host_effect ignored: hostSocketId mismatch for ${eventRoom}`, { hostSocketId: roomState_data?.hostSocketId });
      }
    });

    socket.on("disconnect", async () => {
      await storage.leaveSession(socket.id);
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });

    // Time sync endpoint for clients using high-resolution monotonic timestamps
    socket.on('time:sync', (data: { clientPerf?: number; clientEpoch?: number }, cb: (response: { serverPerf: number; serverEpoch: number }) => void) => {
      try {
        const serverPerf = performance.now();
        const serverEpoch = Date.now();
        if (typeof cb === 'function') cb({ serverPerf, serverEpoch });
      } catch (err) {
        console.error('[Socket] time:sync handler error', err);
      }
    });
  });

  return httpServer;
}
