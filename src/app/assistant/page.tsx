'use client';

import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Bot, 
  User, 
  Sparkles, 
  Trash2, 
  Download, 
  Save, 
  RotateCcw, 
  MoreVertical, 
  Menu, 
  X, 
  Upload, 
  File, 
  Image as ImageIcon, 
  FileText, 
  Copy, 
  Edit, 
  Wand2, 
  Brain, 
  ChevronDown, 
  ChevronRight, 
  MessageSquare,
  Loader2
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PromptForm } from '@/components/assistant/prompt-form';
import { FileUpload } from '@/components/assistant/file-upload';
import { SkeletonMessage } from '@/components/ui/skeleton';
import { CanvasMode } from '@/components/assistant/canvas-mode';
import { CodeMode } from '@/components/assistant/code-mode';
import PlanMode from '@/components/assistant/plan-mode';
import { ReasoningDisplay } from '@/components/ui/reasoning-display';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { continueConversation } from '@/ai/flows/chat';
import type { Message, FileContext } from '@/ai/flows/chat';
import type { TaskFile } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useChat } from '@/context/chat-context';
import { useTasks } from '@/context/task-context';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';

export default function AssistantPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<TaskFile[]>([]);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedImages, setSelectedImages] = useState<Array<{ id: string; url: string; name: string }>>([]);
  
  // Streaming states
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState('');
  const [activeTab, setActiveTab] = useState<'message' | 'code' | 'canvas' | 'plan'>('message');
  const [advancedAI, setAdvancedAI] = useState(false);
  const [selectedModel, setSelectedModel] = useState('auto');
  const [reasoningSteps, setReasoningSteps] = useState<any[]>([]);
  const [isReasoningActive, setIsReasoningActive] = useState(false);
  const [isReasoningExpanded, setIsReasoningExpanded] = useState(true);
  const [currentReasoningStep, setCurrentReasoningStep] = useState<string | undefined>();
  
  // Content is now embedded in messages - no global state needed
  
  // Editing state
  const [editingContent, setEditingContent] = useState<{
    type: 'code' | 'canvas' | 'plan' | null;
    content: any;
    messageIndex: number;
    contentIndex: number;
  } | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  // Thinking state
  const [isThinking, setIsThinking] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true); // Auto-open on desktop
      } else {
        setSidebarOpen(false); // Auto-close on mobile
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Listen for changes to advanced AI setting
  useEffect(() => {
    const checkAdvancedAI = () => {
      const savedAdvancedAI = localStorage.getItem('lunchbox-advanced-ai') === 'true';
      setAdvancedAI(savedAdvancedAI);
    };
    
    checkAdvancedAI();
    
    // Listen for storage changes from other tabs
    window.addEventListener('storage', (e) => {
      if (e.key === 'lunchbox-advanced-ai') {
        checkAdvancedAI();
      }
    });
    
    return () => window.removeEventListener('storage', checkAdvancedAI);
  }, []);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user } = useAuth();
  const { 
    messages, 
    currentChat, 
    savedChats, 
    loading: chatLoading, 
    createNewChat, 
    saveCurrentChat, 
    addMessage, 
    deleteChat, 
    exportChat, 
    clearChat,
    loadChat 
  } = useChat();
  const { addTask } = useTasks();

  // Retry function for API calls
  const retryApiCall = async (apiCall: () => Promise<any>, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        setRetryCount(attempt - 1);
        // Add timeout wrapper for server actions (60 seconds default, but we'll catch it)
        return await Promise.race([
          apiCall(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout - operation took too long')), 120000) // 2 minutes
          )
        ]);
      } catch (error: any) {
        console.log(`API attempt ${attempt} failed:`, error.message);
        
        // If this is a rate limit error with retry info, throw immediately (don't retry)
        // The caller will handle the queue/retry logic
        if (error?.rateLimitInfo) {
          throw error;
        }
        
        // Don't retry on timeout or connection errors - these are usually infrastructure issues
        if (error.message?.includes('timeout') || 
            error.message?.includes('408') ||
            error.message?.includes('Failed to fetch') ||
            error.message?.includes('ERR_CONNECTION_REFUSED')) {
          throw error; // Don't retry these
        }
        
        // Check if it's a retryable error
        if (error.message?.includes('503') || 
            error.message?.includes('overloaded') || 
            error.message?.includes('rate limit') ||
            error.message?.includes('UNAVAILABLE')) {
          
          if (attempt === maxRetries) {
            throw error; // Final attempt failed
          }
          
          // Wait before retry (exponential backoff)
          const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw error; // Non-retryable error
        }
      }
    }
  };

  // Response type detection
  const detectResponseType = (text: string): 'message' | 'code' | 'canvas' | 'plan' => {
    console.log('🔍 DETECTING RESPONSE TYPE for text:', text.substring(0, 200) + '...');
    
    // If advanced AI is disabled, always return message mode
    if (!advancedAI) {
      console.log('⚠️ Advanced AI disabled - forcing message mode');
      return 'message';
    }
    
    // Check for code blocks - if text contains code blocks, it should be code mode
    if (text.includes('```')) {
      console.log('✅ Detected CODE mode - found code blocks');
      return 'code';
    }
    
    // Check for HTML/XML tags - very common in web development
    if (/<[a-zA-Z][^>]*>|<!DOCTYPE|<\?xml|<html|<head|<body|<div|<span|<p|<h[1-6]|<script|<style/.test(text)) {
      console.log('✅ Detected CODE mode - found HTML/XML tags');
      return 'code';
    }
    
    // Check for HTML content in comments or code blocks
    if (/<!--.*?-->|<!DOCTYPE|<\?xml|<html|<head|<body|<div|<span|<p|<h[1-6]|<script|<style/.test(text)) {
      console.log('✅ Detected CODE mode - found HTML in comments or blocks');
      return 'code';
    }
    
    // Check for programming keywords and patterns - be more aggressive
    if (/import\s+\w+|def\s+\w+|function\s+\w+|class\s+\w+|const\s+\w+|let\s+\w+|var\s+\w+|if\s*\(|for\s*\(|while\s*\(|return\s+|print\s*\(|input\s*\(|def\s+\w+\s*\(|class\s+\w+|import\s+\w+/.test(text)) {
      console.log('✅ Detected CODE mode - found programming keywords');
      return 'code';
    }
    
    // Check for code-related phrases that indicate code generation
    if (/here is.*code|here's.*code|here is.*script|here's.*script|code saved|script saved|save this code|copy.*paste.*script|run.*script|execute.*code/i.test(text)) {
      console.log('✅ Detected CODE mode - found code generation phrases');
      return 'code';
    }
    
    // Check for flowchart/plan keywords
    if (/flowchart|diagram|plan|step \d+|phase \d+|workflow|process|roadmap|timeline/i.test(text)) {
      console.log('✅ Detected PLAN mode - found plan keywords');
      return 'plan';
    }
    
    // Check for story content - be VERY specific to avoid false positives
    // Only detect canvas if there are clear story markers or explicit story content
    if ((/\[STORY_START\]|here's a \d+-line.*story|here's a short story|here's a story|here's a tale|here's a narrative|here's an essay|here's an article|once upon a time|chapter \d+|story begins|story ends/i.test(text) || 
         // Very specific narrative patterns that indicate actual story content
         (/as the clock|floated through|spaceship|astronaut|whispered|haunting|desolate|galaxy|midnight|lone|engines|sound|word|home/i.test(text) && text.length > 100)) && 
        !text.includes('What theme or subject') && 
        !text.includes('Would you like it to be') && 
        !text.includes('Let\'s get creative') &&
        !text.includes('What would you like') &&
        !text.includes('Do you have a project') &&
        !text.includes('What would you like to talk about') &&
        !text.includes('Hello! It\'s great to meet you') &&
        !text.includes('How can I help you today') &&
        !text.includes('Let\'s get started')) {
      console.log('✅ Detected CANVAS mode - found specific story indicators');
      return 'canvas';
    }
    
    console.log('✅ Detected MESSAGE mode - default');
    return 'message';
  };

  // Enhanced content processing for different modes
  const processContentForMode = (text: string, mode: 'message' | 'code' | 'canvas' | 'plan') => {
    console.log('🔄 PROCESSING CONTENT FOR MODE:', mode, 'Text length:', text.length);
    
    // Content is now embedded in messages - no global state processing needed
    // This function is kept for compatibility but doesn't set global state
    console.log('✅ Content will be embedded in message content');
  };

  // Streaming function
  const streamResponse = async (fullText: string, tokenUsage?: any) => {
    setIsStreaming(true);
    setStreamedContent('');
    let currentIndex = 0;
    
    // Use the active tab if manually selected, otherwise detect automatically
    let responseType = activeTab;
    
    // Only auto-detect if user hasn't manually selected a specific mode
    if (activeTab === 'message') {
      responseType = detectResponseType(fullText);
      setActiveTab(responseType);
      console.log('🎯 Auto-detected response type:', responseType);
    } else {
      console.log('🎯 Using manually selected tab:', activeTab);
    }
    
    // Don't clear existing content - let the content processing handle it
    
    const interval = setInterval(async () => {
      if (currentIndex < fullText.length) {
        const currentText = fullText.substring(0, currentIndex + 1);
        setStreamedContent(currentText);
        
        // Process content in real-time for all modes
        processContentForMode(currentText, responseType);
        
        currentIndex++;
      } else {
        clearInterval(interval);
        
        // Final processing
        processContentForMode(fullText, responseType);
        
        // Create message content - remove code blocks from text for cleaner display
        let displayText = fullText;
        if (responseType === 'code') {
          // Remove code blocks from the display text
          displayText = fullText.replace(/```[\s\S]*?```/g, '').trim();
        }
        
        // Create message content with all content types
        let messageContent: { text: string }[] = [{ text: displayText }];
        
        // For canvas mode, clean the display text too
        if (responseType === 'canvas') {
          let cleanDisplayText = displayText;
          
          // Remove AI headers and introductions
          cleanDisplayText = cleanDisplayText.replace(/^Here's a \d+-line short story:\s*/i, '');
          cleanDisplayText = cleanDisplayText.replace(/^Here's a short story:\s*/i, '');
          cleanDisplayText = cleanDisplayText.replace(/^Here's a story:\s*/i, '');
          cleanDisplayText = cleanDisplayText.replace(/^Here's a tale:\s*/i, '');
          cleanDisplayText = cleanDisplayText.replace(/^Here's a narrative:\s*/i, '');
          cleanDisplayText = cleanDisplayText.replace(/^Here's an essay:\s*/i, '');
          cleanDisplayText = cleanDisplayText.replace(/^Here's a \d+-line story:\s*/i, '');
          cleanDisplayText = cleanDisplayText.replace(/^A one-liner story is.*?Here's a classic example:\s*/i, '');
          cleanDisplayText = cleanDisplayText.replace(/^A one-liner story is.*?Here's an example:\s*/i, '');
          
          // Remove explanatory text that's not part of the story
          cleanDisplayText = cleanDisplayText.replace(/^A one-liner story is a short and sweet tale.*?Here's a classic example:\s*/i, '');
          cleanDisplayText = cleanDisplayText.replace(/^A one-liner story is a short and sweet tale.*?Here's an example:\s*/i, '');
          
          // Remove common AI follow-up patterns
          cleanDisplayText = cleanDisplayText.replace(/\n\n\(Please note:.*?\)/g, '');
          cleanDisplayText = cleanDisplayText.replace(/\n\nHow was that\?.*$/g, '');
          cleanDisplayText = cleanDisplayText.replace(/\n\nWould you like me to.*$/g, '');
          cleanDisplayText = cleanDisplayText.replace(/\n\nIs there anything else.*$/g, '');
          cleanDisplayText = cleanDisplayText.replace(/\n\nLet me know if.*$/g, '');
          cleanDisplayText = cleanDisplayText.replace(/\n\nWhat do you think\?.*$/g, '');
          cleanDisplayText = cleanDisplayText.replace(/\n\nWould you like me to continue.*$/g, '');
          cleanDisplayText = cleanDisplayText.replace(/\n\n\n+/g, '\n\n').trim();
          messageContent[0].text = cleanDisplayText;
        }
        
        // For code mode, clean the display text and hide CODE_START markers
        if (responseType === 'code') {
          let cleanDisplayText = displayText;
          
          // Remove CODE_START markers from display text
          cleanDisplayText = cleanDisplayText.replace(/\[CODE_START\][\s\S]*?\[CODE_END\]/g, '');
          
          // Remove code blocks from display text
          cleanDisplayText = cleanDisplayText.replace(/```[\s\S]*?```/g, '');
          
          // Clean up any remaining content
          cleanDisplayText = cleanDisplayText.replace(/\n\n\n+/g, '\n\n').trim();
          
          // If display text is empty or very short, provide contextual message
          if (cleanDisplayText.length < 20) {
            cleanDisplayText = "Here's the code you requested!";
          }
          
          messageContent[0].text = cleanDisplayText;
        }
        
        // For plan mode, clean the display text and hide JSON
        if (responseType === 'plan') {
          let cleanDisplayText = displayText;
          
          // Remove plan markers and content from display
          cleanDisplayText = cleanDisplayText.replace(/\[PLAN_START\][\s\S]*?\[PLAN_END\]/g, '');
          
          // Remove AI headers and introductions
          cleanDisplayText = cleanDisplayText.replace(/^Here's a plan:\s*/i, '');
          cleanDisplayText = cleanDisplayText.replace(/^Here's a flowchart:\s*/i, '');
          cleanDisplayText = cleanDisplayText.replace(/^Here's a diagram:\s*/i, '');
          cleanDisplayText = cleanDisplayText.replace(/^Here's a roadmap:\s*/i, '');
          cleanDisplayText = cleanDisplayText.replace(/^Here's a timeline:\s*/i, '');
          cleanDisplayText = cleanDisplayText.replace(/^Here's a process:\s*/i, '');
          cleanDisplayText = cleanDisplayText.replace(/^Here's a workflow:\s*/i, '');
          cleanDisplayText = cleanDisplayText.replace(/^Here's a strategy:\s*/i, '');
          
          // Clean up any remaining content
          cleanDisplayText = cleanDisplayText.replace(/\n\n\n+/g, '\n\n').trim();
          
          // If display text is empty or very short, provide contextual message
          if (cleanDisplayText.length < 20) {
            cleanDisplayText = 'Here\'s your flowchart! You can edit it or ask me to modify any part of it.';
          }
          
          messageContent[0].text = cleanDisplayText;
        }
        
        // Extract and embed content based on response type
        if (responseType === 'code') {
          // First check for [CODE_START] markers
          const codeStartMatches = fullText.match(/\[CODE_START\][\s\S]*?\[CODE_END\]/g);
          if (codeStartMatches) {
            console.log('🔍 Found CODE_START markers:', codeStartMatches.length);
            codeStartMatches.forEach(match => {
              try {
                const cleanText = match
                  .replace(/\[CODE_START\]\n?/, '')
                  .replace(/\n?\[CODE_END\]$/, '');
                
                // Try to fix common JSON issues
                let fixedText = cleanText;
                
                // Fix unescaped newlines and quotes
                fixedText = fixedText.replace(/\\n/g, '\\n');
                fixedText = fixedText.replace(/\n/g, '\\n');
                fixedText = fixedText.replace(/\\"/g, '\\"');
                
                const codeData = JSON.parse(fixedText);
                console.log('✅ Parsed CODE_START data:', codeData);
                
                messageContent.push({ 
                  text: `[CODE_START]\n${JSON.stringify(codeData)}\n[CODE_END]`
                });
              } catch (error) {
                console.log('❌ Failed to parse CODE_START:', error);
                console.log('Raw match:', match);
                
                // Fallback: try to extract code manually
                const codeMatch = match.match(/"code":\s*"([^"]+)"/);
                const languageMatch = match.match(/"language":\s*"([^"]+)"/);
                const executableMatch = match.match(/"isExecutable":\s*(true|false)/);
                
                if (codeMatch) {
                  const fallbackData = {
                    code: codeMatch[1].replace(/\\n/g, '\n'),
                    language: languageMatch ? languageMatch[1] : 'python',
                    isExecutable: executableMatch ? executableMatch[1] === 'true' : true
                  };
                  
                  console.log('🔄 Using fallback extraction:', fallbackData);
                  
                  messageContent.push({ 
                    text: `[CODE_START]\n${JSON.stringify(fallbackData)}\n[CODE_END]`
                  });
                }
              }
            });
          }
          
          // Also extract code blocks from the full text (triple backticks)
          const codeMatches = fullText.match(/```[\s\S]*?```/g);
          if (codeMatches) {
            // Parse each code block to extract language and content
            const codeBlocks = codeMatches.map(block => {
              const languageMatch = block.match(/```(\w*)\n?/);
              const language = languageMatch ? languageMatch[1] : 'text';
              const content = block.replace(/```\w*\n?/, '').replace(/```$/, '');
              return { language, content };
            });
            
            // Check if we have multiple languages (HTML + CSS + JS)
            const languages = [...new Set(codeBlocks.map(block => block.language))];
            const hasMultipleLanguages = languages.length > 1;
            
            if (hasMultipleLanguages) {
              // Combine HTML, CSS, and JS into a single executable unit
              let htmlContent = '';
              let cssContent = '';
              let jsContent = '';
              
              codeBlocks.forEach(block => {
                switch (block.language.toLowerCase()) {
                  case 'html':
                    htmlContent = block.content;
                    break;
                  case 'css':
                    cssContent = block.content;
                    break;
                  case 'javascript':
                  case 'js':
                    jsContent = block.content;
                    break;
                }
              });
              
              // Create a complete HTML page with embedded CSS and JS
              const combinedCode = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Code Preview</title>
    ${cssContent ? `<style>\n${cssContent}\n</style>` : ''}
</head>
<body>
    ${htmlContent || '<div>No HTML content provided</div>'}
    ${jsContent ? `<script>\n${jsContent}\n</script>` : ''}
</body>
</html>`;
              
              messageContent.push({ 
                text: `[CODE_START]\n${JSON.stringify({
                  code: combinedCode,
                  language: 'html',
                  isExecutable: true,
                  hasMultipleLanguages: true,
                  originalBlocks: codeBlocks
                })}\n[CODE_END]`
              });
              console.log('✅ Multi-language code content embedded in message');
            } else {
              // Single language - use existing logic
              const allCode = codeBlocks.map(block => block.content).join('\n\n');
              const detectedLanguage = codeBlocks[0]?.language || 'text';
              
              const isExecutable = /html|react|jsx|javascript|typescript|css/i.test(detectedLanguage);
              
              messageContent.push({ 
                text: `[CODE_START]\n${JSON.stringify({
                  code: allCode,
                  language: detectedLanguage,
                  isExecutable: isExecutable
                })}\n[CODE_END]`
              });
              console.log('✅ Single language code content embedded in message');
            }
          }
  } else if (responseType === 'canvas') {
    // Extract canvas content using markers - look for story content between markers
    let cleanContent = '';
    
    // Look for story markers first
    const storyStartMarker = /\[STORY_START\]/i;
    const storyEndMarker = /\[STORY_END\]/i;
    
    if (storyStartMarker.test(fullText) && storyEndMarker.test(fullText)) {
      // Extract content between markers
      const startMatch = fullText.match(storyStartMarker);
      const endMatch = fullText.match(storyEndMarker);
      
      if (startMatch && endMatch) {
        const startIndex = startMatch.index! + startMatch[0].length;
        const endIndex = endMatch.index!;
        cleanContent = fullText.substring(startIndex, endIndex).trim();
        console.log('✅ Extracted story content from markers:', cleanContent);
      }
    } else {
      // Fallback: try to extract story content using patterns
      cleanContent = fullText;
      let subject = '';

      // Extract subject information first (before removing it)
      const subjectMatch = cleanContent.match(/^The subject of the story is\s*["']?([^"'\n]+)["']?\.?\s*/i);
      if (subjectMatch) {
        subject = subjectMatch[1].trim();
        console.log('📝 Extracted subject:', subject);
      }

      // Remove AI headers and introductions - be more aggressive
      cleanContent = cleanContent.replace(/^Here's a \d+-line short story:\s*/i, '');
      cleanContent = cleanContent.replace(/^Here's a short story:\s*/i, '');
      cleanContent = cleanContent.replace(/^Here's a story:\s*/i, '');
      cleanContent = cleanContent.replace(/^Here's a tale:\s*/i, '');
      cleanContent = cleanContent.replace(/^Here's a narrative:\s*/i, '');
      cleanContent = cleanContent.replace(/^Here's an essay:\s*/i, '');
      cleanContent = cleanContent.replace(/^Here's a \d+-line story:\s*/i, '');
      cleanContent = cleanContent.replace(/^Here's a \d+-character story for you:\s*/i, '');
      cleanContent = cleanContent.replace(/^Here's a better \d+-character story:\s*/i, '');
      cleanContent = cleanContent.replace(/^A one-liner story is.*?Here's a classic example:\s*/i, '');
      cleanContent = cleanContent.replace(/^A one-liner story is.*?Here's an example:\s*/i, '');

      // Remove explanatory text that's not part of the story
      cleanContent = cleanContent.replace(/^A one-liner story is a short and sweet tale.*?Here's a classic example:\s*/i, '');
      cleanContent = cleanContent.replace(/^A one-liner story is a short and sweet tale.*?Here's an example:\s*/i, '');
      cleanContent = cleanContent.replace(/^The subject of the story is.*?\n\n/i, '');

      // Remove common AI follow-up patterns - be more comprehensive
      cleanContent = cleanContent.replace(/\n\n\(Please note:.*?\)/g, '');
      cleanContent = cleanContent.replace(/\n\nHow was that\?.*$/g, '');
      cleanContent = cleanContent.replace(/\n\nWould you like me to.*$/g, '');
      cleanContent = cleanContent.replace(/\n\nIs there anything else.*$/g, '');
      cleanContent = cleanContent.replace(/\n\nLet me know if.*$/g, '');
      cleanContent = cleanContent.replace(/\n\nWhat do you think\?.*$/g, '');
      cleanContent = cleanContent.replace(/\n\nWould you like me to continue.*$/g, '');
      cleanContent = cleanContent.replace(/\n\nHow's that\?.*$/g, '');
      cleanContent = cleanContent.replace(/\n\nDo you want a longer story.*$/g, '');
      cleanContent = cleanContent.replace(/\n\nWould you like me to generate another one\?.*$/g, '');

      // Remove everything after the story content (follow-up questions)
      cleanContent = cleanContent.replace(/\n\n.*$/g, '');

      // Clean up any remaining double newlines
      cleanContent = cleanContent.replace(/\n\n\n+/g, '\n\n').trim();

      // If we extracted a subject, prepend it to the content
      if (subject) {
        cleanContent = `Subject: ${subject}\n\n${cleanContent}`;
      }
    }

    // Only proceed if we have actual story content (not just explanatory text)
    if (cleanContent.length > 5 && !cleanContent.includes('A one-liner story is')) {
            // Extract a better title from the content
            let title = 'Story';
            const lines = cleanContent.split('\n');
            
            if (lines.length > 0) {
              const firstLine = lines[0].trim();
              // Use first line as title if it's short and doesn't contain story content
              if (firstLine.length > 0 && firstLine.length < 50 && !firstLine.includes('.')) {
                title = firstLine;
              } else {
                // Look for story indicators in the content
                if (cleanContent.includes('seagull') || cleanContent.includes('ocean')) {
                  title = 'Ocean Story';
                } else if (cleanContent.includes('young girl') || cleanContent.includes('magic') || cleanContent.includes('forest')) {
                  title = 'Fantasy Story';
                } else if (cleanContent.includes('rabbit') || cleanContent.includes('squirrel')) {
                  title = 'Children\'s Story';
                } else if (cleanContent.includes('war') || cleanContent.includes('battle')) {
                  title = 'Adventure Story';
                } else if (cleanContent.includes('astronaut') || cleanContent.includes('star') || cleanContent.includes('universe')) {
                  title = 'Sci-Fi Story';
                } else {
                  title = 'Short Story';
                }
              }
            }
            
            messageContent.push({ 
              text: `[CANVAS_START]\n${JSON.stringify({
                title: title,
                content: cleanContent,
                type: 'story'
              })}\n[CANVAS_END]`
            });
            console.log('✅ Canvas content embedded in message');
          } else {
            console.log('❌ No valid story content found, skipping canvas mode');
          }
        } else if (responseType === 'plan') {
          // Extract plan content using markers - look for plan content between markers
          let cleanContent = '';
          let planType = 'plan';
          
          // Look for plan markers first
          const planStartMarker = /\[PLAN_START\]/i;
          const planEndMarker = /\[PLAN_END\]/i;
          
          if (planStartMarker.test(fullText) && planEndMarker.test(fullText)) {
            // Extract content between markers
            const startMatch = fullText.match(planStartMarker);
            const endMatch = fullText.match(planEndMarker);
            
            if (startMatch && endMatch) {
              const startIndex = startMatch.index! + startMatch[0].length;
              const endIndex = endMatch.index!;
              cleanContent = fullText.substring(startIndex, endIndex).trim();
              console.log('✅ Extracted plan content from markers:', cleanContent);
            }
          } else {
            // Fallback: try to extract plan content using patterns
            cleanContent = fullText;

            // Remove AI headers and introductions
            cleanContent = cleanContent.replace(/^Here's a plan:\s*/i, '');
            cleanContent = cleanContent.replace(/^Here's a flowchart:\s*/i, '');
            cleanContent = cleanContent.replace(/^Here's a diagram:\s*/i, '');
            cleanContent = cleanContent.replace(/^Here's a roadmap:\s*/i, '');
            cleanContent = cleanContent.replace(/^Here's a timeline:\s*/i, '');
            cleanContent = cleanContent.replace(/^Here's a process:\s*/i, '');
            cleanContent = cleanContent.replace(/^Here's a workflow:\s*/i, '');
            cleanContent = cleanContent.replace(/^Here's a strategy:\s*/i, '');
            cleanContent = cleanContent.replace(/^Let's create a project plan together\.\s*/i, '');
            cleanContent = cleanContent.replace(/^What project would you like to plan\?\s*/i, '');

            // Remove common AI follow-up patterns
            cleanContent = cleanContent.replace(/\n\n\(Please note:.*?\)/g, '');
            cleanContent = cleanContent.replace(/\n\nHow was that\?.*$/g, '');
            cleanContent = cleanContent.replace(/\n\nWould you like me to.*$/g, '');
            cleanContent = cleanContent.replace(/\n\nIs there anything else.*$/g, '');
            cleanContent = cleanContent.replace(/\n\nLet me know if.*$/g, '');
            cleanContent = cleanContent.replace(/\n\nWhat do you think\?.*$/g, '');
            cleanContent = cleanContent.replace(/\n\nWould you like me to continue.*$/g, '');

            // Remove everything after the plan content (follow-up questions)
            cleanContent = cleanContent.replace(/\n\n.*$/g, '');

            // Clean up any remaining double newlines and convert \n to actual newlines
            cleanContent = cleanContent.replace(/\\n/g, '\n').replace(/\n\n\n+/g, '\n\n').trim();
            
            console.log('🔍 Fallback plan extraction - original:', fullText);
            console.log('🔍 Fallback plan extraction - cleaned:', cleanContent);
          }

          // Detect plan type based on content - be more specific
          console.log('🔍 Analyzing plan content for type detection:', cleanContent.substring(0, 200));
          
          // Check for timeline patterns FIRST (dates, phases, steps) - this should be checked before flowchart
          if (cleanContent.includes('timeline') || cleanContent.includes('phase') || cleanContent.includes('step \d+') || cleanContent.includes('week') || cleanContent.includes('month') || cleanContent.includes('day') || cleanContent.includes('schedule') || cleanContent.includes('january') || cleanContent.includes('february') || cleanContent.includes('march') || cleanContent.includes('april') || cleanContent.includes('may') || cleanContent.includes('june') || cleanContent.includes('july') || cleanContent.includes('august') || cleanContent.includes('september') || cleanContent.includes('october') || cleanContent.includes('november') || cleanContent.includes('december') || cleanContent.includes('weeks') || cleanContent.includes('q1:') || cleanContent.includes('q2:') || cleanContent.includes('q3:') || cleanContent.includes('q4:')) {
            planType = 'timeline';
            console.log('🎯 Detected timeline type - found timeline patterns');
          } 
          // Check for flowchart patterns (arrows, decisions, start/end)
          else if (cleanContent.includes('→') || cleanContent.includes('->') || cleanContent.includes('flowchart') || cleanContent.includes('decision') || cleanContent.includes('if') || cleanContent.includes('?') || cleanContent.includes('start') || cleanContent.includes('end') || cleanContent.includes('yes') || cleanContent.includes('no') || cleanContent.includes('valid') || cleanContent.includes('invalid')) {
            planType = 'flowchart';
            console.log('🎯 Detected flowchart type - found flowchart patterns');
          } 
          // Check for roadmap patterns (milestones, goals, quarters)
          else if (cleanContent.includes('roadmap') || cleanContent.includes('milestone') || cleanContent.includes('goal') || cleanContent.includes('objective') || cleanContent.includes('target') || cleanContent.includes('quarter') || cleanContent.includes('release') || cleanContent.includes('q1') || cleanContent.includes('q2') || cleanContent.includes('q3') || cleanContent.includes('q4')) {
            planType = 'roadmap';
            console.log('🎯 Detected roadmap type - found roadmap patterns');
          } 
          // Check for process patterns (workflow, procedure, steps)
          else if (cleanContent.includes('process') || cleanContent.includes('workflow') || cleanContent.includes('procedure') || cleanContent.includes('step') || cleanContent.includes('stage') || cleanContent.includes('onboarding') || cleanContent.includes('methodology') || cleanContent.includes('approach')) {
            planType = 'process';
            console.log('🎯 Detected process type - found process patterns');
          } 
          // Check for diagram patterns (visual, structure, chart)
          else if (cleanContent.includes('diagram') || cleanContent.includes('chart') || cleanContent.includes('visual') || cleanContent.includes('structure') || cleanContent.includes('architecture') || cleanContent.includes('model')) {
            planType = 'diagram';
            console.log('🎯 Detected diagram type - found diagram patterns');
          } 
          // Default to roadmap for general plans
          else {
            planType = 'roadmap';
            console.log('🎯 Defaulting to roadmap type - no specific patterns found');
          }

          // If content is still empty or very short, generate a default plan
          if (cleanContent.length < 10) {
            cleanContent = `Default Project Plan

1. Planning Phase
   - Define objectives
   - Set timeline
   - Allocate resources

2. Execution Phase
   - Implement tasks
   - Monitor progress
   - Adjust as needed

3. Review Phase
   - Evaluate results
   - Document lessons
   - Plan improvements

4. Completion Phase
   - Finalize deliverables
   - Celebrate success
   - Archive project`;
            console.log('⚠️ Plan content too short, generated default plan');
          }

          // Only proceed if we have actual plan content
          if (cleanContent.length > 5) {
            // Extract a better title from the content
            let title = 'Plan';
            const lines = cleanContent.split('\n');
            
            if (lines.length > 0) {
              const firstLine = lines[0].trim();
              // Use first line as title if it's short and doesn't contain plan content
              if (firstLine.length > 0 && firstLine.length < 50 && !firstLine.includes('.')) {
                title = firstLine;
              } else {
                // Use plan type for title
                title = planType.charAt(0).toUpperCase() + planType.slice(1);
              }
            }

            messageContent.push({
              text: `[PLAN_START]\n${JSON.stringify({
                title: title,
                content: cleanContent,
                type: planType
              })}\n[PLAN_END]`
            });
            console.log('✅ Plan content embedded in message with type:', planType);
          } else {
            console.log('❌ No valid plan content found, skipping plan mode');
          }
        }
        
        // Don't preserve content from previous messages - let each message be independent
        // This prevents content from deleted chats appearing in new chats
        
        // Add the final message to the chat BEFORE clearing streaming state to prevent flicker
        console.log('📝 Creating final message with content:', messageContent);
        const assistantMessage: Message & { tokenUsage?: any } = {
          role: 'assistant',
          content: messageContent,
          ...(tokenUsage ? { tokenUsage } : {})
        };
        console.log('📝 Final message created:', assistantMessage);
        
        // Add message to chat context (this will update messages array)
        await addMessage(assistantMessage);
        console.log('✅ Message added to chat');
        
        // Use a small delay to ensure the message is rendered before hiding streaming
        // This prevents flicker by ensuring smooth transition
        setTimeout(() => {
          setIsStreaming(false);
          setStreamedContent('');
        }, 50);
        
        // Content is now embedded in the message - no need for separate processing
      }
    }, 25); // 25ms per character for smooth streaming
  };

  // Handle file uploads
  const handleFilesUploaded = async (files: TaskFile[]) => {
    setUploadedFiles(prev => [...prev, ...files]);
    setIsAnalyzing(true);
    
    try {
      // Show analysis message
      const analysisMessage: Message = {
        role: 'assistant',
        content: [{
          text: `I've received ${files.length} file(s). Let me analyze them...`
        }]
      };
      await addMessage(analysisMessage);
      
      // Process each file
      for (const file of files) {
        const fileMessage: Message = {
          role: 'user',
          content: [{
            text: `I've uploaded: ${file.fileName}${file.summary ? `\n\nSummary: ${file.summary}` : ''}${file.extractedText ? `\n\nContent: ${file.extractedText.substring(0, 500)}...` : ''}`
          }]
        };
        await addMessage(fileMessage);
      }
      
      setIsAnalyzing(false);
    } catch (error) {
      console.error('Error processing uploaded files:', error);
      setIsAnalyzing(false);
    }
  };

  // Debug function to test task creation
  const testTaskCreation = async () => {
    if (!user) {
      console.log('No user, cannot create test task');
      return;
    }
    
    try {
      console.log('Creating test task...');
      await addTask({
        text: 'Test task from assistant',
        dueDate: undefined
      });
      console.log('Test task created successfully');
    } catch (error) {
      console.error('Error creating test task:', error);
    }
  };

  useEffect(() => {
    // Auto-scroll to bottom for new messages
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({
            top: scrollAreaRef.current.scrollHeight,
            behavior: 'smooth'
        });
    }
  }, [messages]);

  // Check for initial message from session storage
  useEffect(() => {
    const initialMessage = sessionStorage.getItem('assistantInitialMessage');
    if (initialMessage) {
      sessionStorage.removeItem('assistantInitialMessage');
      handlePromptSubmit(initialMessage);
    }
  }, []);

  // Content is now embedded in messages - no restoration functions needed

  // Chat management functions
  const saveChat = async () => {
    if (messages.length === 0) {
      toast({
        title: "No messages to save",
        description: "Start a conversation first.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await saveCurrentChat();
      toast({
        title: "Chat saved",
        description: "Your conversation has been saved to your account.",
      });
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Could not save your chat.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearChat = () => {
    clearChat();
    toast({
      title: "Chat cleared",
      description: "Your conversation has been cleared.",
    });
  };

  const handleExportChat = () => {
    if (messages.length === 0) {
      toast({
        title: "No messages to export",
        description: "Start a conversation first.",
        variant: "destructive",
      });
      return;
    }

    try {
      exportChat();
      toast({
        title: "Chat exported",
        description: "Your conversation has been downloaded.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Could not export your chat.",
        variant: "destructive",
      });
    }
  };
  
  const compressImage = (file: File, maxWidth: number = 1920, quality: number = 0.8): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement('img');
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Compression failed'));
                return;
              }
              resolve(blob);
            },
            file.type,
            quality
          );
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageSelect = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    // Check if adding these files would exceed the limit
    if (selectedImages.length + fileArray.length > 6) {
      toast({
        title: "Too many images",
        description: `You can only attach up to 6 images. You currently have ${selectedImages.length}.`,
        variant: "destructive",
      });
      return;
    }

    // Validate files
    const validFiles = fileArray.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not an image file.`,
          variant: "destructive",
        });
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} is larger than 10MB.`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Upload images to Firebase Storage
    const newImages: Array<{ id: string; url: string; name: string }> = [];
    
    try {
      for (const file of validFiles) {
        // Compress image before uploading
        const compressedBlob = await compressImage(file, 1920, 0.8);
        
        // Create a unique filename
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(7);
        const fileExtension = file.name.split('.').pop() || 'png';
        const fileName = `${timestamp}_${randomId}.${fileExtension}`;
        
        // Upload to Firebase Storage
        const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
        const { storage } = await import('@/lib/firebase');
        
        const storageRef = ref(
          storage,
          `chat-images/${user?.uid || 'anonymous'}/${fileName}`
        );
        
        await uploadBytes(storageRef, compressedBlob, {
          contentType: file.type,
        });
        const downloadURL = await getDownloadURL(storageRef);

        newImages.push({
          id: randomId,
          url: downloadURL,
          name: file.name
        });
      }

      setSelectedImages(prev => [...prev, ...newImages]);
      toast({
        title: "Images attached",
        description: `Successfully attached ${newImages.length} image${newImages.length > 1 ? 's' : ''}.`,
      });
    } catch (error) {
      console.error('Error uploading images:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload images. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleImageRemove = (imageId: string) => {
    setSelectedImages(prev => prev.filter(img => img.id !== imageId));
    toast({
      title: "Image removed",
      description: "The image has been removed.",
    });
  };

  const handleImageReplace = async (imageId: string) => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.multiple = false;
    fileInput.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // Remove old image first
        handleImageRemove(imageId);
        // Add new image
        await handleImageSelect([file]);
      }
    };
    fileInput.click();
  };

  const handlePromptSubmit = async (prompt: string) => {
    if (!prompt.trim() && selectedImages.length === 0) return;

    // Create a new chat if we don't have one
    if (!currentChat) {
      try {
        const chatTitle = prompt.length > 50 ? prompt.substring(0, 50) + '...' : prompt || (selectedImages.length > 0 ? 'Image conversation' : 'New chat');
        const chatId = await createNewChat(chatTitle);
        console.log('Created new chat:', chatId);
        
        // Show success message
        toast({
          title: "New Chat Created",
          description: "Your conversation has been saved.",
        });
      } catch (error) {
        console.error('Error creating new chat:', error);
        toast({
          title: "Error",
          description: "Could not create a new chat.",
          variant: "destructive",
        });
        return;
      }
    }

    // Build message content with text and images
    // Use URLs instead of base64 to avoid body size limit
    const messageContent: any[] = [{ text: prompt || (selectedImages.length > 0 ? '(Images only)' : '') }];
    
    // Add all selected images (using Firebase Storage URLs)
    selectedImages.forEach(img => {
      messageContent.push({
        image: img.url, // Firebase Storage URL, not base64
        fileName: img.name
      });
    });

    const userMessage: Message = {
      role: 'user',
      content: messageContent
    };

    // Clear selected images after sending
    setSelectedImages([]);

    const updatedMessages = await addMessage(userMessage);
    setIsLoading(true);
    setIsThinking(true);
    
    // Show reasoning steps
    setIsReasoningActive(true);
    setIsReasoningExpanded(true);
    
    // Create dynamic reasoning steps based on current mode
    const getReasoningSteps = () => {
      const baseSteps = [
        {
          id: 'analyze',
          title: 'Analyzing Your Request',
          description: 'Processing context, understanding intent, and identifying key requirements',
          status: 'thinking' as const,
          details: uploadedFiles.length > 0 
            ? `Examining ${uploadedFiles.length} uploaded file(s) and conversation history`
            : 'Reviewing conversation context and extracting key information'
        },
        {
          id: 'plan',
          title: 'Planning Response Strategy',
          description: 'Determining optimal approach based on your needs and selected mode',
          status: 'thinking' as const,
          details: activeTab === 'code' 
            ? 'Preparing code generation with proper syntax validation and structure'
            : activeTab === 'canvas' 
            ? 'Structuring creative content layout with visual hierarchy'
            : activeTab === 'plan'
            ? 'Breaking down complex tasks into manageable, actionable steps'
            : 'Organizing comprehensive conversational response with relevant examples'
        },
        {
          id: 'generate',
          title: 'Generating High-Quality Response',
          description: 'Crafting detailed, contextually relevant content tailored to your request',
          status: 'thinking' as const,
          details: 'Ensuring accuracy, clarity, completeness, and natural flow'
        }
      ];
      
      return baseSteps;
    };
    
    setReasoningSteps(getReasoningSteps());
    setCurrentReasoningStep('analyze');
    
    // Don't reset code output - keep it visible during new messages
    // Only reset if explicitly switching to a different mode

    try {
      // Convert uploaded files to file context
      const fileContext: FileContext[] = uploadedFiles.map(file => ({
        fileName: file.fileName,
        fileType: file.fileType,
        extractedText: file.extractedText,
        summary: file.summary,
        tags: file.tags
      }));

      // Retry logic for API failures
      const response = await retryApiCall(() => 
        continueConversation(updatedMessages, fileContext, activeTab, advancedAI, undefined, selectedModel || 'auto')
      );
      
      // Update reasoning steps
      setTimeout(() => {
        setReasoningSteps(prev => prev.map(step => 
          step.id === 'analyze' ? { ...step, status: 'completed' as const } : step
        ));
        setCurrentReasoningStep('plan');
      }, 1000);

      setTimeout(() => {
        setReasoningSteps(prev => prev.map(step => 
          step.id === 'plan' ? { ...step, status: 'completed' as const } : step
        ));
        setCurrentReasoningStep('generate');
      }, 2000);

      setTimeout(() => {
        setReasoningSteps(prev => prev.map(step => 
          step.id === 'generate' ? { ...step, status: 'completed' as const } : step
        ));
      }, 3000);
      
      // Handle task actions
      if (response[0]?.action) {
        console.log('Task action detected:', response[0].action);
        
        if (response[0].action === 'create' && response[0].tasks) {
          console.log('Creating tasks:', response[0].tasks);
          console.log('User status:', user ? 'authenticated' : 'not authenticated');
          console.log('User details:', user);
          
          if (user) {
            // Create actual tasks for authenticated users
            try {
              console.log('User is authenticated, creating tasks...');
              const createdTasks = [];
              
              // Create all tasks
              for (const task of response[0].tasks) {
                console.log('Creating task:', task.text);
                await addTask({
                  text: task.text,
                  dueDate: task.dueDate || undefined
                });
                createdTasks.push({ text: task.text });
                console.log('Task created successfully:', task.text);
              }
              
              console.log('All tasks created:', createdTasks);
              const taskList = createdTasks.map(task => `• ${task.text}`).join('\n');
              const successMessage: Message = {
        role: 'assistant',
                content: [{
                  text: `Great! I've created ${createdTasks.length} task(s) for you:\n\n${taskList}\n\nYou can view and manage them in your tasks page.`
                }]
              };
              await addMessage(successMessage);
              return;
            } catch (error) {
              console.error('Error creating tasks:', error);
              console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
              const errorMessage: Message = {
                role: 'assistant',
                content: [{
                  text: `Sorry, I encountered an error while creating your tasks: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`
                }]
              };
              await addMessage(errorMessage);
              return;
            }
        } else {
            // Show task suggestions for unauthenticated users
            const taskSuggestions = response[0].tasks.map((task: any) => `• ${task.text}`).join('\n');
            const suggestionMessage: Message = {
              role: 'assistant',
              content: [{
                text: `Here are the tasks I suggest for you:\n\n${taskSuggestions}\n\nTo create and manage these tasks, please sign in to your account.`
              }]
            };
            await addMessage(suggestionMessage);
            return;
          }
        } else if (response[0].action === 'complete' && response[0].taskText) {
          console.log('Task completion requested:', response[0].taskText);
          if (user) {
            const completionMessage: Message = {
            role: 'assistant',
              content: [{
                text: `I understand you want to complete "${response[0].taskText}". Please go to your tasks page to mark it as complete.`
              }]
            };
            await addMessage(completionMessage);
          } else {
            const completionMessage: Message = {
              role: 'assistant',
              content: [{
                text: `To complete the task "${response[0].taskText}", please sign in to your account and use the tasks page.`
              }]
            };
            await addMessage(completionMessage);
          }
        } else if (response[0].action === 'delete' && response[0].taskText) {
          console.log('Task deletion requested:', response[0].taskText);
          if (user) {
            const deletionMessage: Message = {
              role: 'assistant',
              content: [{
                text: `I understand you want to delete "${response[0].taskText}". Please go to your tasks page to delete it.`
              }]
            };
            await addMessage(deletionMessage);
          } else {
            const deletionMessage: Message = {
              role: 'assistant',
              content: [{
                text: `To delete the task "${response[0].taskText}", please sign in to your account and use the tasks page.`
              }]
            };
            await addMessage(deletionMessage);
          }
        } else if (response[0].action === 'deleteCompleted') {
          console.log('Delete completed tasks requested');
          if (user) {
            const deleteCompletedMessage: Message = {
              role: 'assistant',
              content: [{
                text: `I understand you want to delete completed tasks. Please go to your tasks page to delete them.`
              }]
            };
            await addMessage(deleteCompletedMessage);
          } else {
            const deleteCompletedMessage: Message = {
              role: 'assistant',
              content: [{
                text: `To delete completed tasks, please sign in to your account and use the tasks page.`
              }]
            };
            await addMessage(deleteCompletedMessage);
          }
        }
      }

      // Stream the assistant's response
      const responseText = response[0].text || 'I understand.';
      const tokenUsage = response[0]?.tokenUsage;
      
      // Store token usage with the message
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && tokenUsage) {
        (lastMessage as any).tokenUsage = tokenUsage;
      }
      
      await streamResponse(responseText, tokenUsage);
      
      // Keep reasoning visible but collapsed after response is complete
      setTimeout(() => {
        setIsReasoningExpanded(false);
        setCurrentReasoningStep(undefined);
        // Keep isReasoningActive true so user can still see/expand it
      }, 500);
    } catch (error: any) {
      console.error('Error in chat:', error);
      
      // Hide reasoning on error
      setIsReasoningActive(false);
      setIsReasoningExpanded(false);
      setReasoningSteps([]);
      setCurrentReasoningStep(undefined);
      
      let errorText = 'Sorry, I encountered an error. Please try again.';
      let rateLimitInfo = null;
      
      // Try to extract rate limit info from error response
      try {
        if (error.response) {
          const errorData = await error.response.json();
          rateLimitInfo = errorData.rateLimitInfo;
        }
      } catch (e) {
        // Ignore parse errors
      }
      
      // Handle specific API errors
      if (rateLimitInfo && rateLimitInfo.retryAfterMessage) {
        errorText = `⏱️ Rate Limit Reached\n\n${rateLimitInfo.retryAfterMessage}\n\nYour request has been queued and will be processed automatically when the rate limit resets.`;
      } else if (error.message?.includes('rate limit') || error.message?.includes('Rate limit')) {
        // Try to extract retry time from error message
        const retryMatch = error.message.match(/(?:in|after|retry after)\s+(\d+\.?\d*)\s+second/i);
        if (retryMatch) {
          const retrySeconds = parseFloat(retryMatch[1]);
          errorText = `⏱️ Rate Limit Reached\n\nYou can retry in ${retrySeconds.toFixed(1)} seconds.\n\nYour request has been queued and will be processed automatically when the rate limit resets.`;
        } else {
          errorText = '⏱️ Rate Limit Reached\n\nToo many requests. Please wait a moment and try again.\n\nYour request has been queued and will be processed automatically.';
        }
      } else if (error.message?.includes('503') || error.message?.includes('overloaded')) {
        errorText = 'The AI service is currently overloaded. Please wait a moment and try again.';
      } else if (error.message?.includes('UNAVAILABLE')) {
        errorText = 'The AI service is temporarily unavailable. Please try again in a few minutes.';
      } else if (error.message?.includes('408') || error.message?.includes('timeout') || error.message?.includes('Request Timeout') || error.message?.includes('Request timeout')) {
        errorText = '⏱️ Request Timeout\n\nThe request took too long to process. This can happen when:\n• Analyzing large images\n• Processing complex requests\n\nPlease try:\n• Using smaller images\n• Breaking up your request into smaller parts\n• Waiting a moment and trying again';
      } else if (error.message?.includes('Failed to fetch') || error.message?.includes('ERR_CONNECTION_REFUSED')) {
        errorText = '🔌 Connection Error\n\nUnable to connect to the server. Please check:\n• Your internet connection\n• If the development server is running\n• Try refreshing the page';
      }
      
      const errorMessage: Message = {
            role: 'assistant',
        content: [{
          text: errorText
        }]
        };
      await addMessage(errorMessage);
      
      // If we have rate limit info, queue the request for retry
      if (rateLimitInfo && rateLimitInfo.retryAfter) {
        const retryMs = rateLimitInfo.retryAfter * 1000;
        setTimeout(() => {
          // Retry the request automatically
          handlePromptSubmit(prompt);
        }, retryMs);
      }
    } finally {
        setIsLoading(false);
      setIsThinking(false);
    }
  };

  // Message content component with LaTeX rendering
  const MessageContent = ({ content, initialHtml }: { content: string; initialHtml: string }) => {
    const messageRef = useRef<HTMLDivElement>(null);
    
    // Use useEffect to render LaTeX after component mounts
    useEffect(() => {
      if (messageRef.current && typeof window !== 'undefined') {
        // Wait a bit for KaTeX to load if needed
        const renderLatex = () => {
          if (!(window as any).katex) {
            setTimeout(renderLatex, 100);
            return;
          }
          
          const katex = (window as any).katex;
          const renderMathInElement = (window as any).renderMathInElement;
          
          // Try to use auto-render if available
          if (renderMathInElement) {
            try {
              renderMathInElement(messageRef.current!, {
                delimiters: [
                  {left: '\\[', right: '\\]', display: true},
                  {left: '\\(', right: '\\)', display: false},
                  {left: '$$', right: '$$', display: true},
                  {left: '$', right: '$', display: false}
                ],
                throwOnError: false,
                strict: false,
                ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code']
              });
            } catch (e) {
              console.error('Error in auto-render:', e);
              // Fall through to manual rendering
            }
          }
          
          // Always do manual rendering as well to ensure it works
          {
            // Manually render LaTeX to ensure it works
            const html = messageRef.current!.innerHTML;
            let newHtml = html;
            
            // Render block LaTeX \[ ... \] - handle multiline
            newHtml = newHtml.replace(/\\\[([\s\S]*?)\\\]/g, (match, latex) => {
              try {
                const rendered = katex.renderToString(latex.trim(), {
                  throwOnError: false,
                  displayMode: true
                });
                return `<div class="my-4 overflow-x-auto">${rendered}</div>`;
              } catch (e) {
                console.error('Error rendering block LaTeX:', e, latex);
                return match;
              }
            });
            
            // Render inline LaTeX \( ... \)
            newHtml = newHtml.replace(/\\\(([\s\S]*?)\\\)/g, (match, latex) => {
              try {
                return katex.renderToString(latex.trim(), {
                  throwOnError: false,
                  displayMode: false
                });
              } catch (e) {
                console.error('Error rendering inline LaTeX:', e, latex);
                return match;
              }
            });
            
            // Render block LaTeX $$ ... $$
            newHtml = newHtml.replace(/\$\$([\s\S]*?)\$\$/g, (match, latex) => {
              try {
                const rendered = katex.renderToString(latex.trim(), {
                  throwOnError: false,
                  displayMode: true
                });
                return `<div class="my-4 overflow-x-auto">${rendered}</div>`;
              } catch (e) {
                return match;
              }
            });
            
            // Render inline LaTeX $ ... $ (but not $$)
            newHtml = newHtml.replace(/(?<!\$)\$(?!\$)([^\$]+?)\$(?!\$)/g, (match, latex) => {
              try {
                return katex.renderToString(latex.trim(), {
                  throwOnError: false,
                  displayMode: false
                });
              } catch (e) {
                return match;
              }
            });
            
            if (newHtml !== html) {
              messageRef.current!.innerHTML = newHtml;
            }
          }
        };
        
        renderLatex();
      }
    }, [content]);
    
    if (!content) return <div></div>;
    
    return <div ref={messageRef} dangerouslySetInnerHTML={{ __html: initialHtml }} />;
  };
  
  // Simple wrapper function - returns JSX directly, not a component
  const formatMessage = (content: string) => {
    if (!content) return <div></div>;
    
    // First, protect LaTeX expressions from being processed as code
    const latexPlaceholders: string[] = [];
    let processedContent = content;
    
    // Extract and protect block LaTeX \[ ... \]
    processedContent = processedContent.replace(/\\\[([\s\S]*?)\\\]/g, (match) => {
      const id = `__LATEX_BLOCK_${latexPlaceholders.length}__`;
      latexPlaceholders.push(match);
      return id;
    });
    
    // Extract and protect inline LaTeX \( ... \)
    processedContent = processedContent.replace(/\\\(([\s\S]*?)\\\)/g, (match) => {
      const id = `__LATEX_INLINE_${latexPlaceholders.length}__`;
      latexPlaceholders.push(match);
      return id;
    });
    
    // Process markdown tables
    processedContent = processedContent.replace(/\n(\|.+\|)\n(\|[\s\-:]+\|)\n((?:\|.+\|\n?)+)/g, (match, header, separator, rows) => {
      const headerCells = header.split('|').map((c: string) => c.trim()).filter((c: string) => c);
      const rowLines = rows.trim().split('\n');
      
      let tableHtml = '<table class="border-collapse border border-gray-600 my-4 w-full"><thead><tr>';
      headerCells.forEach((cell: string) => {
        tableHtml += `<th class="border border-gray-600 px-3 py-2 text-left font-semibold">${cell}</th>`;
      });
      tableHtml += '</tr></thead><tbody>';
      
      rowLines.forEach((row: string) => {
        const cells = row.split('|').map((c: string) => c.trim()).filter((c: string) => c);
        if (cells.length > 0) {
          tableHtml += '<tr>';
          cells.forEach((cell: string) => {
            tableHtml += `<td class="border border-gray-600 px-3 py-2">${cell}</td>`;
          });
          tableHtml += '</tr>';
        }
      });
      
      tableHtml += '</tbody></table>';
      return tableHtml;
    });
    
    // Convert markdown-style formatting to HTML
    let formatted = processedContent
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-4 mb-2">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-semibold mt-4 mb-2">$1</h1>')
      // Bold (double asterisks)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      // Italic (triple asterisks)
      .replace(/\*\*\*([^*]+)\*\*\*/g, '<em>$1</em>')
      // Horizontal rules
      .replace(/^---$/gm, '<hr class="my-4 border-gray-600" />')
      // Inline code
      .replace(/`([^`]+)`/g, '<code class="bg-muted px-1 rounded text-sm">$1</code>')
      // Line breaks
      .replace(/\n/g, '<br />');
    
    // Restore LaTeX placeholders
    latexPlaceholders.forEach((latex, index) => {
      const isBlock = latex.startsWith('\\[');
      const id = isBlock ? `__LATEX_BLOCK_${index}__` : `__LATEX_INLINE_${index}__`;
      formatted = formatted.replace(id, latex);
    });
    
    // Return component that will handle LaTeX rendering
    return <MessageContent content={content} initialHtml={formatted} />;
  };

  const chatContent = (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <div ref={scrollAreaRef} className="flex-1 p-4 md:p-6 overflow-y-auto overflow-x-hidden">
        <div className="max-w-4xl mx-auto space-y-6 pb-4">
          {messages.map((message: Message, index: number) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "flex gap-3 md:gap-4",
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
                           {message.role === 'assistant' && (
                <Avatar className="h-8 w-8 md:h-10 md:w-10 shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot className="h-4 w-4 md:h-5 md:w-5" />
                                   </AvatarFallback>
                               </Avatar>
                           )}
              
              <div className={cn(
                "max-w-[85%] md:max-w-[70%] px-4 py-3 border rounded-lg",
                message.role === 'user' 
                  ? "text-foreground border-border/50" 
                  : "text-foreground border-border/50"
              )}>
                {/* Show reasoning at the top of assistant's last message while thinking */}
                {message.role === 'assistant' && index === messages.length - 1 && (isThinking || isReasoningActive) && (
                  <div className="mb-3 pb-3 border-b border-border/50">
                                {isThinking ? (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                          <span className="text-xs text-muted-foreground">Thinking...</span>
                        </div>
                        {reasoningSteps.length > 0 && (
                          <div className="space-y-1.5 pl-1">
                            {reasoningSteps.map((step) => (
                              <div key={step.id} className="flex items-center gap-2 text-xs">
                                {step.status === 'thinking' && step.id === currentReasoningStep ? (
                                  <Loader2 className="h-3 w-3 animate-spin text-blue-500 flex-shrink-0" />
                                ) : step.status === 'completed' ? (
                                  <div className="h-3 w-3 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                                    <span className="text-white text-[8px]">✓</span>
                                    </div>
                                ) : (
                                  <div className="h-3 w-3 rounded-full bg-gray-600 flex-shrink-0" />
                                )}
                                <span className={cn(
                                  "text-xs",
                                  step.id === currentReasoningStep ? "text-foreground font-medium" : "text-muted-foreground"
                                )}>
                                  {step.title}
                                </span>
                           </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <button 
                          onClick={() => setIsReasoningExpanded(!isReasoningExpanded)}
                          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
                        >
                          <Brain className="h-3 w-3 flex-shrink-0" />
                          <span>Reasoning process ({reasoningSteps.filter(s => s.status === 'completed').length} steps)</span>
                          {isReasoningExpanded ? <ChevronDown className="h-3 w-3 ml-auto flex-shrink-0" /> : <ChevronRight className="h-3 w-3 ml-auto flex-shrink-0" />}
                        </button>
                        {isReasoningExpanded && reasoningSteps.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-1.5 mt-2 pl-1"
                          >
                            {reasoningSteps.map((step) => (
                              <div key={step.id} className="flex items-center gap-2 text-xs">
                                <div className="h-3 w-3 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                                  <span className="text-white text-[8px]">✓</span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {step.title}
                                </span>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                <div className="whitespace-pre-wrap text-sm md:text-base leading-relaxed">
                  {Array.isArray(message.content) 
                    ? message.content.map((content: any, contentIndex: number) => {
                        const messageIndex = messages.findIndex(m => m === message);
                        
                        // Handle image content
                        if (content.image) {
                          return (
                            <motion.div
                              key={contentIndex}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.3 }}
                              className="my-2"
                            >
                              <div className="relative group">
                                <motion.img
                                  src={content.image}
                                  alt={content.fileName || 'Uploaded image'}
                                  className="rounded-lg max-w-full h-auto cursor-pointer border border-gray-700 hover:border-blue-500/50 transition-all"
                                  style={{ maxHeight: '400px' }}
                                  whileHover={{ scale: 1.02 }}
                                  transition={{ duration: 0.2 }}
                                  onClick={() => {
                                    // Open image in full size - use safer method for mobile PWA
                                    try {
                                      // Try opening in new tab first (works better on mobile)
                                      const link = document.createElement('a');
                                      link.href = content.image;
                                      link.target = '_blank';
                                      link.rel = 'noopener noreferrer';
                                      
                                      // For mobile PWA, use a modal instead of window.open
                                      if (window.matchMedia('(display-mode: standalone)').matches || 
                                          (window.navigator as any).standalone) {
                                        // PWA mode - use modal/image viewer
                                        const modal = document.createElement('div');
                                        modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.95);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;';
                                        modal.onclick = () => modal.remove();
                                        
                                        const img = document.createElement('img');
                                        img.src = content.image;
                                        img.style.cssText = 'max-width:100%;max-height:100%;object-fit:contain;';
                                        img.onclick = (e) => e.stopPropagation();
                                        
                                        modal.appendChild(img);
                                        document.body.appendChild(modal);
                                      } else {
                                        // Regular browser - use link
                                        link.click();
                                      }
                                    } catch (error) {
                                      console.error('Error opening image:', error);
                                      // Fallback: just open the URL
                                      window.open(content.image, '_blank', 'noopener,noreferrer');
                                    }
                                  }}
                                />
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <div className="bg-black/70 backdrop-blur-sm rounded px-2 py-1 text-xs text-white">
                                    Click to expand
                                  </div>
                                </div>
                                {content.fileName && (
                                  <div className="mt-1 text-xs text-muted-foreground">
                                    {content.fileName}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          );
                        }
                        
                        // Check for saved code content with markers
                        if (content.text?.startsWith('[CODE_START]') || content.text?.startsWith('[CSS_START]')) {
                          console.log('🔍 Found code markers in content:', content.text.substring(0, 200) + '...');
                          try {
                            // Handle both CODE_START and CSS_START markers
                            const cleanText = content.text
                              .replace(/\[CODE_START\]\n/, '')
                              .replace(/\[CSS_START\]\n/, '')
                              .replace(/\n\[CODE_END\]$/, '')
                              .replace(/\n\[CSS_END\]$/, '');
                            
                            console.log('🧹 Cleaned text:', cleanText.substring(0, 200) + '...');
                            
                            let codeData;
                            try {
                              codeData = JSON.parse(cleanText);
                              console.log('✅ Successfully parsed code data:', codeData);
                            } catch (parseError) {
                              // Fallback: if JSON parsing fails, try to extract code from simple format
                              console.log('❌ JSON parse failed, trying fallback extraction:', parseError);
                              const codeMatch = cleanText.match(/"code":\s*"([^"]+)"/);
                              if (codeMatch) {
                                codeData = {
                                  code: codeMatch[1].replace(/\\n/g, '\n'),
                                  language: 'css', // Default to CSS if we can't determine
                                  isExecutable: true
                                };
                                console.log('🔄 Fallback extraction successful:', codeData);
                              } else {
                                throw new Error('Could not extract code from content');
                              }
                            }
                            return (
                              <div key={contentIndex} className="mt-4">
                                <CodeMode 
                                  code={codeData.code}
                                  language={codeData.language}
                                  isExecutable={codeData.isExecutable}
                                  onEdit={() => {
                                    setEditingContent({
                                      type: 'code',
                                      content: codeData,
                                      messageIndex: messageIndex,
                                      contentIndex: contentIndex
                                    });
                                    setEditPrompt('');
                                  }}
                                />
                              </div>
                            );
                          } catch (e) {
                            console.error('Error parsing code content:', e);
                            return <div key={contentIndex}>Error loading code content</div>;
                          }
                        }
                        
                        // Check for saved canvas content with markers
                        if (content.text?.startsWith('[CANVAS_START]')) {
                          try {
                            const canvasData = JSON.parse(content.text.replace(/\[CANVAS_START\]\n/, '').replace(/\n\[CANVAS_END\]$/, ''));
                            return (
                              <div key={contentIndex} className="mt-4">
                                <CanvasMode 
                                  content={canvasData}
                                  onEdit={() => {
                                    setEditingContent({
                                      type: 'canvas',
                                      content: canvasData,
                                      messageIndex: messageIndex,
                                      contentIndex: contentIndex
                                    });
                                    setEditPrompt('');
                                  }}
                                />
            </div>
                            );
                          } catch (e) {
                            console.error('Error parsing canvas content:', e);
                            return <div key={contentIndex}>Error loading canvas content</div>;
                          }
                        }
                        
                        // Check for saved plan content with markers
                        if (content.text?.startsWith('[PLAN_START]')) {
                          try {
                            const planData = JSON.parse(content.text.replace(/\[PLAN_START\]\n/, '').replace(/\n\[PLAN_END\]$/, ''));
                    return (
                              <div key={contentIndex} className="mt-4">
                                <PlanMode 
                                  planData={planData}
                                  onEdit={() => {
                                    setEditingContent({
                                      type: 'plan',
                                      content: planData,
                                      messageIndex: messageIndex,
                                      contentIndex: contentIndex
                                    });
                                    setEditPrompt('');
                                  }}
                                />
            </div>
                            );
                          } catch (e) {
                            console.error('Error parsing plan content:', e);
                            return <div key={contentIndex}>Error loading plan content</div>;
                          }
                        }
                        
                    return (
                          <div key={contentIndex}>
                            {formatMessage(content.text)}
                          </div>
                        );
                      })
                    : formatMessage(typeof message.content === 'string' ? message.content : String(message.content))
                  }
                </div>
              </div>

                           {message.role === 'user' && (
                <Avatar className="h-8 w-8 md:h-10 md:w-10 shrink-0">
                  <AvatarFallback className="bg-gradient-to-r from-green-500 to-teal-600 text-white text-xs md:text-sm font-semibold">
                    {user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                           )}
            </motion.div>
          ))}
          
          {isLoading && !isThinking && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 md:gap-4 justify-start"
            >
              <Avatar className="h-8 w-8 md:h-10 md:w-10 shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <Bot className="h-4 w-4 md:h-5 md:w-5" />
                                   </AvatarFallback>
                               </Avatar>
              <div className="bg-muted border rounded-xl px-4 py-3 shadow-sm">
                <SkeletonMessage />
                        </div>
            </motion.div>
          )}

          {isStreaming && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 md:gap-4 justify-start"
            >
              <Avatar className="h-8 w-8 md:h-10 md:w-10 shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <Bot className="h-4 w-4 md:h-5 md:w-5" />
                </AvatarFallback>
              </Avatar>
              <div className="max-w-[85%] md:max-w-[70%] px-4 py-3 border rounded-lg text-foreground border-border/50">
                <div className="whitespace-pre-wrap text-sm md:text-base leading-relaxed">
                  {streamedContent}
                  <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
            </div>
              </div>
            </motion.div>
          )}
          
          {/* Content is now rendered inline with messages - no global output sections */}
          </div>
      </div>
          
          {/* Edit Content Modal */}
          {editingContent && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-background border rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    Edit {editingContent.type === 'code' ? 'Code' : editingContent.type === 'canvas' ? 'Canvas' : 'Plan'}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingContent(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
          </div>

                <div className="space-y-4">
        <div>
                    <label className="text-sm font-medium mb-2 block">
                      What would you like to change?
                    </label>
                    <textarea
                      value={editPrompt}
                      onChange={(e) => setEditPrompt(e.target.value)}
                      placeholder={`Describe how you'd like to edit this ${editingContent.type}...`}
                      className="w-full p-3 border rounded-lg resize-none bg-gray-900 text-white border-gray-700 focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-gray-400"
                      rows={3}
                    />
        </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={async () => {
                        if (!editPrompt.trim()) {
                          toast({
                            title: "Prompt required",
                            description: "Please describe what you'd like to change",
                            variant: "destructive",
                          });
                          return;
                        }
                        
                        setIsEditing(true);
                        try {
                          // Create edit prompt based on content type
                          let editInstruction = '';
                          if (editingContent.type === 'code') {
                            editInstruction = `Please edit this ${editingContent.content.language} code based on the user's request: "${editPrompt}". Here's the current code:\n\n\`\`\`${editingContent.content.language}\n${editingContent.content.code}\n\`\`\`\n\nPlease provide the updated code.`;
                          } else if (editingContent.type === 'canvas') {
                            editInstruction = `Please edit this story/canvas content based on the user's request: "${editPrompt}". Here's the current content:\n\n${editingContent.content.content}\n\nPlease provide the updated content.`;
                          } else if (editingContent.type === 'plan') {
                            editInstruction = `Please edit this plan based on the user's request: "${editPrompt}". Here's the current plan:\n\n${editingContent.content.content}\n\nPlease provide the updated plan.`;
                          }
                          
                          // Send edit request to AI
                          const response = await continueConversation([
                            { role: 'user', content: editInstruction }
                          ], undefined, activeTab);
                          
                          if (response && response.length > 0) {
                            // Process the AI response and update the content
                            const newContent = typeof response[0] === 'string' ? response[0] : response[0].text || '';
                            
                            // Update the message content
                            const updatedMessages = [...messages];
                            const messageToUpdate = updatedMessages[editingContent.messageIndex];
                            
                            if (messageToUpdate && Array.isArray(messageToUpdate.content)) {
                              const contentToUpdate = messageToUpdate.content[editingContent.contentIndex];
                              
                              if (editingContent.type === 'code') {
                                // Extract code from response
                                const codeMatch = typeof newContent === 'string' ? newContent.match(/```[\s\S]*?```/) : null;
                                if (codeMatch) {
                                  const updatedCode = codeMatch[0].replace(/```\w*\n?/, '').replace(/```$/, '');
                                  const updatedCodeData = {
                                    ...editingContent.content,
                                    code: updatedCode
                                  };
                                  
                                  contentToUpdate.text = `[CODE_START]\n${JSON.stringify(updatedCodeData)}\n[CODE_END]`;
                                }
                              } else if (editingContent.type === 'canvas') {
                                const updatedCanvasData = {
                                  ...editingContent.content,
                                  content: newContent
                                };
                                contentToUpdate.text = `[CANVAS_START]\n${JSON.stringify(updatedCanvasData)}\n[CANVAS_END]`;
                              } else if (editingContent.type === 'plan') {
                                const updatedPlanData = {
                                  ...editingContent.content,
                                  content: newContent
                                };
                                contentToUpdate.text = `[PLAN_START]\n${JSON.stringify(updatedPlanData)}\n[PLAN_END]`;
                              }
                              
                              // Update the messages by replacing the specific message
                              const updatedMessage = updatedMessages[editingContent.messageIndex];
                              if (updatedMessage) {
                                // Remove the old message and add the updated one
                                const newMessages = messages.filter((_, index) => index !== editingContent.messageIndex);
                                addMessage(updatedMessage);
                              }
                              
                              toast({
                                title: "Content updated!",
                                description: `Your ${editingContent.type} has been edited successfully`,
                              });
                              
                              setEditingContent(null);
                              setEditPrompt('');
                            }
                          }
                        } catch (error) {
                          console.error('Error editing content:', error);
                          toast({
                            title: "Edit failed",
                            description: "Could not edit the content. Please try again.",
                            variant: "destructive",
                          });
                        } finally {
                          setIsEditing(false);
                        }
                      }}
                      disabled={isEditing}
                      className="flex-1"
                    >
                      {isEditing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Editing...
                        </>
                      ) : (
                        <>
                          <Wand2 className="mr-2 h-4 w-4" />
                          Edit with AI
                        </>
                      )}
        </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => setEditingContent(null)}
                      disabled={isEditing}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
      <div className="p-4 md:p-6 border-t bg-background/95 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* File Upload Section */}
          {showFileUpload && (
            <div className="mb-4">
              <FileUpload 
                onFilesUploaded={handleFilesUploaded}
                maxFiles={5}
                className="mb-4"
              />
          </div>
          )}
          
          {/* Uploaded Files Display */}
          {uploadedFiles.length > 0 && (
            <div className="mb-4 p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Uploaded Files ({uploadedFiles.length})</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setUploadedFiles([]);
                    setShowFileUpload(false);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
      </div>
              <div className="flex flex-wrap gap-2">
                {uploadedFiles.map((file, index) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-2 bg-background px-3 py-2 rounded-md text-sm cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => {
                      // Safe file opening for mobile PWA
                      try {
                        if (file.fileType.startsWith('image/')) {
                          // For images, use modal on mobile PWA
                          if (window.matchMedia('(display-mode: standalone)').matches || 
                              (window.navigator as any).standalone) {
                            const modal = document.createElement('div');
                            modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.95);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;';
                            modal.onclick = () => modal.remove();
                            
                            const img = document.createElement('img');
                            img.src = file.fileUrl;
                            img.style.cssText = 'max-width:100%;max-height:100%;object-fit:contain;';
                            img.onclick = (e) => e.stopPropagation();
                            
                            modal.appendChild(img);
                            document.body.appendChild(modal);
                          } else {
                            // Regular browser - open in new tab
                            window.open(file.fileUrl, '_blank', 'noopener,noreferrer');
                          }
                        } else {
                          // For other files, use link download
                          const link = document.createElement('a');
                          link.href = file.fileUrl;
                          link.target = '_blank';
                          link.rel = 'noopener noreferrer';
                          link.download = file.fileName;
                          link.click();
                        }
                      } catch (error) {
                        console.error('Error opening file:', error);
                        // Fallback
                        window.open(file.fileUrl, '_blank', 'noopener,noreferrer');
                      }
                    }}
                  >
                    {file.fileType.startsWith('image/') ? (
                      <ImageIcon className="h-4 w-4 text-blue-500" />
                    ) : file.fileType === 'application/pdf' ? (
                      <FileText className="h-4 w-4 text-red-500" />
                    ) : (
                      <File className="h-4 w-4 text-gray-500" />
                    )}
                    <span className="truncate max-w-32">{file.fileName}</span>
                    <Download className="h-3 w-3 text-gray-400 ml-1" />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Analysis Loading */}
          {isAnalyzing && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-sm text-blue-600">Analyzing uploaded files...</span>
        </div>
            </div>
          )}
          
          <PromptForm 
            onSubmit={handlePromptSubmit} 
            isLoading={isLoading} 
            activeTab={activeTab}
            onTabChange={setActiveTab}
            advancedAI={advancedAI}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            onImageSelect={handleImageSelect}
            onImageRemove={handleImageRemove}
            onImageReplace={handleImageReplace}
            selectedImages={selectedImages}
            showExamples={false}
            lastTokenUsage={messages.filter(m => m.role === 'assistant').slice(-1)[0] ? (messages.filter(m => m.role === 'assistant').slice(-1)[0] as any).tokenUsage : undefined}
          />
        </div>
      </div>
    </div>
  );

  const emptyStateContent = (
    <div className="flex-1 flex flex-col justify-center items-center p-4 md:p-8 min-h-0">
          <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
          className="w-full max-w-4xl mx-auto"
              >
                <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-3xl md:text-5xl font-bold font-headline tracking-tight mb-4">
                    What's on{' '}
                    <span
                      style={{
                        background: 'linear-gradient(to right, #8A2BE2, #FF69B4)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      your mind?
                    </span>
                  </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Ask me anything, or give me a task to do. I'm here to help with productivity, planning, and problem-solving.
            </p>
                </div>

          <div className="max-w-2xl mx-auto">
            <PromptForm 
              onSubmit={handlePromptSubmit} 
              isLoading={isLoading} 
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onFileUpload={() => setShowFileUpload(!showFileUpload)}
              onImageSelect={handleImageSelect}
              onImageRemove={handleImageRemove}
              onImageReplace={handleImageReplace}
              selectedImages={selectedImages}
              showExamples={messages.length === 0}
              lastTokenUsage={messages.filter(m => m.role === 'assistant').slice(-1)[0] ? (messages.filter(m => m.role === 'assistant').slice(-1)[0] as any).tokenUsage : undefined}
            />
          </div>

          {!user && (
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                To create and manage tasks, please sign in to your account.
              </p>
              <Button 
                onClick={() => router.push('/')}
                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Sign In to Continue
              </Button>
            </div>
          )}
              </motion.div>
          </AnimatePresence>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar - Responsive with better animations */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: isMobile ? -320 : 0, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: isMobile ? -320 : 0, opacity: 0 }}
            transition={{ 
              duration: 0.3, 
              ease: [0.4, 0.0, 0.2, 1],
              opacity: { duration: 0.2 }
            }}
            className={`fixed lg:relative z-50 w-80 h-full bg-background border-r flex flex-col shadow-lg lg:shadow-none ${
              isMobile ? 'backdrop-blur-sm' : ''
            }`}
          >
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Saved Chats</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden hover:bg-muted/50 transition-all duration-200"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    // Save current chat if it has messages
                    if (currentChat && messages.length > 0) {
                      try {
                        await saveCurrentChat();
                        console.log('Saved current chat before starting new one');
                      } catch (error) {
                        console.error('Error saving current chat:', error);
                        // Continue anyway
                      }
                    }
                    
                    clearChat();
                    setActiveTab('message');
                    setSidebarOpen(false);
                  } catch (error) {
                    console.error('Error starting new chat:', error);
                  }
                }}
                className="w-full justify-start hover:bg-gray-800 text-gray-200 hover:text-white transition-colors"
              >
                <Sparkles className="mr-2 h-4 w-4 text-purple-400" />
                New Chat
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  if (confirm('Are you sure you want to delete ALL chats? This cannot be undone.')) {
                    try {
                      for (const chat of savedChats) {
                        await deleteChat(chat.id);
                      }
                    } catch (error) {
                      console.error('Error deleting chats:', error);
                    }
                  }
                }}
                className="w-full justify-start hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors mt-1"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete All Chats
              </Button>
              
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto">
              {savedChats.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Save className="h-8 w-8 text-purple-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-300 mb-1">
                    No saved chats yet
                  </p>
                  <p className="text-xs text-gray-500">
                    Start a conversation to create your first chat
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {savedChats.map((chat: any) => (
                    <div
                      key={chat.id}
                      className={cn(
                        "relative p-3 pl-4 rounded-xl border transition-all duration-200 cursor-pointer group overflow-hidden",
                        currentChat?.id === chat.id
                          ? "bg-blue-500/10 border-blue-500/50 shadow-lg shadow-blue-500/10"
                          : "bg-gray-800/50 border-gray-700 hover:bg-gray-800 hover:border-gray-600 hover:shadow-md"
                      )}
                      onClick={async () => {
                        try {
                          console.log('Loading chat:', chat.id);
                          
                          // Save current chat if it has messages
                          if (currentChat && currentChat.id !== chat.id && messages.length > 0) {
                            try {
                              await saveCurrentChat();
                              console.log('Saved current chat before switching');
                            } catch (error) {
                              console.error('Error saving current chat:', error);
                              // Continue anyway, don't block the user
                            }
                          }
                          
                          // Load the selected chat
                          await loadChat(chat.id);
                          console.log('Loaded chat:', chat.id);
                          console.log('Chat messages:', chat.messages);
                          console.log('Chat messages length:', chat.messages.length);
                          
                          // Content is now handled by message rendering - no need for restoration
                          
                          // Close sidebar on mobile
                          setSidebarOpen(false);
                          
                          // Show success message
                          toast({
                            title: "Chat Loaded",
                            description: `Switched to "${chat.title}"`,
                          });
                        } catch (error) {
                          console.error('Error loading chat:', error);
                          toast({
                            title: "Error",
                            description: "Could not load the selected chat.",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <MessageSquare className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                            <h3 className={cn(
                              "font-semibold text-sm truncate",
                              currentChat?.id === chat.id ? "text-blue-300" : "text-gray-200"
                            )}>
                              {chat.title}
                            </h3>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <span className="w-1 h-1 rounded-full bg-gray-500"></span>
                              {chat.messages?.length || 0} messages
                            </span>
                            <span>
                              {chat.updatedAt ? new Date(chat.updatedAt.seconds ? chat.updatedAt.seconds * 1000 : chat.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Invalid Date'}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async (e) => {
                            e.stopPropagation();
                            
                            // Show confirmation dialog
                            const confirmDelete = window.confirm(
                              `Are you sure you want to delete "${chat.title}"? This action cannot be undone.`
                            );
                            
                            if (confirmDelete) {
                              try {
                                await deleteChat(chat.id);
                                toast({
                                  title: "Chat deleted",
                                  description: `"${chat.title}" has been deleted.`,
                                });
                              } catch (error) {
                                toast({
                                  title: "Delete failed",
                                  description: "Could not delete the chat. Please try again.",
                                  variant: "destructive",
                                });
                              }
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 h-auto hover:bg-red-500/20 hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      {currentChat?.id === chat.id && (
                        <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-blue-400 to-blue-600"></div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Enhanced overlay for mobile */}
      {sidebarOpen && isMobile && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="p-4 md:p-6 border-b shrink-0 bg-background/95 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="relative hover:bg-gray-800/50 text-gray-400 hover:text-white transition-all duration-200 group"
              >
                <motion.div
                  animate={{ rotate: sidebarOpen ? 0 : 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="relative"
                >
                  {sidebarOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </motion.div>
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {sidebarOpen ? 'Close' : 'Saved Chats'}
                </span>
              </Button>
              <div>
                <h1 className="text-xl md:text-2xl font-headline font-bold text-foreground">
                  AI Assistant
                </h1>
                <p className="text-sm text-muted-foreground">
                  {messages.length > 0 ? `${messages.length} messages` : 'Start a conversation'}
                </p>
              </div>
            </div>
            
             <div className="flex items-center gap-2">
               {/* File Upload Button */}
              <Button asChild variant="ghost" size="sm" className="hover:bg-gray-800 text-gray-300 hover:text-white transition-colors">
                <Link href="/" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Home</span>
                </Link>
              </Button>
            </div>
          </div>
        </header>
        
        {messages.length > 0 ? chatContent : emptyStateContent}
      </main>
    </div>
  );
}
