'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/auth-context';
import { 
  subscribeToCollabMessages, 
  sendMessage, 
  getCollabTasks,
  getCollaboration 
} from '@/lib/firebase-collaborations';
import type { CollabMessage, Collaboration, CollabTask } from '@/lib/types';

interface CollabCompanionChatProps {
  collabId: string;
}

export function CollabCompanionChat({ collabId }: CollabCompanionChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<CollabMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [collab, setCollab] = useState<Collaboration | null>(null);
  const [tasks, setTasks] = useState<CollabTask[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const respondedToMessagesRef = useRef<Set<string>>(new Set());
  const isRespondingRef = useRef(false);

  // Load collaboration and tasks
  useEffect(() => {
    async function loadData() {
      const collabData = await getCollaboration(collabId);
      if (collabData) {
        setCollab(collabData);
      }
      
      const collabTasks = await getCollabTasks(collabId);
      setTasks(collabTasks);
    }
    loadData();
  }, [collabId]);

  // Subscribe to messages
  useEffect(() => {
    const unsubscribe = subscribeToCollabMessages(collabId, (newMessages) => {
      setMessages(newMessages);
      // Scroll to bottom when new messages arrive
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return () => unsubscribe();
  }, [collabId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Detect if someone is talking to the AI (context-aware)
  const isTalkingToAI = useCallback((message: string): boolean => {
    const lowerMessage = message.toLowerCase();
    
    // Direct mentions
    const directMentions = [
      'companion',
      'ai',
      'assistant',
      'bot',
      'help',
      'hey',
      'hi',
      'hello',
      'what',
      'how',
      'why',
      'when',
      'where',
      'can you',
      'could you',
      'please',
      'tell me',
      'show me',
      'explain',
      'create',
      'make',
      'add',
      'list',
      'what are',
      'what is',
      'how do',
      'how can',
    ];
    
    // Check if message starts with or contains direct mentions
    const startsWithMention = directMentions.some(mention => 
      lowerMessage.startsWith(mention) || lowerMessage.includes(` ${mention} `)
    );
    
    // Check for question marks (questions are often directed at AI)
    const isQuestion = lowerMessage.includes('?');
    
    // Check for imperative verbs (commands)
    const hasCommand = /^(create|make|add|list|show|tell|explain|help|find|get|do|can|could|will|would)/i.test(lowerMessage);
    
    // If message is very short and is a question or command, likely talking to AI
    if (lowerMessage.length < 50 && (isQuestion || hasCommand)) {
      return true;
    }
    
    // If message contains task-related keywords and is a question/command
    const taskKeywords = ['task', 'tasks', 'todo', 'due', 'deadline', 'complete', 'done', 'finished'];
    const hasTaskKeyword = taskKeywords.some(keyword => lowerMessage.includes(keyword));
    
    if (hasTaskKeyword && (isQuestion || hasCommand || startsWithMention)) {
      return true;
    }
    
    return startsWithMention || (isQuestion && lowerMessage.length < 100);
  }, []);

  // Check recent messages to see if someone is talking to AI
  const shouldRespondToMessage = useCallback((newMessage: CollabMessage): boolean => {
    if (newMessage.isCompanion) return false; // Don't respond to own messages
    if (!collab?.companion?.enabled) return false; // Companion not enabled
    
    // Check if message is directed at AI
    return isTalkingToAI(newMessage.content);
  }, [collab, isTalkingToAI]);

  // Auto-respond to messages that seem directed at AI
  useEffect(() => {
    if (messages.length === 0) return;
    if (isRespondingRef.current) return; // Already responding
    
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.isCompanion) return;
    
    // Skip if we've already responded to this message
    if (respondedToMessagesRef.current.has(lastMessage.id)) return;
    
    // Check if we should respond (with a small delay to avoid immediate responses)
    if (shouldRespondToMessage(lastMessage)) {
      // Mark as responded to prevent duplicate responses
      respondedToMessagesRef.current.add(lastMessage.id);
      isRespondingRef.current = true;
      
      const timer = setTimeout(async () => {
        await handleAIResponse(lastMessage);
        isRespondingRef.current = false;
      }, 1000); // 1 second delay
      
      return () => {
        clearTimeout(timer);
        isRespondingRef.current = false;
      };
    }
  }, [messages, shouldRespondToMessage]);

  // Handle AI response
  const handleAIResponse = async (userMessage: CollabMessage) => {
    if (!collab?.companion?.enabled || !user) return;
    
    setIsLoading(true);
    
    try {
      // Build conversation history (last 10 messages)
      const recentMessages = messages.slice(-10);
      const history = recentMessages.map(msg => ({
        role: msg.isCompanion ? 'assistant' as const : 'user' as const,
        content: msg.content,
      }));
      
      // Add current user message
      history.push({
        role: 'user',
        content: userMessage.content,
      });
      
      // Build task context
      let taskContext = '';
      if (tasks.length > 0) {
        taskContext = `\n\nCOLLABORATION TASKS (${tasks.length} total):\n`;
        tasks.slice(0, 20).forEach((task, index) => {
          const completed = task.completed ? '✅' : '⏳';
          const tags = task.tags && task.tags.length > 0 ? ` [Tags: ${task.tags.join(', ')}]` : '';
          const dueDate = task.dueDate ? ` [Due: ${new Date(task.dueDate).toLocaleDateString()}]` : '';
          taskContext += `${index + 1}. ${completed} "${task.text}"${tags}${dueDate}\n`;
        });
      }
      
      // Build companion personality prompt
      const personalityPrompt = collab.companion?.personality
        ? `\n\nYour personality: ${collab.companion.personality}`
        : '';
      
      const companionName = collab.companion?.name || 'Collab Companion';
      
      // Call AI API
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          activeTab: 'message',
          advancedAI: false,
          taskContext: taskContext || undefined,
          companionContext: `You are ${companionName}, an AI assistant for this collaboration.${personalityPrompt}\n\nYou can see and help with collaboration tasks. Be helpful, friendly, and context-aware.`,
        }),
      });
      
      if (!response.ok) throw new Error('AI API error');
      
      const data = await response.json();
      if (data.responses && data.responses.length > 0) {
        const aiResponse = data.responses[0].text || data.responses[0];
        
        // Send AI response as companion message
        await sendMessage(
          collabId,
          null, // No user ID for companion
          companionName,
          typeof aiResponse === 'string' ? aiResponse : JSON.stringify(aiResponse),
          true // isCompanion
        );
      }
    } catch (error) {
      console.error('Error generating AI response:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle user sending a message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;
    
    const messageContent = input.trim();
    setInput('');
    
    // Send user message
    const messageId = await sendMessage(
      collabId,
      user.uid,
      user.displayName || user.email?.split('@')[0] || 'User',
      messageContent,
      false
    );
    
    // Note: The useEffect hook will handle AI responses automatically
    // No need to trigger it here to avoid duplicate responses
  };

  // Simple markdown-like formatting
  const formatMessage = (content: string) => {
    // Convert markdown-style formatting to HTML
    let formatted = content
      // Code blocks
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-gray-800 p-2 rounded my-2 overflow-x-auto"><code>$2</code></pre>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code class="bg-gray-800 px-1 rounded text-sm">$1</code>')
      // Bold
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-indigo-400 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
      // Line breaks
      .replace(/\n/g, '<br />');
    
    return <div dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-900/80 to-gray-900/50 border-l border-gray-700/50 overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-gray-700/50 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500/20 blur-md rounded-full"></div>
            {collab?.companion?.icon ? (
              <img
                src={collab.companion.icon}
                alt={collab.companion.name || 'Companion'}
                className="h-10 w-10 rounded-lg border-2 border-indigo-500/30 relative z-10"
              />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center border-2 border-indigo-500/30 relative z-10">
                <Bot className="h-5 w-5 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm flex items-center gap-2">
              {collab?.companion?.name || 'Collab Companion'}
              {collab?.companion?.enabled && (
                <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
              )}
            </h3>
            <p className="text-xs text-muted-foreground">
              {collab?.companion?.enabled ? 'AI Assistant • Online' : 'Disabled'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 min-h-0" ref={scrollAreaRef}>
        <div className="p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-16">
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full"></div>
                <Bot className="h-12 w-12 text-indigo-400/50 relative z-10" />
              </div>
              <h3 className="font-semibold text-sm mb-1">No messages yet</h3>
              <p className="text-xs text-muted-foreground max-w-xs">
                Start a conversation with your AI companion!
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.isCompanion ? 'flex-row' : message.userId === user?.uid ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  {message.isCompanion ? (
                    collab?.companion?.icon ? (
                      <AvatarImage src={collab.companion.icon} />
                    ) : (
                      <AvatarFallback>
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    )
                  ) : (
                    <AvatarFallback>
                      {message.userName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div
                  className={`flex-1 ${
                    message.userId === user?.uid ? 'items-end' : 'items-start'
                  } flex flex-col gap-1`}
                >
                  <div className="text-xs text-muted-foreground">
                    {message.userName}
                    {message.isCompanion && (
                      <span className="ml-1">
                        <Sparkles className="h-3 w-3 inline" />
                      </span>
                    )}
                  </div>
                  <div
                    className={`rounded-xl p-4 max-w-[80%] shadow-lg ${
                      message.isCompanion
                        ? 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-100 border border-indigo-500/30'
                        : message.userId === user?.uid
                        ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-indigo-500/20'
                        : 'bg-gray-800/80 text-gray-100 border border-gray-700/50'
                    }`}
                  >
                    <div className="prose prose-invert prose-sm max-w-none">
                      {formatMessage(message.content)}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(message.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback>
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-2 bg-indigo-500/20 rounded-lg p-3">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                <span className="text-sm text-muted-foreground">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      {collab?.companion?.enabled && (
        <form onSubmit={handleSend} className="p-4 border-t border-gray-700/50 bg-gray-900/30 shrink-0">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="bg-gray-800/50 border-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50"
              disabled={isLoading}
            />
            <Button 
              type="submit" 
              disabled={!input.trim() || isLoading}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/20 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

