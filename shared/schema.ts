import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

// Users table for email authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default("gen_random_uuid()"),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Events table - enhanced with auth and timing
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  pin: text("pin").notNull().unique(), // Keep for backwards compatibility
  eventId: varchar("event_id").unique(), // 12-char alphanumeric (NEW)
  name: text("name").notNull(),
  hostId: text("host_id"), // Keep for backwards compatibility
  userId: varchar("user_id"), // New: authenticated host (foreign key to users)
  capacity: integer("capacity"), // New: max attendees
  startTime: timestamp("start_time"), // New: event start (UTC)
  endTime: timestamp("end_time"), // New: event end (UTC)
  qrCode: text("qr_code"), // New: QR code data URL
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Sessions table for real-time tracking
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  userId: varchar("user_id"), // Attendee ID
  role: text("role").notNull(), // 'host' or 'attendee'
  isActive: boolean("is_active").default(true),
  joinedAt: timestamp("joined_at").defaultNow(),
  lastHeartbeat: timestamp("last_heartbeat").defaultNow(),
});

// === SCHEMAS ===

// User schemas
export const insertUserSchema = z.object({
  email: z.string().email("Invalid email"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  passwordHash: z.string(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Event schemas
export const insertEventSchema = z.object({
  name: z.string().min(1, "Event name is required"),
  capacity: z.number().int().min(1, "Capacity must be at least 1"),
  startTime: z.number(), // Unix timestamp in ms
  endTime: z.number(), // Unix timestamp in ms
});

export const insertEventSchemaWithId = insertEventSchema.extend({
  eventId: z.string(),
  userId: z.string(),
  qrCode: z.string().optional(),
});

// === TYPES ===
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchemaWithId>;

export type Session = typeof sessions.$inferSelect;

export interface ParticipantStats {
  totalJoined: number;
  activeNow: number;
}

// Auth response
export interface AuthResponse {
  user: User;
  token: string;
}

// === SOCKET TYPES ===
export type EffectType = 'TORCH_ON' | 'TORCH_OFF' | 'STROBE' | 'PULSE' | 'COLOR_WAVE';

export interface EffectPayload {
  type: EffectType;
  startAt: number;
  duration?: number;
  frequency?: number;
  color?: string;
}

export interface TimeSyncRequest {
  clientSendTime: number;
}

export interface TimeSyncResponse {
  clientSendTime: number;
  serverReceiveTime: number;
  serverSendTime: number;
}
