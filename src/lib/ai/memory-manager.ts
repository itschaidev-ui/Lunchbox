import { collection, doc, getDoc, setDoc, updateDoc, query, where, orderBy, limit, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AIMemory, Message } from '@/lib/types';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export interface ConversationSummary {
  keyPoints: string[];
  ongoingProjects: string[];
  userPreferences: string[];
  recentTopics: string[];
  summary: string;
}

/**
 * Store conversation context in Firestore
 */
export async function storeConversationContext(
  userId: string,
  messages: Message[],
  ongoingProjects: string[] = []
): Promise<void> {
  try {
    const memoryRef = doc(db, 'ai_memory', userId);
    
    // Generate summary of recent conversation
    const summary = await generateConversationSummary(messages);
    
    const memoryData: AIMemory = {
      userId,
      conversationHistory: messages.slice(-20), // Keep last 20 messages
      contextSummary: summary.summary,
      ongoingProjects: [...ongoingProjects, ...summary.ongoingProjects],
      lastUpdated: new Date().toISOString()
    };
    
    await setDoc(memoryRef, memoryData, { merge: true });
    console.log('Conversation context stored successfully');
  } catch (error) {
    console.error('Error storing conversation context:', error);
    throw error;
  }
}

/**
 * Retrieve conversation context from Firestore
 */
export async function getConversationContext(userId: string): Promise<AIMemory | null> {
  try {
    const memoryRef = doc(db, 'ai_memory', userId);
    const memoryDoc = await getDoc(memoryRef);
    
    if (memoryDoc.exists()) {
      return memoryDoc.data() as AIMemory;
    }
    
    return null;
  } catch (error) {
    console.error('Error retrieving conversation context:', error);
    return null;
  }
}

/**
 * Update ongoing projects
 */
export async function updateOngoingProjects(
  userId: string,
  projects: string[]
): Promise<void> {
  try {
    const memoryRef = doc(db, 'ai_memory', userId);
    await updateDoc(memoryRef, {
      ongoingProjects: projects,
      lastUpdated: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating ongoing projects:', error);
    throw error;
  }
}

/**
 * Clean up old conversation memories (keep last 30 days)
 */
export async function cleanupOldMemories(): Promise<void> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const memoriesRef = collection(db, 'ai_memory');
    const q = query(
      memoriesRef,
      where('lastUpdated', '<', thirtyDaysAgo.toISOString())
    );
    
    const querySnapshot = await getDocs(q);
    const batch = [];
    
    querySnapshot.forEach((docSnapshot) => {
      batch.push(docSnapshot.ref.delete());
    });
    
    if (batch.length > 0) {
      await Promise.all(batch);
      console.log(`Cleaned up ${batch.length} old memories`);
    }
  } catch (error) {
    console.error('Error cleaning up old memories:', error);
  }
}

/**
 * Generate a summary of the conversation using AI
 */
async function generateConversationSummary(messages: Message[]): Promise<ConversationSummary> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Prepare conversation text
    const conversationText = messages.map(msg => {
      const content = typeof msg.content === 'string' ? msg.content : 
        Array.isArray(msg.content) ? msg.content.map(c => c.text).join('') : '';
      return `${msg.role}: ${content}`;
    }).join('\n');
    
    const prompt = `
    Analyze this conversation and extract:
    1. Key points and important information
    2. Ongoing projects or tasks mentioned
    3. User preferences and patterns
    4. Recent topics discussed
    5. A brief summary
    
    Conversation:
    ${conversationText}
    
    Respond in JSON format:
    {
      "keyPoints": ["point1", "point2"],
      "ongoingProjects": ["project1", "project2"],
      "userPreferences": ["preference1", "preference2"],
      "recentTopics": ["topic1", "topic2"],
      "summary": "brief summary of the conversation"
    }
    `;
    
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      console.error('Error parsing conversation summary:', parseError);
      return {
        keyPoints: [],
        ongoingProjects: [],
        userPreferences: [],
        recentTopics: [],
        summary: 'Conversation summary unavailable'
      };
    }
  } catch (error) {
    console.error('Error generating conversation summary:', error);
    return {
      keyPoints: [],
      ongoingProjects: [],
      userPreferences: [],
      recentTopics: [],
      summary: 'Error generating summary'
    };
  }
}

