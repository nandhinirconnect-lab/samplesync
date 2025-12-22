import { db } from "./db";
import { events, sessions, users, type InsertEvent, type Event, type Session, type User, type InsertUser } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // User methods
  createUser(user: InsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  
  // Event methods
  createEvent(event: InsertEvent & { userId: string }): Promise<Event>;
  getEvent(id: number): Promise<Event | undefined>;
  getEventByEventId(eventId: string): Promise<Event | undefined>;
  getEventsByUserId(userId: string): Promise<Event[]>;
  
  // Session methods
  joinSession(sessionId: string, eventId: number, userId: string | null, role: 'host' | 'attendee'): Promise<Session>;
  leaveSession(sessionId: string): Promise<void>;
  getActiveSessionCount(eventId: number): Promise<number>;
  getTotalSessionCount(eventId: number): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  // === USER METHODS ===
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async getUserById(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  // === EVENT METHODS ===
  async createEvent(insertEvent: InsertEvent & { userId: string }): Promise<Event> {
    const [event] = await db.insert(events).values({
      eventId: insertEvent.eventId,
      name: insertEvent.name,
      userId: insertEvent.userId,
      capacity: insertEvent.capacity,
      startTime: new Date(insertEvent.startTime),
      endTime: new Date(insertEvent.endTime),
      qrCode: insertEvent.qrCode,
    }).returning();
    return event;
  }

  async getEvent(id: number): Promise<Event | undefined> {
    const result = await db.select().from(events).where(eq(events.id, id));
    return result[0];
  }

  async getEventByEventId(eventId: string): Promise<Event | undefined> {
    const result = await db.select().from(events).where(eq(events.eventId, eventId));
    return result[0];
  }

  async getEventsByUserId(userId: string): Promise<Event[]> {
    return await db.select().from(events).where(eq(events.userId, userId));
  }

  // === SESSION METHODS ===
  async joinSession(sessionId: string, eventId: number, userId: string | null, role: 'host' | 'attendee'): Promise<Session> {
    try {
      const [session] = await db.insert(sessions).values({
        id: sessionId,
        eventId,
        userId,
        role,
      }).returning();
      return session;
    } catch (err) {
      const [session] = await db.update(sessions)
        .set({ isActive: true, lastHeartbeat: new Date() })
        .where(eq(sessions.id, sessionId))
        .returning();
      return session;
    }
  }

  async leaveSession(sessionId: string): Promise<void> {
    await db.update(sessions)
      .set({ isActive: false })
      .where(eq(sessions.id, sessionId))
      .execute();
  }

  async getActiveSessionCount(eventId: number): Promise<number> {
    const result = await db.select({ count: sessions.id })
      .from(sessions)
      .where(and(eq(sessions.eventId, eventId), eq(sessions.isActive, true)));
    return result.length;
  }

  async getTotalSessionCount(eventId: number): Promise<number> {
    const result = await db.select({ count: sessions.id })
      .from(sessions)
      .where(eq(sessions.eventId, eventId));
    return result.length;
  }
}

export const storage = new DatabaseStorage();
