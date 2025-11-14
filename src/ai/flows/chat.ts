
'use server';

/**
 * @fileoverview A conversational flow for the AI assistant with multi-provider support.
 */
import { multiProviderAI } from '../../lib/ai/multi-provider';

export interface Message {
  role: 'user' | 'assistant';
  content: string | { text: string }[];
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  dueDate?: string;
  description?: string;
  tags?: string[];
  starred?: boolean;
}

export interface FileContext {
  fileName: string;
  fileType: string;
  extractedText?: string;
  summary?: string;
  tags?: string[];
}

// Multi-provider AI system handles API keys and failover automatically

/**
 * The main conversational flow.
 *
 * @param history A history of messages in the conversation.
 * @param fileContext Optional file context from uploaded files.
 * @returns The AI's response and any tasks to create.
 */
export async function continueConversation(
  history: Message[], 
  fileContext?: FileContext[],
  activeTab?: 'message' | 'code' | 'canvas' | 'plan',
  advancedAI?: boolean,
  taskContext?: string,
  selectedModel?: string
): Promise<{ text: string; tasks?: Omit<Task, 'id' | 'completed'>[]; action?: string; taskText?: string; updates?: Partial<Omit<Task, 'id' | 'completed'>>; tokenUsage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number } }[]> {
  try {
    console.log('Received history:', JSON.stringify(history, null, 2));
    console.log('File context:', fileContext);
    
    // Build file context string
    let fileContextString = '';
    if (fileContext && fileContext.length > 0) {
      fileContextString = '\n\nUPLOADED FILES CONTEXT:\n';
      fileContext.forEach((file, index) => {
        fileContextString += `File ${index + 1}: ${file.fileName} (${file.fileType})\n`;
        if (file.summary) {
          fileContextString += `Summary: ${file.summary}\n`;
        }
        if (file.extractedText) {
          fileContextString += `Content: ${file.extractedText.substring(0, 500)}${file.extractedText.length > 500 ? '...' : ''}\n`;
        }
        if (file.tags && file.tags.length > 0) {
          fileContextString += `Tags: ${file.tags.join(', ')}\n`;
        }
        fileContextString += '\n';
      });
    }
    
    // Add active tab context to prompt
    let activeTabContext = '';
    let advancedAIRestrictions = '';
    if (activeTab && advancedAI) {
      switch (activeTab) {
        case 'code':
          activeTabContext = '\n\nMODE: CODE - Generate code with [CODE_START] markers.';
          break;
        case 'canvas':
          activeTabContext = '\n\nMODE: CANVAS - Generate creative content with [STORY_START] markers.';
          break;
        case 'plan':
          activeTabContext = '\n\nMODE: PLAN - Generate plans/flowcharts with [PLAN_START] markers.';
          break;
        case 'message':
        default:
          activeTabContext = '\n\nMODE: MESSAGE - Conversational responses only.';
          break;
      }
    } else if (!advancedAI) {
      activeTabContext = '\n\nAdvanced AI disabled - conversational responses only.';
      advancedAIRestrictions = '\n\nNo code/plans/stories/markers.';
    }

    // Build task context string
    let taskContextString = '';
    if (taskContext) {
      taskContextString = `\n\n${taskContext}\n\nUse tasks above to answer questions. Be conversational, reference specific details (text, tags, due dates, status). Accept flexible wording and variations.`;
    }

    const prompt = `You are a helpful AI assistant for Lunchbox, a task management platform. Be witty, charming, and proactive.${fileContextString}${taskContextString}${activeTabContext}${advancedAIRestrictions}

IMAGE ANALYSIS:
- When users attach images, you will receive detailed analysis of the images in the message content
- Use the provided image analysis (summary, extracted text, tags) to answer questions about the images
- Be specific about details, colors, objects, text, and context from the analysis
- If image analysis is not available, politely ask the user to describe what they see
- NEVER say "I couldn't load the image" - always be helpful and ask for a description if needed

TASK ACTIONS - JSON only:
- Triggers: "create/add/make task", "remind me to", or action with time/date
- Time-sensitive (appointments/calls/events): Ask for date/time if missing (plain text)
- Others: Create immediately (JSON)

JSON FORMAT:
Create: {"response":"...","action":"create","tasks":[{"text":"...","dueDate":"...","tags":[...],"starred":false}]}
Complete: {"response":"...","action":"complete","taskText":"..."}
Delete: {"response":"...","action":"delete","taskText":"..."}
Update: {"response":"...","action":"update","taskText":"...","updates":{"dueDate":"..."}}
Delete Completed: {"response":"...","action":"deleteCompleted"}

TIME/DATE:
- PM: Add 12 to hour (1pm→13:00, 12pm→12:00). AM: Use as-is (9am→09:00, 12am→00:00)
- Dates: "tomorrow", "next Monday", "Dec 5" → calculate date
- Current: ${new Date().toISOString()}
- UTC timezone (system handles conversion)
- Tags: lowercase, 1-3 per task
- Clean task text: Remove date/time references

LUNCHBOX: Task management with tags/stars/due dates, Kanban/List/Calendar views. NEVER suggest external apps.${advancedAI ? `

CODE/PLANS/STORIES:
- Code: [CODE_START]{"code":"...","language":"...","isExecutable":true}[CODE_END]
- Stories: [STORY_START]content[STORY_END] (when requested)
- Plans: [PLAN_START]content[PLAN_END] (flowcharts use →, decisions use ?)
- Generate working examples, be proactive` : ''}`;

    // Convert history to the format expected by multi-provider
    const messages = await Promise.all(history.map(async (msg) => {
      if (typeof msg.content === 'string') {
        return {
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content
        };
      }
      
      // Handle array content (can include text and images)
      if (Array.isArray(msg.content)) {
        // Extract text parts
        const textParts = msg.content
          .filter(c => c.text)
          .map(c => c.text);
        
        // Extract image parts
        const imageParts = msg.content
          .filter(c => (c as any).image)
          .map(c => (c as any).image);
        
        // If there are images, analyze them and include the analysis
        // NOTE: Image analysis works regardless of advancedAI setting
        if (imageParts.length > 0) {
          console.log(`🖼️ Processing ${imageParts.length} image(s) for message (advancedAI: ${advancedAI})`);
          
          // Analyze images using Gemini Vision API
          const { analyzeUploadedFile } = await import('@/lib/ai/document-analyzer');
          
          console.log(`📡 Starting image analysis (this works even if advancedAI is disabled)...`);
          const imageAnalyses = await Promise.all(
            imageParts.map(async (imageUrl: string, idx: number) => {
              try {
                // Get file name from URL or use default
                const fileName = imageUrl.split('/').pop() || `image-${idx + 1}.png`;
                
                // Detect image type from URL or fetch headers
                let imageType = 'image/png'; // default
                try {
                  // Try HEAD request first (faster)
                  const headResponse = await fetch(imageUrl, { 
                    method: 'HEAD',
                    headers: {
                      'Accept': 'image/*',
                    }
                  });
                  
                  if (headResponse.ok) {
                    const contentType = headResponse.headers.get('content-type');
                    if (contentType && contentType.startsWith('image/')) {
                      imageType = contentType;
                      console.log(`Detected image type from headers: ${imageType}`);
                    }
                  }
                  
                  // Fallback to file extension if HEAD fails
                  if (imageType === 'image/png') {
                    const ext = fileName.split('.').pop()?.toLowerCase();
                    if (ext === 'jpg' || ext === 'jpeg') imageType = 'image/jpeg';
                    else if (ext === 'png') imageType = 'image/png';
                    else if (ext === 'gif') imageType = 'image/gif';
                    else if (ext === 'webp') imageType = 'image/webp';
                    console.log(`Detected image type from extension: ${imageType}`);
                  }
                } catch (e: any) {
                  // Use default if detection fails
                  console.warn(`Could not detect image type: ${e?.message || e}, using default ${imageType}`);
                }
                
                console.log(`🔍 Analyzing image ${idx + 1}/${imageParts.length}: ${fileName}`);
                const analysis = await analyzeUploadedFile(imageUrl, imageType, fileName);
                console.log(`✅ Image ${idx + 1} analysis complete:`, {
                  hasSummary: !!analysis.summary,
                  hasText: !!analysis.extractedText,
                  confidence: analysis.confidence
                });
                return {
                  url: imageUrl,
                  fileName,
                  analysis
                };
              } catch (error: any) {
                console.error(`❌ Error analyzing image ${idx + 1}:`, error?.message || error);
                return {
                  url: imageUrl,
                  fileName: `image-${idx + 1}.png`,
                  analysis: {
                    extractedText: '',
                    summary: `Image ${idx + 1} attached but analysis unavailable. Please describe what you see in the image.`,
                    suggestedTags: [],
                    detectedTaskItems: [],
                    confidence: 0,
                    documentType: 'image'
                  }
                };
              }
            })
          );
          
          console.log(`📊 Image analysis complete. Results:`, imageAnalyses.map((img, i) => ({
            image: i + 1,
            fileName: img.fileName,
            hasAnalysis: !!img.analysis.summary,
            summaryPreview: img.analysis.summary?.substring(0, 100)
          })));
          
          // Build content with image analysis
          const textContent = textParts.join(' ') || '';
          
          let content = textContent;
          if (textContent) {
            content += '\n\n';
          }
          
          content += `📷 USER ATTACHED ${imageParts.length} IMAGE${imageParts.length > 1 ? 'S' : ''} 📷\n\n`;
          
          imageAnalyses.forEach((img, idx) => {
            content += `━━━ IMAGE ${idx + 1}: ${img.fileName} ━━━\n`;
            
            // Check if we have successful analysis
            const hasGoodAnalysis = img.analysis.summary && 
                                   !img.analysis.summary.includes('couldn\'t analyze') &&
                                   !img.analysis.summary.includes('analysis unavailable') &&
                                   !img.analysis.summary.includes('Error analyzing');
            
            if (hasGoodAnalysis) {
              content += `✅ IMAGE SUCCESSFULLY ANALYZED\n\n`;
              content += `📝 DETAILED DESCRIPTION:\n${img.analysis.summary}\n\n`;
              
              if (img.analysis.extractedText && img.analysis.extractedText.trim()) {
                content += `📄 TEXT FOUND IN IMAGE:\n${img.analysis.extractedText}\n\n`;
              }
              
              if (img.analysis.suggestedTags && img.analysis.suggestedTags.length > 0) {
                content += `🏷️ Tags: ${img.analysis.suggestedTags.join(', ')}\n`;
              }
              
              if (img.analysis.detectedTaskItems && img.analysis.detectedTaskItems.length > 0) {
                content += `✓ Tasks detected: ${img.analysis.detectedTaskItems.join(', ')}\n`;
              }
            } else {
              // Analysis failed - provide helpful fallback
              content += `⚠️ Automatic analysis not available for this image.\n`;
              content += `Image URL: ${img.url}\n\n`;
              content += `Please ask the user to describe what they see in this image so you can help them.\n`;
            }
            content += `\n`;
          });
          
          content += `\n━━━ YOUR RESPONSE INSTRUCTIONS ━━━\n`;
          content += `The user has attached ${imageParts.length} image${imageParts.length > 1 ? 's' : ''} with their message "${textContent || '(no text provided)'}".\n\n`;
          
          const successfulAnalyses = imageAnalyses.filter(img => 
            img.analysis.summary && 
            !img.analysis.summary.includes('couldn\'t analyze') &&
            !img.analysis.summary.includes('analysis unavailable') &&
            !img.analysis.summary.includes('not configured')
          );
          
          if (successfulAnalyses.length > 0) {
            content += `✅ You have detailed analysis for ${successfulAnalyses.length} of ${imageParts.length} image(s). `;
            content += `Use the analysis provided above to answer the user's question about the image(s). `;
            content += `Be specific and reference details from the analysis.\n\n`;
          } else {
            content += `⚠️ Automatic image analysis was not available for these images. `;
            content += `However, the user has clearly attached image(s) and asked a question. `;
            content += `You should:\n`;
            content += `1. Acknowledge that you received their image(s) and question\n`;
            content += `2. Politely ask them to describe what they see in the image(s)\n`;
            content += `3. Offer to help once they provide a description\n`;
            content += `4. Be friendly and helpful - NEVER say "I couldn't load" or "I can't see the image" - `;
            content += `instead say something like: "I'd love to help! Could you describe what you see in the image?"\n\n`;
          }
          
          content += `Remember: The user has attached image(s) and asked "${textContent || 'about the image(s)'}". `;
          content += `Always be helpful and never say you can't access or load images.`;
          
          return {
            role: msg.role as 'user' | 'assistant' | 'system',
            content: content
          };
        }
        
        // No images, just text
        return {
          role: msg.role as 'user' | 'assistant' | 'system',
          content: textParts.join(' ')
        };
      }
      
      // Fallback for other content types
      return {
        role: msg.role as 'user' | 'assistant' | 'system',
        content: JSON.stringify(msg.content)
      };
    }));

    // Add the prompt as a system message
    messages.unshift({
      role: 'system',
      content: prompt
    });

    // Use multi-provider AI with automatic failover
    const response = await multiProviderAI.generateResponse(messages, selectedModel);
    const text = response.text;
    
    // Log token usage
    if (response.usage) {
      console.log(`📊 Token Usage (${response.provider}):`, {
        prompt_tokens: response.usage.prompt_tokens,
        completion_tokens: response.usage.completion_tokens,
        total_tokens: response.usage.total_tokens
      });
    } else {
      console.log(`⚠️ No token usage data from ${response.provider}`);
    }
    
    console.log(`✅ Response from ${response.provider}:`, text);
    
    console.log('Raw AI response:', text);
    
    // Try to parse JSON response for task actions
    try {
      let jsonText = text.trim();
      
      // Method 1: Extract from code blocks (```json or ```)
      if (text.includes('```json')) {
        const match = text.match(/```json\s*([\s\S]*?)\s*```/);
        if (match) {
          jsonText = match[1].trim();
        }
      } else if (text.includes('```')) {
        const match = text.match(/```\s*([\s\S]*?)\s*```/);
        if (match) {
          jsonText = match[1].trim();
        }
      }
      
      // Method 2: Find JSON object with "response" and "action" fields
      // Look for the first { that starts a valid JSON object
      if (!jsonText.startsWith('{')) {
        // Try to find JSON embedded in text
        const jsonStart = text.indexOf('{');
        if (jsonStart !== -1) {
          // Find the matching closing brace
          let braceCount = 0;
          let jsonEnd = -1;
          for (let i = jsonStart; i < text.length; i++) {
            if (text[i] === '{') braceCount++;
            if (text[i] === '}') {
              braceCount--;
              if (braceCount === 0) {
                jsonEnd = i + 1;
                break;
              }
            }
          }
          if (jsonEnd !== -1) {
            jsonText = text.substring(jsonStart, jsonEnd).trim();
          }
        }
      }
      
      // Method 3: Regex pattern to extract JSON with specific fields
      if (!jsonText.startsWith('{')) {
        const jsonMatch = text.match(/\{[\s\S]*?"response"[\s\S]*?"action"[\s\S]*?\}/);
        if (jsonMatch) {
          jsonText = jsonMatch[0].trim();
        }
      }
      
      console.log('Attempting to parse JSON:', jsonText);
      const parsed = JSON.parse(jsonText);
      console.log('Parsed JSON:', parsed);
      
      if (parsed.response && parsed.action) {
        console.log('Task action detected:', parsed.action);
        
        const tokenUsage = response.usage ? {
          prompt_tokens: response.usage.prompt_tokens,
          completion_tokens: response.usage.completion_tokens,
          total_tokens: response.usage.total_tokens
        } : undefined;
        
        if (parsed.action === 'create' && parsed.tasks && Array.isArray(parsed.tasks)) {
          console.log('Task creation detected, returning tasks:', parsed.tasks);
          return [{ text: parsed.response, action: 'create', tasks: parsed.tasks, tokenUsage }];
        } else if (parsed.action === 'complete' && parsed.taskText) {
          console.log('Task completion detected for:', parsed.taskText);
          return [{ text: parsed.response, action: 'complete', taskText: parsed.taskText, tokenUsage }];
        } else if (parsed.action === 'delete' && parsed.taskText) {
          console.log('Task deletion detected for:', parsed.taskText);
          return [{ text: parsed.response, action: 'delete', taskText: parsed.taskText, tokenUsage }];
        } else if (parsed.action === 'deleteCompleted') {
          console.log('Bulk deletion of completed tasks detected');
          return [{ text: parsed.response, action: 'deleteCompleted', tokenUsage }];
        } else if (parsed.action === 'update' && parsed.taskText && parsed.updates) {
          console.log('Task update detected for:', parsed.taskText, 'with updates:', parsed.updates);
          return [{ text: parsed.response, action: 'update', taskText: parsed.taskText, updates: parsed.updates, tokenUsage }];
        }
      }
    } catch (e) {
      console.log('JSON parsing failed:', e);
      // Not JSON, return as regular text
    }
    
    // Fallback: Check if the response indicates task actions but wasn't in JSON format
    // Only trigger if the USER's last message explicitly requested task creation
    const lastUserMessage = history[history.length - 1];
    if (lastUserMessage && lastUserMessage.role === 'user') {
      const userContent = typeof lastUserMessage.content === 'string' ? lastUserMessage.content : 
        (Array.isArray(lastUserMessage.content) ? lastUserMessage.content.map(c => c.text).join(' ') : '');
      
      const userContentLower = userContent.toLowerCase();
      
      // Check if user explicitly requested task creation
      const userWantsTaskCreation = /(?:create|add|make|new).*?task/i.test(userContent) ||
                                    /(?:remind me to|remind me about)/i.test(userContent) ||
                                    /(?:i need to|i should|i must|i have to)/i.test(userContent);
      
      // Only proceed with keyword detection if user explicitly requested task creation
      if (userWantsTaskCreation) {
        const taskCreationKeywords = ['task created', 'task added', 'created a task', 'added to your tasks', 'task is now', 'consider it done', 'fresh tasks', 'coming right up'];
        
        const hasCreationKeywords = taskCreationKeywords.some(keyword => text.toLowerCase().includes(keyword));
        
        if (hasCreationKeywords) {
          console.log('Detected task creation intent from keywords:', text);
          // Try to extract task info from the text - look for "called" or "for" patterns
          const taskMatch = text.match(/(?:create|add|make).*?task.*?(?:called|for|to|about)\s*(.+?)(?:\.|$)/i) ||
                           text.match(/task.*?(?:called|for|to|about)\s*(.+?)(?:\.|$)/i);
          
          if (taskMatch) {
            const taskText = taskMatch[1].trim();
            console.log('Extracted task text:', taskText);
            return [{ 
              text: text, 
              action: 'create',
              tasks: [{ 
                text: taskText,
                description: 'Created by AI assistant'
              }] 
            }];
          }
          
          // Try to extract from user message
          const userTaskMatch = userContent.match(/(?:create|add|make).*?task.*?(?:called|for|to|about)\s*(.+?)(?:\.|$)/i) ||
                               userContent.match(/task.*?(?:called|for|to|about)\s*(.+?)(?:\.|$)/i);
          if (userTaskMatch) {
            const taskText = userTaskMatch[1].trim();
            console.log('Extracted task text from user message:', taskText);
            return [{ 
              text: text, 
              action: 'create',
              tasks: [{ 
                text: taskText,
                description: 'Created by AI assistant'
              }] 
            }];
          }
        }
      }
      
      // Check for other task actions (completion, deletion, update) - these don't require explicit user request
      const taskCompletionKeywords = ['done and dusted', 'completed', 'finished', 'checked off', 'marked as done', 'task is done'];
      const taskDeletionKeywords = ['deleted', 'removed', 'gone', 'poof', 'disappeared', 'cleared'];
      const taskUpdateKeywords = ['updated', 'changed', 'modified', 'edited', 'marked for', 'scheduled for', 'due at', 'due on'];
      
      const hasCompletionKeywords = taskCompletionKeywords.some(keyword => text.toLowerCase().includes(keyword));
      const hasDeletionKeywords = taskDeletionKeywords.some(keyword => text.toLowerCase().includes(keyword));
      const hasUpdateKeywords = taskUpdateKeywords.some(keyword => text.toLowerCase().includes(keyword));
      
      if (hasCompletionKeywords) {
        console.log('Detected task completion intent from keywords:', text);
        // Look for task completion patterns
        const taskMatch = userContent.match(/(?:complete|finish|mark|check off|done with)\s+(?:the\s+)?task\s+(.+?)(?:\s|$)/i) ||
                         userContent.match(/(?:complete|finish|mark|check off|done with)\s+(.+?)(?:\s|$)/i);
        
        if (taskMatch) {
          const taskText = taskMatch[1].trim();
          console.log('Extracted task text for completion:', taskText);
          return [{ 
            text: text, 
            action: 'complete', 
            taskText: taskText 
          }];
        }
      } else if (hasDeletionKeywords) {
        console.log('Detected task deletion intent from keywords:', text);
        // Look for task deletion patterns
        const taskMatch = userContent.match(/(?:delete|remove|get rid of)\s+(?:the\s+)?task\s+(.+?)(?:\s|$)/i) ||
                         userContent.match(/(?:delete|remove|get rid of)\s+(.+?)(?:\s|$)/i) ||
                         userContent.match(/now\s+delete\s+it/i);
        
        if (taskMatch) {
          const taskText = taskMatch[1] ? taskMatch[1].trim() : 'it';
          console.log('Extracted task text for deletion:', taskText);
          return [{ 
            text: text, 
            action: 'delete', 
            taskText: taskText 
          }];
        }
      } else if (hasUpdateKeywords) {
        console.log('Detected task update intent from keywords:', text);
        
        // Look for task update patterns
        const taskMatch = userContent.match(/(?:now\s+)?(?:make|change|update|edit)\s+(?:it|the\s+task\s+(.+?)|(.+?))\s+(?:due|to be due|for)\s+(.+?)(?:\s|$)/i) ||
                         userContent.match(/(?:now\s+)?(?:make|change|update|edit)\s+(.+?)\s+(?:due|to be due|for)\s+(.+?)(?:\s|$)/i) ||
                         userContent.match(/(?:now\s+)?(?:change|update)\s+due\s+date\s+of\s+(.+?)\s+to\s+(.+?)(?:\s|$)/i);
        
        if (taskMatch) {
          const taskText = taskMatch[1] || taskMatch[2] || 'it';
          const dueDateText = taskMatch[3] || taskMatch[4]; // Handle both patterns
          console.log('Extracted task text for update:', taskText, 'with due date:', dueDateText);
          
          // Parse the due date text to create a proper date
          let dueDate = '';
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          
          if (dueDateText.toLowerCase().includes('today')) {
            if (dueDateText.includes('6pm') || dueDateText.includes('6 pm')) {
              dueDate = new Date(today.getTime() + 18 * 60 * 60 * 1000).toISOString(); // 6 PM today
            } else if (dueDateText.includes('3pm') || dueDateText.includes('3 pm')) {
              dueDate = new Date(today.getTime() + 15 * 60 * 60 * 1000).toISOString(); // 3 PM today
            } else {
              dueDate = new Date(today.getTime() + 12 * 60 * 60 * 1000).toISOString(); // Noon today
            }
          } else if (dueDateText.toLowerCase().includes('tomorrow')) {
            const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
            dueDate = new Date(tomorrow.getTime() + 12 * 60 * 60 * 1000).toISOString(); // Noon tomorrow
          } else if (dueDateText.toLowerCase().includes('next week')) {
            const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
            dueDate = new Date(nextWeek.getTime() + 12 * 60 * 60 * 1000).toISOString(); // Noon next week
          } else if (dueDateText.toLowerCase().includes('monday')) {
            const daysUntilMonday = (1 + 7 - today.getDay()) % 7 || 7;
            const monday = new Date(today.getTime() + daysUntilMonday * 24 * 60 * 60 * 1000);
            dueDate = new Date(monday.getTime() + 12 * 60 * 60 * 1000).toISOString(); // Noon Monday
          }
          
          return [{ 
            text: text, 
            action: 'update', 
            taskText: taskText,
            updates: dueDate ? { dueDate } : {}
          }];
        }
      }
    }
    
    // Calculate user message tokens (rough estimate: 1 token ≈ 4 characters)
    const userMessages = history.filter(msg => msg.role === 'user');
    const userMessageText = userMessages.map(msg => {
      const content = typeof msg.content === 'string' ? msg.content : 
        (Array.isArray(msg.content) ? msg.content.map(c => c.text).join(' ') : JSON.stringify(msg.content));
      return content;
    }).join(' ');
    const estimatedUserTokens = Math.ceil(userMessageText.length / 4);
    const systemPromptTokens = response.usage ? response.usage.prompt_tokens - estimatedUserTokens : undefined;
    
    const tokenUsage = response.usage ? {
      prompt_tokens: response.usage.prompt_tokens,
      completion_tokens: response.usage.completion_tokens,
      total_tokens: response.usage.total_tokens,
      user_message_tokens: estimatedUserTokens,
      system_prompt_tokens: systemPromptTokens
    } : undefined;
    
    return [{ text, tokenUsage }];
  } catch (error: any) {
    console.error('Error generating response:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    
    // If this is a rate limit error, re-throw it so the caller can handle it
    if (error?.rateLimitInfo) {
      throw error;
    }
    
    return [{ text: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.` }];
  }
}
