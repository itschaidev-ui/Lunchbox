import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Task, TaskFile, Message } from '@/lib/types';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export interface IntelligentTaskResult {
  task: Partial<Task>;
  followUpQuestions?: string[];
  suggestions?: string[];
  confidence: number;
  missingInfo: string[];
}

export interface TaskAnalysis {
  hasTitle: boolean;
  hasDueDate: boolean;
  hasDescription: boolean;
  urgency: 'low' | 'medium' | 'high';
  category?: string;
  estimatedDuration?: number; // in minutes
}

/**
 * Create an intelligent task with context-aware follow-up questions
 */
export async function createIntelligentTask(
  userInput: string,
  uploadedFiles: TaskFile[],
  conversationHistory: Message[],
  existingTasks: Task[]
): Promise<IntelligentTaskResult> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    // Build context string
    let contextString = '';
    
    // Add uploaded files context
    if (uploadedFiles.length > 0) {
      contextString += '\nUPLOADED FILES:\n';
      uploadedFiles.forEach((file, index) => {
        contextString += `${index + 1}. ${file.fileName} (${file.fileType})\n`;
        if (file.summary) {
          contextString += `   Summary: ${file.summary}\n`;
        }
        if (file.extractedText) {
          contextString += `   Content: ${file.extractedText.substring(0, 300)}...\n`;
        }
      });
    }
    
    // Add conversation history context
    if (conversationHistory.length > 0) {
      contextString += '\nRECENT CONVERSATION:\n';
      conversationHistory.slice(-5).forEach(msg => {
        const content = typeof msg.content === 'string' ? msg.content : 
          Array.isArray(msg.content) ? msg.content.map(c => c.text).join('') : '';
        contextString += `${msg.role}: ${content.substring(0, 200)}...\n`;
      });
    }
    
    // Add existing tasks context
    if (existingTasks.length > 0) {
      contextString += '\nEXISTING TASKS:\n';
      existingTasks.slice(0, 10).forEach(task => {
        contextString += `- ${task.text}${task.dueDate ? ` (due: ${task.dueDate})` : ''}\n`;
      });
    }
    
    const prompt = `
    Analyze this task request and provide intelligent follow-up questions and suggestions.
    
    USER REQUEST: "${userInput}"
    ${contextString}
    
    Please analyze and respond with JSON:
    {
      "analysis": {
        "hasTitle": boolean,
        "hasDueDate": boolean,
        "hasDescription": boolean,
        "urgency": "low" | "medium" | "high",
        "category": "string (optional)",
        "estimatedDuration": number (minutes, optional)
      },
      "task": {
        "text": "extracted or suggested title",
        "description": "suggested description (optional)",
        "dueDate": "ISO date string (optional)"
      },
      "followUpQuestions": ["question1", "question2"],
      "suggestions": ["suggestion1", "suggestion2"],
      "missingInfo": ["missing field1", "missing field2"]
    }
    
    Guidelines:
    - Extract task title from user input or suggest one
    - Parse natural language dates ("tomorrow", "next Friday", "in 3 days")
    - Ask specific questions about missing information
    - Consider urgency based on keywords and context
    - Suggest relevant categories based on content
    - Estimate duration based on task type
    - Check for conflicts with existing tasks
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    try {
      const analysis = JSON.parse(responseText);
      return {
        task: analysis.task || {},
        followUpQuestions: analysis.followUpQuestions || [],
        suggestions: analysis.suggestions || [],
        confidence: 0.8,
        missingInfo: analysis.missingInfo || []
      };
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      return {
        task: { text: userInput },
        followUpQuestions: ['When would you like this completed?', 'Any specific details?'],
        suggestions: [],
        confidence: 0.5,
        missingInfo: ['dueDate', 'description']
      };
    }
  } catch (error) {
    console.error('Error in createIntelligentTask:', error);
    return {
      task: { text: userInput },
      followUpQuestions: ['When would you like this completed?'],
      suggestions: [],
      confidence: 0.3,
      missingInfo: ['dueDate']
    };
  }
}

/**
 * Parse natural language dates into ISO format
 */
export function parseNaturalLanguageDate(dateString: string): string | null {
  const now = new Date();
  const lowerDate = dateString.toLowerCase().trim();
  
  // Handle relative dates
  if (lowerDate.includes('today')) {
    return now.toISOString();
  }
  
  if (lowerDate.includes('tomorrow')) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString();
  }
  
  if (lowerDate.includes('next week')) {
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek.toISOString();
  }
  
  if (lowerDate.includes('next month')) {
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return nextMonth.toISOString();
  }
  
  // Handle "in X days"
  const daysMatch = lowerDate.match(/in (\d+) days?/);
  if (daysMatch) {
    const days = parseInt(daysMatch[1]);
    const futureDate = new Date(now);
    futureDate.setDate(futureDate.getDate() + days);
    return futureDate.toISOString();
  }
  
  // Handle "in X weeks"
  const weeksMatch = lowerDate.match(/in (\d+) weeks?/);
  if (weeksMatch) {
    const weeks = parseInt(weeksMatch[1]);
    const futureDate = new Date(now);
    futureDate.setDate(futureDate.getDate() + (weeks * 7));
    return futureDate.toISOString();
  }
  
  // Handle specific days of the week
  const dayMap: { [key: string]: number } = {
    'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4,
    'friday': 5, 'saturday': 6, 'sunday': 0
  };
  
  for (const [day, dayNum] of Object.entries(dayMap)) {
    if (lowerDate.includes(day)) {
      const targetDate = new Date(now);
      const currentDay = targetDate.getDay();
      const daysUntilTarget = (dayNum - currentDay + 7) % 7;
      targetDate.setDate(targetDate.getDate() + daysUntilTarget);
      return targetDate.toISOString();
    }
  }
  
  return null;
}

/**
 * Analyze task urgency based on content and context
 */
export function analyzeTaskUrgency(
  taskText: string,
  dueDate?: string,
  conversationHistory: Message[] = []
): 'low' | 'medium' | 'high' {
  const text = taskText.toLowerCase();
  const conversation = conversationHistory.map(msg => 
    typeof msg.content === 'string' ? msg.content : 
    Array.isArray(msg.content) ? msg.content.map(c => c.text).join('') : ''
  ).join(' ').toLowerCase();
  
  // High urgency keywords
  const highUrgencyKeywords = [
    'urgent', 'asap', 'immediately', 'emergency', 'critical', 'deadline',
    'due today', 'due tomorrow', 'rush', 'priority'
  ];
  
  // Medium urgency keywords
  const mediumUrgencyKeywords = [
    'soon', 'important', 'deadline', 'due', 'schedule', 'appointment'
  ];
  
  // Check for high urgency
  if (highUrgencyKeywords.some(keyword => 
    text.includes(keyword) || conversation.includes(keyword)
  )) {
    return 'high';
  }
  
  // Check for medium urgency
  if (mediumUrgencyKeywords.some(keyword => 
    text.includes(keyword) || conversation.includes(keyword)
  )) {
    return 'medium';
  }
  
  // Check due date proximity
  if (dueDate) {
    const due = new Date(dueDate);
    const now = new Date();
    const hoursUntilDue = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilDue <= 24) return 'high';
    if (hoursUntilDue <= 72) return 'medium';
  }
  
  return 'low';
}

/**
 * Suggest task categories based on content
 */
export function suggestTaskCategory(taskText: string, uploadedFiles: TaskFile[] = []): string {
  const text = taskText.toLowerCase();
  
  // Academic keywords
  if (text.includes('homework') || text.includes('assignment') || text.includes('study') || 
      text.includes('exam') || text.includes('project') || text.includes('essay')) {
    return 'academic';
  }
  
  // Work keywords
  if (text.includes('meeting') || text.includes('presentation') || text.includes('report') ||
      text.includes('email') || text.includes('call') || text.includes('work')) {
    return 'work';
  }
  
  // Personal keywords
  if (text.includes('grocery') || text.includes('shopping') || text.includes('appointment') ||
      text.includes('doctor') || text.includes('dentist') || text.includes('personal')) {
    return 'personal';
  }
  
  // Health keywords
  if (text.includes('exercise') || text.includes('gym') || text.includes('workout') ||
      text.includes('health') || text.includes('medical')) {
    return 'health';
  }
  
  // Financial keywords
  if (text.includes('bill') || text.includes('payment') || text.includes('budget') ||
      text.includes('expense') || text.includes('financial')) {
    return 'financial';
  }
  
  // Check uploaded files for context
  const fileCategories = uploadedFiles.flatMap(file => file.tags || []);
  if (fileCategories.includes('homework') || fileCategories.includes('academic')) {
    return 'academic';
  }
  if (fileCategories.includes('work') || fileCategories.includes('business')) {
    return 'work';
  }
  
  return 'general';
}

/**
 * Estimate task duration based on content and category
 */
export function estimateTaskDuration(
  taskText: string,
  category: string,
  uploadedFiles: TaskFile[] = []
): number {
  const text = taskText.toLowerCase();
  
  // Quick tasks (5-15 minutes)
  if (text.includes('call') || text.includes('email') || text.includes('message') ||
      text.includes('reminder') || text.includes('check')) {
    return 10;
  }
  
  // Short tasks (15-30 minutes)
  if (text.includes('meeting') || text.includes('appointment') || text.includes('review')) {
    return 25;
  }
  
  // Medium tasks (30-60 minutes)
  if (text.includes('homework') || text.includes('assignment') || text.includes('report')) {
    return 45;
  }
  
  // Long tasks (1-3 hours)
  if (text.includes('project') || text.includes('presentation') || text.includes('study') ||
      text.includes('research') || text.includes('analysis')) {
    return 120;
  }
  
  // Very long tasks (3+ hours)
  if (text.includes('thesis') || text.includes('dissertation') || text.includes('major project')) {
    return 240;
  }
  
  // Category-based estimates
  switch (category) {
    case 'academic':
      return 60;
    case 'work':
      return 45;
    case 'personal':
      return 30;
    case 'health':
      return 60;
    case 'financial':
      return 20;
    default:
      return 30;
  }
}

/**
 * Check for task conflicts with existing tasks
 */
export function checkTaskConflicts(
  newTask: Partial<Task>,
  existingTasks: Task[]
): { hasConflict: boolean; conflictingTasks: Task[]; suggestions: string[] } {
  const conflicts: Task[] = [];
  const suggestions: string[] = [];
  
  if (!newTask.dueDate) {
    return { hasConflict: false, conflictingTasks: [], suggestions: [] };
  }
  
  const newDueDate = new Date(newTask.dueDate);
  
  // Check for tasks on the same day
  const sameDayTasks = existingTasks.filter(task => {
    if (!task.dueDate) return false;
    const taskDate = new Date(task.dueDate);
    return taskDate.toDateString() === newDueDate.toDateString();
  });
  
  if (sameDayTasks.length >= 3) {
    conflicts.push(...sameDayTasks);
    suggestions.push(`You have ${sameDayTasks.length} tasks on ${newDueDate.toDateString()}. Consider spreading them out.`);
  }
  
  // Check for similar task names
  const similarTasks = existingTasks.filter(task => {
    const similarity = calculateStringSimilarity(
      newTask.text?.toLowerCase() || '',
      task.text.toLowerCase()
    );
    return similarity > 0.7;
  });
  
  if (similarTasks.length > 0) {
    suggestions.push(`You have similar tasks: ${similarTasks.map(t => t.text).join(', ')}`);
  }
  
  return {
    hasConflict: conflicts.length > 0,
    conflictingTasks: conflicts,
    suggestions
  };
}

/**
 * Calculate string similarity (simple implementation)
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}