/**
 * Get relevant context for a new conversation
 */
export async function getRelevantContext(
  userId: string,
  currentMessage: string
): Promise<string> {
  try {
    const memory = await getConversationContext(userId);
    if (!memory) return '';
    
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `
    Based on this user's conversation history and current message, provide relevant context.
    
    Current message: "${currentMessage}"
    
    User's conversation history:
    ${memory.contextSummary}
    
    Ongoing projects: ${memory.ongoingProjects.join(', ')}
    
    Provide a brief context summary that would be helpful for responding to the current message.
    Focus on:
    - Relevant previous conversations
    - Ongoing projects or tasks
    - User preferences or patterns
    - Any important details that should be remembered
    
    Keep it concise (max 200 words).
    `;
    
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Error getting relevant context:', error);
    return '';
  }
}

/**
 * Extract user preferences from conversation
 */
export async function extractUserPreferences(
  userId: string,
  messages: Message[]
): Promise<string[]> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const conversationText = messages.map(msg => {
      const content = typeof msg.content === 'string' ? msg.content : 
        Array.isArray(msg.content) ? msg.content.map(c => c.text).join('') : '';
      return `${msg.role}: ${content}`;
    }).join('\n');
    
    const prompt = `
    Analyze this conversation and extract user preferences, patterns, and habits.
    
    Conversation:
    ${conversationText}
    
    Look for:
    - Preferred communication style
    - Work patterns (morning person, night owl, etc.)
    - Task management preferences
    - Deadline preferences
    - Any recurring themes or interests
    
    Respond with a JSON array of preferences:
    ["preference1", "preference2", "preference3"]
    `;
    
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      console.error('Error parsing user preferences:', parseError);
      return [];
    }
  } catch (error) {
    console.error('Error extracting user preferences:', error);
    return [];
  }
}

/**
 * Update user preferences in memory
 */
export async function updateUserPreferences(
  userId: string,
  preferences: string[]
): Promise<void> {
  try {
    const memoryRef = doc(db, 'ai_memory', userId);
    await updateDoc(memoryRef, {
      userPreferences: preferences,
      lastUpdated: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    throw error;
  }
}

/**
 * Get conversation insights for the user
 */
export async function getConversationInsights(userId: string): Promise<{
  totalConversations: number;
  averageMessageLength: number;
  mostCommonTopics: string[];
  productivityScore: number;
}> {
  try {
    const memory = await getConversationContext(userId);
    if (!memory) {
      return {
        totalConversations: 0,
        averageMessageLength: 0,
        mostCommonTopics: [],
        productivityScore: 0
      };
    }
    
    const messages = memory.conversationHistory;
    const totalMessages = messages.length;
    
    // Calculate average message length
    const totalLength = messages.reduce((sum, msg) => {
      const content = typeof msg.content === 'string' ? msg.content : 
        Array.isArray(msg.content) ? msg.content.map(c => c.text).join('') : '';
      return sum + content.length;
    }, 0);
    
    const averageMessageLength = totalMessages > 0 ? totalLength / totalMessages : 0;
    
    // Extract topics from conversation summary
    const topics = memory.contextSummary.split(' ').filter(word => 
      word.length > 4 && !['the', 'and', 'for', 'with', 'that', 'this'].includes(word.toLowerCase())
    );
    
    // Calculate productivity score based on task-related keywords
    const productivityKeywords = ['task', 'complete', 'done', 'finish', 'deadline', 'project', 'goal'];
    const productivityScore = messages.reduce((score, msg) => {
      const content = typeof msg.content === 'string' ? msg.content : 
        Array.isArray(msg.content) ? msg.content.map(c => c.text).join('') : '';
      const keywordCount = productivityKeywords.filter(keyword => 
        content.toLowerCase().includes(keyword)
      ).length;
      return score + keywordCount;
    }, 0);
    
    return {
      totalConversations: totalMessages,
      averageMessageLength: Math.round(averageMessageLength),
      mostCommonTopics: topics.slice(0, 5),
      productivityScore: Math.min(productivityScore, 100)
    };
  } catch (error) {
    console.error('Error getting conversation insights:', error);
    return {
      totalConversations: 0,
      averageMessageLength: 0,
      mostCommonTopics: [],
      productivityScore: 0
    };
  }
}


