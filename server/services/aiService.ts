import OpenAI from "openai";
import type { Message, MoodEntry, Conversation } from "@shared/schema";
import { getPersonaById, type Persona } from "@shared/personas";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

interface AIResponse {
  content: string;
  emotionalTone: string;
  sentimentScore: number;
  recommendations?: {
    youtube?: Array<{
      title: string;
      description: string;
      searchQuery: string;
      category: 'meditation' | 'therapy' | 'music' | 'education';
    }>;
    spotify?: Array<{
      title: string;
      description: string;
      searchQuery: string;
      type: 'playlist' | 'podcast' | 'album';
    }>;
  };
}

interface JournalAnalysis {
  themes: string[];
  sentiment: string;
  insights: string[];
}

interface JournalPrompt {
  prompt: string;
  category: string;
  reasoning: string;
}

class AIService {
  async generateResponse(conversationHistory: Message[], userMessage: string, personaId: string = "sage"): Promise<AIResponse> {
    try {
      // Analyze emotional tone of user message
      const emotionalAnalysis = await this.analyzeEmotionalTone(userMessage);
      
      // Get the selected persona
      const persona = getPersonaById(personaId);
      
      // Build conversation context
      const messages = [
        {
          role: "system" as const,
          content: `${persona.systemPrompt}
          
          Core Guidelines:
          - Never provide medical or psychiatric advice
          - Focus on emotional support and self-care strategies
          - If someone expresses suicidal thoughts or crisis, encourage them to contact emergency services or crisis hotlines
          - Use evidence-based techniques appropriate to your persona
          - Keep responses conversational and supportive, not clinical
          
          The user's current emotional tone appears to be: ${emotionalAnalysis.tone}
          
          Remember to stay true to your persona as ${persona.name}, ${persona.title}.`
        },
        ...conversationHistory.slice(-10).map(msg => ({
          role: msg.role as "user" | "assistant",
          content: msg.content
        })),
        {
          role: "user" as const,
          content: userMessage
        }
      ];

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        max_tokens: 300,
        temperature: 0.7,
      });

      const aiContent = response.choices[0].message.content || "I'm here to listen and support you.";

      // Generate recommendations based on emotional state
      const recommendations = await this.generateRecommendations(emotionalAnalysis.tone, userMessage);

