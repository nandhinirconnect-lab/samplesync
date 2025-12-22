import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { storage } from "./storage";
import { generateEventId, hashPassword, verifyPassword } from "./auth";
import { z } from "zod";

// Auth schemas
const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const createEventSchema = z.object({
  name: z.string().min(1),
  capacity: z.number().int().min(1),
  startTime: z.number(), // Unix ms
  endTime: z.number(),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // === AUTH ROUTES ===
  
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { name, email, password } = signupSchema.parse(req.body);

      // Check if user exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const passwordHash = await hashPassword(password);
      const user = await storage.createUser({
        email,
        name,
        passwordHash,
      });

      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    const userId = req.query.userId as string;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await storage.getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  });

  // === EVENT ROUTES ===

  app.post("/api/events/create", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { name, capacity, startTime, endTime } = createEventSchema.parse(req.body);
      const eventId = generateEventId();

      const event = await storage.createEvent({
        eventId,
        name,
        capacity,
        startTime,
        endTime,
        userId,
      });

      res.status(201).json(event);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/events/:eventId", async (req, res) => {
    const event = await storage.getEventByEventId(req.params.eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    res.json(event);
  });

  app.get("/api/events/id/:id", async (req, res) => {
    const event = await storage.getEvent(Number(req.params.id));
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    res.json(event);
  });

  app.get("/api/user/events", async (req, res) => {
    const userId = req.query.userId as string;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const events = await storage.getEventsByUserId(userId);
    res.json(events);
  });

  app.get("/api/events/:id/stats", async (req, res) => {
    const event = await storage.getEvent(Number(req.params.id));
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const activeNow = await storage.getActiveSessionCount(Number(req.params.id));
    const totalJoined = await storage.getTotalSessionCount(Number(req.params.id));

    res.json({
      activeNow,
      totalJoined,
      capacity: event.capacity,
    });
  });

  // === WEBSOCKET ===

  const io = new SocketIOServer(httpServer, {
    cors: { origin: "*" },
  });

  const roomState = new Map<string, { lastEffect: any; hostSocketId: string | null }>();

  io.on("connection", (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    socket.on("join_event", async (data: { eventId: string; role: 'host' | 'attendee'; userId?: string }) => {
      try {
        const event = await storage.getEventByEventId(data.eventId);
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

        await storage.joinSession(socket.id, event.id, data.userId || null, data.role);
        socket.emit("joined", { eventId: event.id });
        io.to(eventRoom).emit("participant_update", {
          active: await storage.getActiveSessionCount(event.id),
          total: await storage.getTotalSessionCount(event.id),
        });
      } catch (err) {
        console.error("[Socket] Error joining event:", err);
      }
    });

    socket.on("host_effect", (data: { eventId: string; effect: any }) => {
      const roomState_data = roomState.get(`event-${data.eventId}`);
      if (roomState_data && roomState_data.hostSocketId === socket.id) {
        roomState_data.lastEffect = data.effect;
        io.to(`event-${data.eventId}`).emit("effect", data.effect);
      }
    });

    socket.on("disconnect", async () => {
      await storage.leaveSession(socket.id);
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  return httpServer;
}
