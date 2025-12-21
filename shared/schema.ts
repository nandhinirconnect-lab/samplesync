
import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  pin: text("pin").notNull().unique(), // 4-digit PIN
  name: text("name").notNull(),
  hostId: text("host_id").notNull(), // Anonymous ID for host ownership
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// === SCHEMAS ===
export const insertEventSchema = createInsertSchema(events).omit({ 
  id: true, 
  createdAt: true,
  isActive: true,
  pin: true  // PIN generated server-side
});

// === TYPES ===
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

// === SOCKET TYPES ===
// Effect types
export type EffectType = 'TORCH_ON' | 'TORCH_OFF' | 'STROBE' | 'PULSE' | 'COLOR_WAVE';

export interface EffectPayload {
  type: EffectType;
  startAt: number;     // Server timestamp (ms) when effect should start
  duration?: number;   // Duration in ms
  frequency?: number;  // For strobe (Hz)
  color?: string;      // For screen flash (hex)
}

// Sync types
export interface TimeSyncRequest {
  clientSendTime: number;
}

export interface TimeSyncResponse {
  clientSendTime: number;
  serverReceiveTime: number;
  serverSendTime: number;
}