      return {
        content: aiContent,
        emotionalTone: emotionalAnalysis.tone,
        sentimentScore: emotionalAnalysis.score,
        recommendations,
      };
    } catch (error) {
      console.error("Error generating AI response:", error);
      return {
        content: "I'm here to support you. Could you tell me more about how you're feeling?",
        emotionalTone: "neutral",
        sentimentScore: 5,
      };
    }
  }

  async analyzeEmotionalTone(text: string): Promise<{ tone: string; score: number }> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Analyze the emotional tone of the text. Respond with JSON in this format: { 'tone': 'emotion_name', 'score': number_1_to_10 }. Score represents emotional intensity/distress level where 1 is very positive/calm and 10 is extremely distressed/negative."
          },
          {
            role: "user",
            content: text
          }
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || '{"tone": "neutral", "score": 5}');
      
      return {
        tone: result.tone || "neutral",
        score: Math.max(1, Math.min(10, result.score || 5)),
      };
    } catch (error) {
      console.error("Error analyzing emotional tone:", error);
      return { tone: "neutral", score: 5 };
    }
  }

  async analyzeJournalEntry(content: string): Promise<JournalAnalysis> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Analyze this journal entry for emotional themes and insights. Respond with JSON in this format:
            {
              "themes": ["theme1", "theme2", "theme3"],
              "sentiment": "overall_sentiment",
              "insights": ["insight1", "insight2"]
            }
            
            Focus on emotional wellness themes like: anxiety, depression, stress, gratitude, growth, relationships, work-life balance, self-care, etc.`
          },
          {
            role: "user",
            content: content
          }
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || '{"themes": [], "sentiment": "neutral", "insights": []}');
      
      return {
        themes: result.themes || [],
        sentiment: result.sentiment || "neutral",
        insights: result.insights || [],
      };
    } catch (error) {
      console.error("Error analyzing journal entry:", error);
      return {
        themes: [],
        sentiment: "neutral",
        insights: [],
      };
    }
  }

  async generateJournalPrompts(latestMood?: MoodEntry | null, recentConversations?: Conversation[]): Promise<JournalPrompt[]> {
    try {
      let context = "Generate personalized journal prompts for emotional wellness and self-reflection.";
      
      if (latestMood) {
        context += ` The user's recent mood level is ${latestMood.moodLevel}/10`;
        if (latestMood.anxietyLevel) {
          context += ` with anxiety level ${latestMood.anxietyLevel}/5`;
        }
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `${context}
            
            Generate 3 thoughtful journal prompts. Respond with JSON in this format:
            {
              "prompts": [
                {
                  "prompt": "prompt_text",
                  "category": "category_name",
                  "reasoning": "why_this_prompt_is_helpful"
                }
              ]
            }
            
            Categories can include: gratitude, self-reflection, goal-setting, emotional-processing, stress-management, relationships, personal-growth`
          },
          {
            role: "user",
            content: "Please generate personalized journal prompts for me."
          }
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || '{"prompts": []}');
      
      return result.prompts || [];
    } catch (error) {
      console.error("Error generating journal prompts:", error);
      return [
        {
          prompt: "What are three things you're grateful for today, and how did they make you feel?",
          category: "gratitude",
          reasoning: "Gratitude practice can improve mood and emotional well-being"
        }
      ];
    }
  }

  async detectCrisis(text: string): Promise<boolean> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Analyze this text for signs of mental health crisis, including:
            - Suicidal ideation or self-harm mentions
            - Expressions of hopelessness or despair
            - Threats to harm others
            - Severe mental health crisis indicators
            
            Respond with JSON: { "crisis_detected": boolean, "severity": "low|medium|high|critical" }`
          },
          {
            role: "user",
            content: text
          }
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || '{"crisis_detected": false, "severity": "low"}');
      return result.crisis_detected || false;
    } catch (error) {
      console.error("Error detecting crisis:", error);
      return false;
    }
  }

  async generateRecommendations(emotionalTone: string, userMessage: string) {
    try {
      const prompt = `Based on someone feeling "${emotionalTone}" and their message: "${userMessage}", suggest helpful resources:
      
      Provide exactly 1 YouTube recommendation and 1 Spotify recommendation that would be therapeutically beneficial.
      Focus on evidence-based content like guided meditations, therapy techniques, calming music, or educational content.
      
      Format as JSON with exactly one YouTube and one Spotify recommendation:
      {
        "youtube": {
          "title": "Specific video title or type",
          "description": "Why this helps with ${emotionalTone}",
          "searchQuery": "search terms for YouTube",
          "category": "meditation|therapy|music|education"
        },
        "spotify": {
          "title": "Playlist/podcast name",
          "description": "How this supports emotional wellness",
          "searchQuery": "search terms for Spotify",
          "type": "playlist|podcast|album"
        }
      }`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a mental health resource curator. Provide only legitimate, therapeutic content recommendations. Focus on established mindfulness teachers, licensed therapists, evidence-based techniques, and calming music from reputable sources. Respond with valid JSON only, no markdown formatting."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.3,
        response_format: { type: "json_object" },
      });

      const content = response.choices[0].message.content;
      if (content) {
        try {
          // Clean content by removing markdown code blocks
          const cleanedContent = content.replace(/```json\s*|\s*```/g, '').trim();
          return JSON.parse(cleanedContent);
        } catch (parseError) {
          console.error("Failed to parse recommendations JSON:", parseError);
          return this.getFallbackRecommendations(emotionalTone);
        }
      }
      
      return this.getFallbackRecommendations(emotionalTone);
    } catch (error) {
      console.error("Error generating recommendations:", error);
      return this.getFallbackRecommendations(emotionalTone);
    }
  }

  getFallbackRecommendations(emotionalTone: string) {
    const recommendations = {
      anxious: {
        youtube: { title: "10-Minute Anxiety Relief Meditation", description: "Guided breathing to calm anxiety", searchQuery: "anxiety meditation guided breathing", category: "meditation" as const },
        spotify: { title: "Anxiety & Stress Relief", description: "Calming instrumental music", searchQuery: "anxiety relief music playlist", type: "playlist" as const }
      },
      sad: {
        youtube: { title: "Loving-Kindness Meditation", description: "Self-compassion for difficult emotions", searchQuery: "loving kindness meditation sadness", category: "meditation" as const },
        spotify: { title: "Peaceful Piano", description: "Gentle piano for emotional healing", searchQuery: "peaceful piano calm music", type: "playlist" as const }
      },
      stressed: {
        youtube: { title: "Progressive Muscle Relaxation", description: "Physical tension release", searchQuery: "progressive muscle relaxation stress", category: "meditation" as const },
        spotify: { title: "Deep Focus", description: "Ambient sounds for concentration", searchQuery: "focus music stress relief", type: "playlist" as const }
      }
    };

    return recommendations[emotionalTone.toLowerCase() as keyof typeof recommendations] || recommendations.stressed;
  }
}

export default new AIService();
