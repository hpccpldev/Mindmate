import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import aiService from "./services/aiService";
import { getAllPersonas, getPersonaById } from "@shared/personas";
import {
  insertMessageSchema,
  insertMoodEntrySchema,
  insertJournalEntrySchema,
  insertInterventionSchema,
  type AdminAnalytics,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Admin login endpoint
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { email, password, adminKey } = req.body;
      
      // Simple admin authentication check - trim whitespace and normalize
      const normalizedAdminKey = adminKey?.trim();
      const expectedKey = "MOODMATE_ADMIN_2025";
      const adminKeyValid = normalizedAdminKey === expectedKey;
      
      console.log("Admin login attempt:", { email, adminKey: normalizedAdminKey, expected: expectedKey, valid: adminKeyValid });
      
      if (!adminKeyValid) {
        return res.status(401).json({ message: "Invalid admin key" });
      }
      
      // Check if user exists and is admin
      const user = await storage.getUserByEmail(email);
      if (!user || !user.isAdmin) {
        return res.status(401).json({ message: "Invalid admin credentials" });
      }
      
      // In a real app, you'd verify password hash here
      // For demo purposes, we'll accept any password for admin users
      
      // Set admin session
      (req.session as any).adminAuthenticated = true;
      (req.session as any).adminUserId = user.id;
      
      res.json({ message: "Admin authenticated successfully", userId: user.id });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ message: "Admin login failed" });
    }
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Notifications route
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Generate mock notifications based on user activity
      const notifications = [
        {
          id: 1,
          message: "Great job completing your mood check-in today! 🌟",
          type: "achievement",
          read: false,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        },
        {
          id: 2,
          message: "Your weekly wellness summary is ready to view",
          type: "report",
          read: false,
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        },
        {
          id: 3,
          message: "Remember to take a few minutes for mindful breathing today",
          type: "reminder",
          read: true,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        }
      ];
      
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // Persona routes
  app.get('/api/personas', (req, res) => {
    res.json(getAllPersonas());
  });

  app.put('/api/user/persona', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { personaId } = req.body;
      
      const updatedUser = await storage.updateUserPersona(userId, personaId);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating persona:", error);
      res.status(500).json({ message: "Failed to update persona" });
    }
  });

  // Conversation routes
  app.get('/api/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversations = await storage.getUserConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.post('/api/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const conversation = await storage.createConversation({
        userId,
        title: req.body.title || "New Conversation",
        personaId: req.body.personaId || user?.selectedPersona || "sage",
      });
      res.json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ message: "Failed to create conversation" });
    }
  });

  app.get('/api/conversations/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversationId = parseInt(req.params.id);
      const conversation = await storage.getConversationWithMessages(conversationId, userId);
      
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      res.json(conversation);
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ message: "Failed to fetch conversation" });
    }
  });

  // Message routes
  app.post('/api/conversations/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversationId = parseInt(req.params.id);
      
      // Validate input
      const messageData = insertMessageSchema.parse({
        ...req.body,
        conversationId,
      });

      // Add user message
      const userMessage = await storage.addMessage(messageData);

      // Generate AI response
      const conversation = await storage.getConversationWithMessages(conversationId, userId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      const aiResponse = await aiService.generateResponse(conversation.messages, messageData.content, conversation.personaId || "sage");
      
      // Add AI message
      const aiMessage = await storage.addMessage({
        conversationId,
        role: "assistant",
        content: aiResponse.content,
        emotionalTone: aiResponse.emotionalTone,
        sentimentScore: aiResponse.sentimentScore,
        recommendations: aiResponse.recommendations,
      });

      res.json({ userMessage, aiMessage });
    } catch (error) {
      console.error("Error adding message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Mood tracking routes
  app.post('/api/mood-entries', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const moodData = insertMoodEntrySchema.parse({
        ...req.body,
        userId,
      });

      const moodEntry = await storage.addMoodEntry(moodData);
      res.json(moodEntry);
    } catch (error) {
      console.error("Error adding mood entry:", error);
      res.status(500).json({ message: "Failed to add mood entry" });
    }
  });

  app.get('/api/mood-entries', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { startDate, endDate } = req.query;
      
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      
      const moodEntries = await storage.getUserMoodEntries(userId, start, end);
      res.json(moodEntries);
    } catch (error) {
      console.error("Error fetching mood entries:", error);
      res.status(500).json({ message: "Failed to fetch mood entries" });
    }
  });

  app.get('/api/mood-entries/latest', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const latestEntry = await storage.getLatestMoodEntry(userId);
      res.json(latestEntry || null);
    } catch (error) {
      console.error("Error fetching latest mood entry:", error);
      res.status(500).json({ message: "Failed to fetch latest mood entry" });
    }
  });

  // Journal routes
  app.post('/api/journal-entries', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const journalData = insertJournalEntrySchema.parse({
        ...req.body,
        userId,
      });

      // Analyze content with AI for emotional themes
      const analysis = await aiService.analyzeJournalEntry(journalData.content);
      
      const journalEntry = await storage.createJournalEntry({
        ...journalData,
        emotionalThemes: analysis.themes,
      });
      
      res.json(journalEntry);
    } catch (error) {
      console.error("Error creating journal entry:", error);
      res.status(500).json({ message: "Failed to create journal entry" });
    }
  });

  app.get('/api/journal-entries', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 20;
      const journalEntries = await storage.getUserJournalEntries(userId, limit);
      res.json(journalEntries);
    } catch (error) {
      console.error("Error fetching journal entries:", error);
      res.status(500).json({ message: "Failed to fetch journal entries" });
    }
  });

  app.get('/api/journal-entries/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const entryId = parseInt(req.params.id);
      const entry = await storage.getJournalEntry(entryId, userId);
      
      if (!entry) {
        return res.status(404).json({ message: "Journal entry not found" });
      }
      
      res.json(entry);
    } catch (error) {
      console.error("Error fetching journal entry:", error);
      res.status(500).json({ message: "Failed to fetch journal entry" });
    }
  });

  // Generate AI journal prompts
  app.post('/api/journal-prompts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get recent mood and conversation context
      const latestMood = await storage.getLatestMoodEntry(userId);
      const recentConversations = await storage.getUserConversations(userId);
      
      const prompts = await aiService.generateJournalPrompts(latestMood, recentConversations.slice(0, 3));
      res.json(prompts);
    } catch (error) {
      console.error("Error generating journal prompts:", error);
      res.status(500).json({ message: "Failed to generate journal prompts" });
    }
  });

  // Intervention routes
  app.post('/api/interventions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const interventionData = insertInterventionSchema.parse({
        ...req.body,
        userId,
      });

      const intervention = await storage.createIntervention(interventionData);
      res.json(intervention);
    } catch (error) {
      console.error("Error creating intervention:", error);
      res.status(500).json({ message: "Failed to create intervention" });
    }
  });

  app.get('/api/interventions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const interventions = await storage.getUserInterventions(userId);
      res.json(interventions);
    } catch (error) {
      console.error("Error fetching interventions:", error);
      res.status(500).json({ message: "Failed to fetch interventions" });
    }
  });

  app.post('/api/interventions/:id/complete', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const interventionId = parseInt(req.params.id);
      const intervention = await storage.completeIntervention(interventionId, userId);
      
      if (!intervention) {
        return res.status(404).json({ message: "Intervention not found" });
      }
      
      res.json(intervention);
    } catch (error) {
      console.error("Error completing intervention:", error);
      res.status(500).json({ message: "Failed to complete intervention" });
    }
  });

  // Analytics and insights
  app.get('/api/analytics/dashboard', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      // Get week's data
      const [conversations, moodEntries, journalEntries, interventions] = await Promise.all([
        storage.getUserConversations(userId),
        storage.getUserMoodEntries(userId, oneWeekAgo),
        storage.getUserJournalEntries(userId, 10),
        storage.getUserInterventions(userId),
      ]);

      const weeklyStats = {
        conversations: conversations.filter(c => c.createdAt && c.createdAt >= oneWeekAgo).length,
        moodCheckIns: moodEntries.length,
        journalEntries: journalEntries.filter(j => j.createdAt && j.createdAt >= oneWeekAgo).length,
        completedInterventions: interventions.filter(i => i.completed && i.completedAt && i.completedAt >= oneWeekAgo).length,
        streak: await calculateStreak(userId, storage),
      };

      res.json({
        weeklyStats,
        recentMoodEntries: moodEntries.slice(0, 7),
        recentJournalEntries: journalEntries.slice(0, 5),
      });
    } catch (error) {
      console.error("Error fetching dashboard analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Admin middleware - check if user is admin
  const isAdmin = async (req: any, res: any, next: any) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      next();
    } catch (error) {
      res.status(500).json({ message: "Failed to verify admin status" });
    }
  };

  // Admin Analytics Routes
  // Admin middleware to check admin session
  const isAdminAuthenticated = (req: any, res: any, next: any) => {
    if (!(req.session as any)?.adminAuthenticated) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  app.get('/api/admin/analytics', isAdminAuthenticated, async (req: any, res) => {
    try {
      const analytics = await calculateAdminAnalytics(storage);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching admin analytics:", error);
      res.status(500).json({ message: "Failed to fetch admin analytics" });
    }
  });

  app.get('/api/admin/crisis-alerts', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const alerts = await storage.getCrisisAlerts();
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching crisis alerts:", error);
      res.status(500).json({ message: "Failed to fetch crisis alerts" });
    }
  });

  app.put('/api/admin/crisis-alerts/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const alertId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const { status, notes } = req.body;
      
      const updatedAlert = await storage.updateCrisisAlert(alertId, {
        status,
        notes,
        reviewedBy: userId,
        reviewedAt: new Date(),
      });
      
      res.json(updatedAlert);
    } catch (error) {
      console.error("Error updating crisis alert:", error);
      res.status(500).json({ message: "Failed to update crisis alert" });
    }
  });

  app.get('/api/admin/users/risk-assessment', isAdminAuthenticated, async (req: any, res) => {
    try {
      const riskAssessment = await calculateUserRiskAssessment(storage);
      res.json(riskAssessment);
    } catch (error) {
      console.error("Error fetching risk assessment:", error);
      res.status(500).json({ message: "Failed to fetch risk assessment" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to calculate user's current streak
async function calculateStreak(userId: string, storage: any): Promise<number> {
  const entries = await storage.getUserMoodEntries(userId);
  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  for (const entry of entries) {
    const entryDate = new Date(entry.date);
    entryDate.setHours(0, 0, 0, 0);
    
    if (entryDate.getTime() === currentDate.getTime()) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

// Admin analytics calculation functions
async function calculateAdminAnalytics(storage: any): Promise<AdminAnalytics> {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Get all data needed for analytics
  const [allUsers, allMoodEntries, allConversations, allMessages, allCrisisAlerts] = await Promise.all([
    storage.getAllUsers(),
    storage.getAllMoodEntries(),
    storage.getAllConversations(),
    storage.getAllMessages(),
    storage.getCrisisAlerts(),
  ]);

  // Calculate user metrics
  const totalUsers = allUsers.length;
  const dailyActiveUsers = allUsers.filter((u: any) => u.lastLoginAt && u.lastLoginAt >= oneDayAgo).length;
  const weeklyActiveUsers = allUsers.filter((u: any) => u.lastLoginAt && u.lastLoginAt >= oneWeekAgo).length;
  const monthlyActiveUsers = allUsers.filter((u: any) => u.lastLoginAt && u.lastLoginAt >= oneMonthAgo).length;

  // Calculate mood trends
  const averageMoodLevel = allMoodEntries.length > 0 
    ? allMoodEntries.reduce((sum: number, entry: any) => sum + entry.moodLevel, 0) / allMoodEntries.length 
    : 0;

  // Users with consistently low mood (≤3) in their last 3 entries
  const lowMoodUsers = allUsers.filter((user: any) => {
    const userMoods = allMoodEntries
      .filter((m: any) => m.userId === user.id)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
    return userMoods.length >= 2 && userMoods.every((m: any) => m.moodLevel <= 3);
  }).length;

  // Users with very low mood (≤2) in recent entries  
  const criticalMoodUsers = allUsers.filter((user: any) => {
    const userMoods = allMoodEntries
      .filter((m: any) => m.userId === user.id)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 2);
    return userMoods.length >= 1 && userMoods.some((m: any) => m.moodLevel <= 2);
  }).length;

  // Mood distribution
  const moodDistribution: Record<string, number> = {};
  for (let i = 1; i <= 10; i++) {
    moodDistribution[i.toString()] = allMoodEntries.filter((m: any) => m.moodLevel === i).length;
  }

  // Conversation metrics
  const conversationsWithMessages = allConversations.map((conv: any) => {
    const convMessages = allMessages.filter((m: any) => m.conversationId === conv.id);
    return { ...conv, messageCount: convMessages.length };
  });

  const avgMessagesPerConversation = conversationsWithMessages.length > 0
    ? conversationsWithMessages.reduce((sum: number, conv: any) => sum + conv.messageCount, 0) / conversationsWithMessages.length
    : 0;

  // Calculate average session duration (estimate based on message timestamps)
  let totalSessionDuration = 0;
  let sessionCount = 0;
  
  conversationsWithMessages.forEach((conv: any) => {
    const convMessages = allMessages
      .filter((m: any) => m.conversationId === conv.id)
      .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    if (convMessages.length >= 2) {
      const sessionStart = new Date(convMessages[0].createdAt);
      const sessionEnd = new Date(convMessages[convMessages.length - 1].createdAt);
      const duration = (sessionEnd.getTime() - sessionStart.getTime()) / (1000 * 60); // minutes
      if (duration < 120) { // Filter out unrealistic durations (>2 hours)
        totalSessionDuration += duration;
        sessionCount++;
      }
    }
  });

  const averageSessionDuration = sessionCount > 0 ? totalSessionDuration / sessionCount : 0;

  // Users with multiple sessions per day (approximate)
  const multipleSessionUsers = allUsers.filter((user: any) => {
    const userConversations = allConversations.filter((c: any) => c.userId === user.id);
    const today = new Date().toDateString();
    const todayConversations = userConversations.filter((c: any) => 
      new Date(c.createdAt).toDateString() === today
    );
    return todayConversations.length > 1;
  }).length;

  // Crisis metrics
  const activeAlerts = allCrisisAlerts.filter((alert: any) => alert.status === 'new').length;
  const resolvedAlerts = allCrisisAlerts.filter((alert: any) => alert.status === 'resolved').length;

  const alertsByType: Record<string, number> = {};
  const alertsBySeverity: Record<string, number> = {};

  allCrisisAlerts.forEach((alert: any) => {
    alertsByType[alert.triggerType] = (alertsByType[alert.triggerType] || 0) + 1;
    alertsBySeverity[alert.severity] = (alertsBySeverity[alert.severity] || 0) + 1;
  });

  // High-risk users calculation
  const highRiskUsers = await calculateHighRiskUsers(allUsers, allMoodEntries, allConversations, storage);

  // Engagement levels
  const engagementLevels = calculateEngagementLevels(allUsers, allMoodEntries, allConversations, oneWeekAgo);

  return {
    totalUsers,
    activeUsers: {
      daily: dailyActiveUsers,
      weekly: weeklyActiveUsers,
      monthly: monthlyActiveUsers,
    },
    moodTrends: {
      averageMoodLevel: Math.round(averageMoodLevel * 10) / 10,
      lowMoodUsers,
      criticalMoodUsers,
      moodDistribution,
    },
    conversationMetrics: {
      averageSessionDuration: Math.round(averageSessionDuration * 10) / 10,
      totalConversations: allConversations.length,
      averageMessagesPerConversation: Math.round(avgMessagesPerConversation * 10) / 10,
      multipleSessionUsers,
    },
    crisisMetrics: {
      activeAlerts,
      alertsByType,
      alertsBySeverity,
      resolvedAlerts,
    },
    userBehaviorPatterns: {
      highRiskUsers,
      engagementLevels,
    },
  };
}

async function calculateHighRiskUsers(allUsers: any[], allMoodEntries: any[], allConversations: any[], storage: any) {
  const highRiskUsers: any[] = [];

  for (const user of allUsers) {
    const userMoods = allMoodEntries
      .filter((m: any) => m.userId === user.id)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    const userConversations = allConversations.filter((c: any) => c.userId === user.id);
    
    const riskFactors: string[] = [];
    let riskLevel: "medium" | "high" | "critical" = "medium";

    // Check for consistently low mood
    const recentMoods = userMoods.slice(0, 5);
    if (recentMoods.length >= 3 && recentMoods.every(m => m.moodLevel <= 2)) {
      riskFactors.push("Critical mood pattern (≤2)");
      riskLevel = "critical";
    } else if (recentMoods.length >= 3 && recentMoods.every(m => m.moodLevel <= 3)) {
      riskFactors.push("Consistently low mood (≤3)");
      riskLevel = "high";
    }

    // Check for concerning keywords in mood notes
    const concerningKeywords = ["suicide", "kill myself", "end it all", "worthless", "hopeless", "can't go on"];
    const hasConcerningNotes = userMoods.some(m => 
      m.notes && concerningKeywords.some(keyword => 
        m.notes.toLowerCase().includes(keyword)
      )
    );
    
    if (hasConcerningNotes) {
      riskFactors.push("Crisis keywords detected");
      riskLevel = "critical";
    }

    // Check for social isolation (no conversations in past week)
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentConversations = userConversations.filter(c => 
      new Date(c.createdAt) >= oneWeekAgo
    );
    
    if (recentConversations.length === 0 && userMoods.length > 0) {
      riskFactors.push("Social withdrawal");
      riskLevel = riskLevel === "critical" ? "critical" : "high";
    }

    // Check for dramatic mood changes
    if (userMoods.length >= 3) {
      const moodChanges = [];
      for (let i = 0; i < userMoods.length - 1; i++) {
        moodChanges.push(Math.abs(userMoods[i].moodLevel - userMoods[i + 1].moodLevel));
      }
      const avgChange = moodChanges.reduce((sum, change) => sum + change, 0) / moodChanges.length;
      
      if (avgChange > 4) {
        riskFactors.push("Extreme mood swings");
        riskLevel = riskLevel === "critical" ? "critical" : "high";
      }
    }

    // Only include users with risk factors
    if (riskFactors.length > 0) {
      highRiskUsers.push({
        userId: user.id,
        riskLevel,
        factors: riskFactors,
        lastActivity: userMoods.length > 0 ? userMoods[0].createdAt : userConversations[0]?.createdAt || user.lastLoginAt,
      });
    }
  }

  return highRiskUsers.sort((a, b) => {
    const riskOrder: Record<string, number> = { critical: 3, high: 2, medium: 1 };
    return riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
  });
}

function calculateEngagementLevels(allUsers: any[], allMoodEntries: any[], allConversations: any[], oneWeekAgo: Date) {
  let high = 0, medium = 0, low = 0;

  allUsers.forEach(user => {
    const userMoods = allMoodEntries.filter(m => 
      m.userId === user.id && new Date(m.createdAt) >= oneWeekAgo
    );
    const userConversations = allConversations.filter(c => 
      c.userId === user.id && new Date(c.createdAt) >= oneWeekAgo
    );
    
    const totalActivities = userMoods.length + userConversations.length;
    
    if (totalActivities >= 5) {
      high++;
    } else if (totalActivities >= 2) {
      medium++;
    } else {
      low++;
    }
  });

  return { high, medium, low };
}

async function calculateUserRiskAssessment(storage: any) {
  const analytics = await calculateAdminAnalytics(storage);
  return {
    highRiskUsers: analytics.userBehaviorPatterns.highRiskUsers,
    criticalAlerts: analytics.crisisMetrics.activeAlerts,
    interventionRecommendations: generateInterventionRecommendations(analytics),
  };
}

function generateInterventionRecommendations(analytics: AdminAnalytics) {
  const recommendations = [];

  if (analytics.userBehaviorPatterns.highRiskUsers.length > 0) {
    recommendations.push({
      priority: "high",
      type: "crisis_intervention",
      message: `${analytics.userBehaviorPatterns.highRiskUsers.length} users identified as high-risk. Immediate outreach recommended.`,
      actionItems: [
        "Review crisis alerts and user patterns",
        "Consider wellness check-ins for critical users",
        "Deploy targeted mental health resources",
      ],
    });
  }

  if (analytics.moodTrends.criticalMoodUsers > analytics.totalUsers * 0.1) {
    recommendations.push({
      priority: "medium",
      type: "mood_intervention",
      message: `${analytics.moodTrends.criticalMoodUsers} users showing critical mood patterns (>10% of user base).`,
      actionItems: [
        "Launch mood improvement campaigns",
        "Increase therapy resource visibility",
        "Deploy positive intervention content",
      ],
    });
  }

  if (analytics.userBehaviorPatterns.engagementLevels.low > analytics.totalUsers * 0.3) {
    recommendations.push({
      priority: "low",
      type: "engagement_boost",
      message: `${analytics.userBehaviorPatterns.engagementLevels.low} users show low engagement (>30% of user base).`,
      actionItems: [
        "Send re-engagement emails",
        "Highlight app benefits and features",
        "Personalized wellness reminders",
      ],
    });
  }

  return recommendations;
}
