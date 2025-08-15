import {
  users,
  conversations,
  messages,
  moodEntries,
  journalEntries,
  interventions,
  crisisAlerts,
  type User,
  type UpsertUser,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
  type MoodEntry,
  type InsertMoodEntry,
  type JournalEntry,
  type InsertJournalEntry,
  type Intervention,
  type InsertIntervention,
  type CrisisAlert,
  type InsertCrisisAlert,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (IMPORTANT: mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  
  // Conversation operations
  getUserConversations(userId: string): Promise<Conversation[]>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getConversationWithMessages(conversationId: number, userId: string): Promise<(Conversation & { messages: Message[] }) | undefined>;
  updateUserPersona(userId: string, personaId: string): Promise<User>;
  
  // Message operations
  addMessage(message: InsertMessage): Promise<Message>;
  getRecentMessages(conversationId: number, limit?: number): Promise<Message[]>;
  
  // Mood tracking operations
  addMoodEntry(moodEntry: InsertMoodEntry): Promise<MoodEntry>;
  getUserMoodEntries(userId: string, startDate?: Date, endDate?: Date): Promise<MoodEntry[]>;
  getLatestMoodEntry(userId: string): Promise<MoodEntry | undefined>;
  
  // Journal operations
  createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry>;
  getUserJournalEntries(userId: string, limit?: number): Promise<JournalEntry[]>;
  getJournalEntry(id: number, userId: string): Promise<JournalEntry | undefined>;
  updateJournalEntry(id: number, userId: string, content: Partial<InsertJournalEntry>): Promise<JournalEntry | undefined>;
  
  // Intervention operations
  createIntervention(intervention: InsertIntervention): Promise<Intervention>;
  getUserInterventions(userId: string): Promise<Intervention[]>;
  completeIntervention(id: number, userId: string): Promise<Intervention | undefined>;
  
  // Admin operations
  getAllUsers(): Promise<User[]>;
  getAllMoodEntries(): Promise<MoodEntry[]>;
  getAllConversations(): Promise<Conversation[]>;
  getAllMessages(): Promise<Message[]>;
  
  // Crisis alert operations
  createCrisisAlert(alert: InsertCrisisAlert): Promise<CrisisAlert>;
  getCrisisAlerts(): Promise<CrisisAlert[]>;
  updateCrisisAlert(id: number, updates: Partial<CrisisAlert>): Promise<CrisisAlert | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations (IMPORTANT: mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Conversation operations
  async getUserConversations(userId: string): Promise<Conversation[]> {
    return await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.updatedAt));
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const [newConversation] = await db
      .insert(conversations)
      .values(conversation)
      .returning();
    return newConversation;
  }

  async updateUserPersona(userId: string, personaId: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ selectedPersona: personaId })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async getConversationWithMessages(conversationId: number, userId: string): Promise<(Conversation & { messages: Message[] }) | undefined> {
    const conversation = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, conversationId), eq(conversations.userId, userId)))
      .limit(1);

    if (!conversation[0]) return undefined;

    const conversationMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);

    return {
      ...conversation[0],
      messages: conversationMessages,
    };
  }

  // Message operations
  async addMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values(message)
      .returning();
    return newMessage;
  }

  async getRecentMessages(conversationId: number, limit: number = 10): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.createdAt))
      .limit(limit);
  }

  // Mood tracking operations
  async addMoodEntry(moodEntry: InsertMoodEntry): Promise<MoodEntry> {
    const [newEntry] = await db
      .insert(moodEntries)
      .values(moodEntry)
      .returning();
    return newEntry;
  }

  async getUserMoodEntries(userId: string, startDate?: Date, endDate?: Date): Promise<MoodEntry[]> {
    let baseQuery = db
      .select()
      .from(moodEntries)
      .where(eq(moodEntries.userId, userId));

    if (startDate && endDate) {
      baseQuery = db
        .select()
        .from(moodEntries)
        .where(
          and(
            eq(moodEntries.userId, userId),
            gte(moodEntries.date, startDate),
            lte(moodEntries.date, endDate)
          )
        );
    }

    return await baseQuery.orderBy(desc(moodEntries.date));
  }

  async getLatestMoodEntry(userId: string): Promise<MoodEntry | undefined> {
    const [entry] = await db
      .select()
      .from(moodEntries)
      .where(eq(moodEntries.userId, userId))
      .orderBy(desc(moodEntries.date))
      .limit(1);
    return entry;
  }

  // Journal operations
  async createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry> {
    const [newEntry] = await db
      .insert(journalEntries)
      .values(entry)
      .returning();
    return newEntry;
  }

  async getUserJournalEntries(userId: string, limit: number = 20): Promise<JournalEntry[]> {
    return await db
      .select()
      .from(journalEntries)
      .where(eq(journalEntries.userId, userId))
      .orderBy(desc(journalEntries.createdAt))
      .limit(limit);
  }

  async getJournalEntry(id: number, userId: string): Promise<JournalEntry | undefined> {
    const [entry] = await db
      .select()
      .from(journalEntries)
      .where(and(eq(journalEntries.id, id), eq(journalEntries.userId, userId)))
      .limit(1);
    return entry;
  }

  async updateJournalEntry(id: number, userId: string, content: Partial<InsertJournalEntry>): Promise<JournalEntry | undefined> {
    const [updatedEntry] = await db
      .update(journalEntries)
      .set({
        ...content,
        updatedAt: new Date(),
      })
      .where(and(eq(journalEntries.id, id), eq(journalEntries.userId, userId)))
      .returning();
    return updatedEntry;
  }

  // Intervention operations
  async createIntervention(intervention: InsertIntervention): Promise<Intervention> {
    const [newIntervention] = await db
      .insert(interventions)
      .values(intervention)
      .returning();
    return newIntervention;
  }

  async getUserInterventions(userId: string): Promise<Intervention[]> {
    return await db
      .select()
      .from(interventions)
      .where(eq(interventions.userId, userId))
      .orderBy(desc(interventions.createdAt));
  }

  async completeIntervention(id: number, userId: string): Promise<Intervention | undefined> {
    const [updatedIntervention] = await db
      .update(interventions)
      .set({
        completed: true,
        completedAt: new Date(),
      })
      .where(and(eq(interventions.id, id), eq(interventions.userId, userId)))
      .returning();
    return updatedIntervention;
  }

  // Admin operations
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getAllMoodEntries(): Promise<MoodEntry[]> {
    return await db.select().from(moodEntries).orderBy(desc(moodEntries.createdAt));
  }

  async getAllConversations(): Promise<Conversation[]> {
    return await db.select().from(conversations).orderBy(desc(conversations.createdAt));
  }

  async getAllMessages(): Promise<Message[]> {
    return await db.select().from(messages).orderBy(desc(messages.createdAt));
  }

  // Crisis alert operations
  async createCrisisAlert(alert: InsertCrisisAlert): Promise<CrisisAlert> {
    const [newAlert] = await db.insert(crisisAlerts).values(alert).returning();
    return newAlert;
  }

  async getCrisisAlerts(): Promise<CrisisAlert[]> {
    return await db.select().from(crisisAlerts).orderBy(desc(crisisAlerts.createdAt));
  }

  async updateCrisisAlert(id: number, updates: Partial<CrisisAlert>): Promise<CrisisAlert | undefined> {
    const [updated] = await db
      .update(crisisAlerts)
      .set(updates)
      .where(eq(crisisAlerts.id, id))
      .returning();
    return updated;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
}

export const storage = new DatabaseStorage();
