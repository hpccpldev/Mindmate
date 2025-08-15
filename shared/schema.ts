import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
  integer,
  boolean,
  serial,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  selectedPersona: varchar("selected_persona").default("sage"),
  isAdmin: boolean("is_admin").default(false),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Crisis alerts for admin monitoring
export const crisisAlerts = pgTable("crisis_alerts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  severity: varchar("severity", { enum: ["low", "medium", "high", "critical"] }).notNull(),
  triggerType: varchar("trigger_type").notNull(), // "mood_pattern", "keyword_detection", "behavior_change"
  triggerData: jsonb("trigger_data"), // Context about what triggered the alert
  status: varchar("status", { enum: ["new", "reviewed", "resolved"] }).default("new"),
  reviewedBy: varchar("reviewed_by"), // Admin user ID who reviewed
  notes: text("notes"), // Admin notes
  createdAt: timestamp("created_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
});

// Conversations between user and AI
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title"),
  personaId: varchar("persona_id").default("sage"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Individual messages in conversations
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: varchar("role", { enum: ["user", "assistant"] }).notNull(),
  content: text("content").notNull(),
  emotionalTone: varchar("emotional_tone"),
  sentimentScore: integer("sentiment_score"), // 1-10 scale
  recommendations: jsonb("recommendations"), // YouTube and Spotify recommendations
  createdAt: timestamp("created_at").defaultNow(),
});

// Daily mood entries
export const moodEntries = pgTable("mood_entries", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  moodLevel: integer("mood_level").notNull(), // 1-10 scale
  anxietyLevel: integer("anxiety_level"), // 1-5 scale
  notes: text("notes"),
  date: timestamp("date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Journal entries
export const journalEntries = pgTable("journal_entries", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  prompt: text("prompt"), // AI-generated prompt that inspired this entry
  emotionalThemes: text("emotional_themes").array(), // AI-detected themes
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Wellness interventions and their completion status
export const interventions = pgTable("interventions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { enum: ["breathing", "cbt", "meditation", "music"] }).notNull(),
  title: varchar("title").notNull(),
  duration: integer("duration"), // in minutes
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  conversations: many(conversations),
  moodEntries: many(moodEntries),
  journalEntries: many(journalEntries),
  interventions: many(interventions),
  crisisAlerts: many(crisisAlerts),
}));

export const crisisAlertsRelations = relations(crisisAlerts, ({ one }) => ({
  user: one(users, {
    fields: [crisisAlerts.userId],
    references: [users.id],
  }),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  user: one(users, {
    fields: [conversations.userId],
    references: [users.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

export const moodEntriesRelations = relations(moodEntries, ({ one }) => ({
  user: one(users, {
    fields: [moodEntries.userId],
    references: [users.id],
  }),
}));

export const journalEntriesRelations = relations(journalEntries, ({ one }) => ({
  user: one(users, {
    fields: [journalEntries.userId],
    references: [users.id],
  }),
}));

export const interventionsRelations = relations(interventions, ({ one }) => ({
  user: one(users, {
    fields: [interventions.userId],
    references: [users.id],
  }),
}));

// Insert and select schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertMoodEntrySchema = createInsertSchema(moodEntries).omit({
  id: true,
  createdAt: true,
});

export const insertJournalEntrySchema = createInsertSchema(journalEntries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInterventionSchema = createInsertSchema(interventions).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertCrisisAlertSchema = createInsertSchema(crisisAlerts).omit({
  id: true,
  createdAt: true,
  reviewedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type MoodEntry = typeof moodEntries.$inferSelect;
export type InsertMoodEntry = z.infer<typeof insertMoodEntrySchema>;
export type JournalEntry = typeof journalEntries.$inferSelect;
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;
export type Intervention = typeof interventions.$inferSelect;
export type InsertIntervention = z.infer<typeof insertInterventionSchema>;
export type CrisisAlert = typeof crisisAlerts.$inferSelect;
export type InsertCrisisAlert = z.infer<typeof insertCrisisAlertSchema>;

// Admin Analytics Types
export type AdminAnalytics = {
  totalUsers: number;
  activeUsers: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  moodTrends: {
    averageMoodLevel: number;
    lowMoodUsers: number; // Users with consistently low mood (≤3)
    criticalMoodUsers: number; // Users with very low mood (≤2)
    moodDistribution: Record<string, number>; // Mood level distribution
  };
  conversationMetrics: {
    averageSessionDuration: number; // in minutes
    totalConversations: number;
    averageMessagesPerConversation: number;
    multipleSessionUsers: number; // Users with >1 session per day
  };
  crisisMetrics: {
    activeAlerts: number;
    alertsByType: Record<string, number>;
    alertsBySeverity: Record<string, number>;
    resolvedAlerts: number;
  };
  userBehaviorPatterns: {
    highRiskUsers: Array<{
      userId: string;
      riskLevel: "medium" | "high" | "critical";
      factors: string[];
      lastActivity: string;
    }>;
    engagementLevels: {
      high: number; // Users with >5 activities per week
      medium: number; // Users with 2-5 activities per week  
      low: number; // Users with <2 activities per week
    };
  };
};
