
import { db } from "./db";
import { events, type InsertEvent, type Event } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  createEvent(event: InsertEvent): Promise<Event>;
  getEventByPin(pin: string): Promise<Event | undefined>;
  getEvent(id: number): Promise<Event | undefined>;
}

export class DatabaseStorage implements IStorage {
  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const [event] = await db.insert(events).values(insertEvent).returning();
    return event;
  }

  async getEventByPin(pin: string): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.pin, pin));
    return event;
  }

  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }
}

export const storage = new DatabaseStorage();
