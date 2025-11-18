'use client';

import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { X, Bot, User, Loader2, MessageSquare, Save, Trash2, Download, MoreVertical, ChevronUp, ChevronDown, CheckSquare, Clock, Star, Image as ImageIcon } from 'lucide-react';
import { PromptForm } from '@/components/assistant/prompt-form';
import { continueConversation } from '@/ai/flows/chat';
import type { Message } from '@/ai/flows/chat';
import { useTasks } from '@/context/task-context';
import { useChat } from '@/context/chat-context';
import { useAuth } from '@/context/auth-context';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AssistantSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  initialMessages?: Message[];
  selectedModel?: string;
  onModelChange?: (modelId: string) => void;
}

export function AssistantSidebar({ isOpen, onClose, initialMessages = [], selectedModel = 'auto', onModelChange }: AssistantSidebarProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [showChats, setShowChats] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageName, setSelectedImageName] = useState<string>('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { addMultipleTasks, toggleTask, deleteTask, editTask, tasks } = useTasks();
  const { 
    savedChats, 
    currentChat, 
    createNewChat, 
    saveCurrentChat, 
    addMessage, 
    deleteChat, 
    exportChat, 
    clearChat, 
    loadChat 
  } = useChat();
  const { user } = useAuth();

  // Update messages when initialMessages change
  useEffect(() => {
    if (initialMessages.length > 0) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  // Sync messages when currentChat changes (when loading a saved chat)
  useEffect(() => {
    if (currentChat && currentChat.messages) {
      setMessages(currentChat.messages);
    }
  }, [currentChat]);

  // Chat management functions
  const handleSaveChat = async () => {
    if (messages.length === 0) {
      toast({
        title: "No messages to save",
        description: "Start a conversation first.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to save chats.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      if (!currentChat) {
        const firstMessage = messages[0];
        let chatTitle = 'New Chat';
        if (firstMessage?.content) {
          if (typeof firstMessage.content === 'string') {
            chatTitle = firstMessage.content.substring(0, 50) + '...';
          } else if (Array.isArray(firstMessage.content) && firstMessage.content[0]?.text) {
            chatTitle = firstMessage.content[0].text.substring(0, 50) + '...';
          }
        }
        await createNewChat(chatTitle);
      }
      
      // Save all messages to Firebase
      for (const message of messages) {
        await addMessage(message);
      }
      
      await saveCurrentChat();
      toast({
        title: "Chat saved",
        description: "Your conversation has been saved to your account.",
      });
    } catch (error) {
      console.error('Error saving chat:', error);
      toast({
        title: "Save failed",
        description: "Could not save your chat.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadChat = async (chatId: string) => {
    try {
      // Load the chat using the context
      await loadChat(chatId);
      
      setShowChats(false);
      toast({
        title: "Chat loaded",
        description: "Your conversation has been loaded.",
      });
    } catch (error) {
      console.error('Error loading chat:', error);
      toast({
        title: "Load failed",
        description: "Could not load the chat.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteChat = async (chatId: string, chatTitle: string) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${chatTitle}"? This action cannot be undone.`
    );
    
    if (confirmDelete) {
      try {
        await deleteChat(chatId);
        toast({
          title: "Chat deleted",
          description: `"${chatTitle}" has been deleted.`,
        });
      } catch (error) {
        console.error('Error deleting chat:', error);
        toast({
          title: "Delete failed",
          description: "Could not delete the chat.",
          variant: "destructive",
        });
      }
    }
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

  const handleClearChat = () => {
    clearChat();
    setMessages([]);
    toast({
      title: "Chat cleared",
      description: "Your conversation has been cleared.",
    });
  };

  const scrollToTop = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = 0;
    }
  };

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  };

  // Removed auto-scroll - let user manually control scrolling
  
  const handleImageSelect = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;
    
    // Use the first file
    const file = fileArray[0];
    
    // Convert image to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
      setSelectedImageName(file.name);
      
      // Auto-select vision model if not already using one
      if (onModelChange) {
        const visionModels = ['llama-4-scout', 'llama-4-maverick', 'llama-3.2-90b-vision', 'gpt-4o', 'gpt-4o-mini', 'claude-3-5-sonnet', 'claude-3-opus', 'gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash'];
        if (!visionModels.includes(selectedModel || 'auto')) {
          onModelChange('llama-4-scout'); // Use Groq Llama 4 Scout for vision (fast and supports images)
        }
      }
      
      toast({
        title: "Image attached",
        description: `${file.name} will be included with your next message.`,
      });
    };
    reader.readAsDataURL(file);
  };

  const handlePromptSubmit = async (prompt: string) => {
    setIsLoading(true);
    
    // Build message content with optional image
    const messageContent: any[] = [{ text: prompt }];
    if (selectedImage) {
      messageContent.push({
        image: selectedImage,
        fileName: selectedImageName
      });
    }
    
    const userMessage: Message = {
      role: 'user',
      content: messageContent,
    };
    
    // Clear selected image after sending
    setSelectedImage(null);
    setSelectedImageName('');
    
    const currentMessages = [...messages, userMessage];
    
    // If all images removed and using a vision model, switch back to auto
    if (onModelChange) {
      const visionModels = ['llama-4-scout', 'llama-4-maverick', 'gpt-4o', 'gpt-4o-mini', 'claude-3-5-sonnet', 'claude-3-opus', 'gemini-1.5-flash'];
      if (visionModels.includes(selectedModel || 'auto')) {
        // Only switch back if no images in the message
        const hasImagesInMessages = currentMessages.some(msg => 
          Array.isArray(msg.content) && 
          msg.content.some((c: any) => (c as any).image)
        );
        if (!hasImagesInMessages) {
          onModelChange('auto');
        }
      }
    }
    setMessages(currentMessages);

    // Save user message to Firebase if authenticated
    if (user) {
      try {
        // If we don't have a current chat, create a new one
        if (!currentChat) {
          const chatTitle = prompt.length > 50 ? prompt.substring(0, 50) + '...' : prompt;
          await createNewChat(chatTitle);
        }
        // Add the message to the current chat
        await addMessage(userMessage);
      } catch (error) {
        console.error('Error saving user message:', error);
      }
    }

    const thinkingMessage: Message & { id: string, isThinking: boolean } = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: [],
      isThinking: true
    };
    setMessages(prev => [...prev, thinkingMessage as any]);

    try {
      const response = await continueConversation(currentMessages, undefined, undefined, undefined, undefined, selectedModel);
      
      // Handle task actions
      if (response[0]?.action) {
        console.log('Task action detected:', response[0].action);
        
        if (response[0].action === 'create' && response[0].tasks) {
          console.log('Creating tasks:', response[0].tasks);
          addMultipleTasks(response[0].tasks);
        } else if (response[0].action === 'complete' && response[0].taskText) {
          console.log('Completing task:', response[0].taskText);
          const taskToComplete = tasks.find(task => 
            task.text.toLowerCase().includes(response[0].taskText!.toLowerCase())
          );
          if (taskToComplete) {
            toggleTask(taskToComplete.id);
            console.log('Task completed successfully');
          } else {
            console.log('Task not found:', response[0].taskText);
          }
        } else if (response[0].action === 'delete' && response[0].taskText) {
          console.log('Deleting task:', response[0].taskText);
          const taskToDelete = tasks.find(task => 
            task.text.toLowerCase().includes(response[0].taskText!.toLowerCase())
          );
          if (taskToDelete) {
            deleteTask(taskToDelete.id);
            console.log('Task deleted successfully');
          } else {
            console.log('Task not found:', response[0].taskText);
          }
        } else if (response[0].action === 'deleteCompleted') {
          console.log('Deleting all completed tasks');
          const completedTasks = tasks.filter(task => task.completed);
          for (const task of completedTasks) {
            deleteTask(task.id);
          }
          console.log(`Deleted ${completedTasks.length} completed tasks`);
        } else if (response[0].action === 'update' && response[0].taskText && response[0].updates) {
          console.log('Updating task:', response[0].taskText, 'with updates:', response[0].updates);
          const taskToUpdate = tasks.find(task => 
            task.text.toLowerCase().includes(response[0].taskText!.toLowerCase())
          );
          if (taskToUpdate) {
            editTask(taskToUpdate.id, response[0].updates);
            console.log('Task updated successfully');
          } else {
            console.log('Task not found:', response[0].taskText);
          }
        }
      } else if (response[0]?.tasks) {
        // Fallback for old format
        addMultipleTasks(response[0].tasks);
      }
      
      // Prepare assistant response with task data for beautiful display
      console.log('🔍 Full AI Response:', JSON.stringify(response, null, 2));
      console.log('🔍 Action:', response[0]?.action);
      console.log('🔍 Tasks:', response[0]?.tasks);
      console.log('🔍 First Task:', response[0]?.tasks?.[0]);
      
      const assistantResponse: Message & { taskData?: any, tokenUsage?: any } = {
        role: 'assistant',
        content: [{ text: response[0]?.text || 'No response' }],
        ...(response[0]?.action === 'create' && response[0]?.tasks?.[0] 
          ? { taskData: response[0].tasks[0] } 
          : {}),
        ...(response[0]?.tokenUsage 
          ? { tokenUsage: response[0].tokenUsage } 
          : {})
      };

      console.log('✅ Assistant response with taskData:', JSON.stringify(assistantResponse, null, 2));

      setMessages(prev => {
        const newMessages = [...prev];
        const thinkingIndex = newMessages.findIndex(m => (m as any).isThinking);
        if (thinkingIndex !== -1) {
          newMessages[thinkingIndex] = assistantResponse as any;
        } else {
          newMessages.push(assistantResponse as any);
        }
        return newMessages;
      });

      // Save assistant response to Firebase if authenticated
      if (user) {
        try {
          await addMessage(assistantResponse);
        } catch (error) {
          console.error('Error saving assistant message:', error);
        }
      }

    } catch (e: any) {
       console.error('AI Error:', e);
       const errorText = e.message || "Sorry, I encountered an error.";
       
       // Check if error has rate limit info (from multi-provider)
       const rateLimitInfo = e?.rateLimitInfo || null;
       
       // Provide more helpful error messages
       let helpfulMessage = errorText;
       if (rateLimitInfo && rateLimitInfo.retryAfterMessage) {
         helpfulMessage = `⏱️ Rate Limit Reached\n\n${rateLimitInfo.retryAfterMessage}\n\nYour request has been queued and will be processed automatically when the rate limit resets.`;
       } else if (errorText.includes('rate limit') || errorText.includes('Rate limit')) {
         // Try to extract retry time from error message
         const retryMatch = errorText.match(/(?:in|after|retry after)\s+(\d+\.?\d*)\s+second/i);
         if (retryMatch) {
           const retrySeconds = parseFloat(retryMatch[1]);
           helpfulMessage = `⏱️ Rate Limit Reached\n\nYou can retry in ${retrySeconds.toFixed(1)} seconds.\n\nYour request has been queued and will be processed automatically when the rate limit resets.`;
         } else {
           helpfulMessage = "⏱️ Rate Limit Reached\n\nToo many requests. Please wait a moment and try again.\n\nYour request has been queued and will be processed automatically.";
         }
       } else if (errorText.includes('All AI providers failed') || errorText.includes('unavailable')) {
         helpfulMessage = "🚨 AI services are temporarily unavailable.\n\n" +
                         "This usually means:\n" +
                         "• API rate limits have been reached\n" +
                         "• API keys need to be refreshed\n\n" +
                         "💡 Solutions:\n" +
                         "1. Wait a few minutes and try again\n" +
                         "2. Ask the developer to add fresh API keys\n" +
                         "3. Get your own free Groq API key at: https://console.groq.com/";
       }
       
       const errorMessage: Message & {id: string, isError: boolean} = {
            id: thinkingMessage.id,
            role: 'assistant',
            content: [{text: helpfulMessage}],
            isError: true,
        };
        setMessages(prev => prev.map(msg => (msg as any).id === thinkingMessage.id ? errorMessage as any : msg));
        
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
    }
  }

  const getContentText = (content: Message['content']) => {
    if (!content) return '';
    if (typeof content === 'string') {
      return content;
    }
    if (Array.isArray(content)) {
      return content.map(part => part.text || '').join('');
    }
    if (typeof content === 'object' && 'text' in content) {
      return (content as any).text;
    }
    return '';
  };

  // Simple markdown-like formatting
  const formatMessage = (content: string) => {
    if (!content) return <div></div>;
    // Convert markdown-style formatting to HTML
    let formatted = content
      // Bold (double asterisks)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      // Italic (triple asterisks)
      .replace(/\*\*\*([^*]+)\*\*\*/g, '<em>$1</em>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code class="bg-gray-800/50 px-1 rounded text-sm">$1</code>')
      // Line breaks
      .replace(/\n/g, '<br />');
    
    return <div dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed right-0 top-0 h-full w-full sm:w-96 bg-gray-900/95 backdrop-blur-xl border-l border-gray-700/50 shadow-2xl z-50 flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-900/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <h2 className="text-lg font-semibold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    AI Assistant
                  </h2>
                </div>
                {user && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowChats(!showChats)}
                    className={`h-8 w-8 p-0 transition-all ${showChats ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-gray-800 text-gray-400 hover:text-white'}`}
                    title="Saved Chats"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {messages.length > 0 && (
                  <>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={scrollToTop}
                      className="h-8 w-8 p-0 hover:bg-gray-800 text-gray-400 hover:text-white"
                      title="Scroll to top"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={scrollToBottom}
                      className="h-8 w-8 p-0 hover:bg-gray-800 text-gray-400 hover:text-white"
                      title="Scroll to bottom"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </>
                )}
                {messages.length > 0 && user && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-800 text-gray-400 hover:text-white">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                      <DropdownMenuItem onClick={handleSaveChat} disabled={isSaving} className="hover:bg-gray-700 text-gray-200">
                        <Save className="mr-2 h-4 w-4" />
                        {isSaving ? 'Saving...' : 'Save Chat'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleExportChat} className="hover:bg-gray-700 text-gray-200">
                        <Download className="mr-2 h-4 w-4" />
                        Export Chat
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-gray-700" />
                      <DropdownMenuItem onClick={handleClearChat} className="text-red-400 hover:bg-red-500/10 hover:text-red-300">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Clear Chat
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={onClose} 
                  className="h-8 w-8 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
                  title="Close"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Saved Chats Panel */}
          {showChats && user && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b border-gray-700/50 bg-gray-800/30"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white">Saved Chats</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowChats(false)}
                    className="h-6 w-6 p-0 hover:bg-gray-700 text-gray-400 hover:text-white"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <div className="max-h-40 overflow-y-auto">
                  {savedChats.length === 0 ? (
                    <div className="text-center py-6">
                      <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                        <MessageSquare className="h-5 w-5 text-gray-500" />
                      </div>
                      <p className="text-sm text-gray-400 mb-1">No saved chats yet</p>
                      <p className="text-xs text-gray-500">Start a conversation and save it!</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {savedChats.map((chat: any) => (
                        <div
                          key={chat.id}
                          className="p-3 rounded-lg bg-gray-800/50 border border-gray-700/50 hover:bg-gray-700/50 hover:border-gray-600/50 transition-all cursor-pointer group"
                          onClick={() => handleLoadChat(chat.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-white truncate">{chat.title}</h4>
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(chat.updatedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteChat(chat.id, chat.title);
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-all duration-200 text-red-400 hover:bg-red-500/10 hover:text-red-300 h-6 w-6 p-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto" ref={scrollAreaRef}>
            <div className="space-y-4 p-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mb-4">
                    <Bot className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">AI Assistant Ready</h3>
                  <p className="text-sm text-gray-400 mb-4 max-w-xs">
                    I can help you create tasks, organize your workflow, or answer any questions you have!
                  </p>
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <div className="bg-gray-800/50 rounded-lg p-2 border border-gray-700/50">
                      <span className="text-blue-400">💡</span> "Create a task to review project proposal"
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-2 border border-gray-700/50">
                      <span className="text-green-400">✅</span> "Mark my meeting task as complete"
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-2 border border-gray-700/50">
                      <span className="text-purple-400">🤖</span> "Help me organize my tasks better"
                    </div>
                  </div>
                </div>
              ) : (
                messages.map((message, index) => {
                  const isThinking = (message as any).isThinking;
                  const isError = (message as any).isError;
                  const taskData = (message as any).taskData; // Task creation info
                  const tokenUsage = (message as any).tokenUsage; // Token usage info
                  
                  console.log('Rendering message:', index, 'has taskData:', !!taskData, taskData);
                  
                  return (
                    <div key={index} className={cn("flex items-start gap-3", message.role === 'user' && 'justify-end')}>
                      {message.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                          <Bot className="h-4 w-4 text-white" />
                        </div>
                      )}
                      <div className={cn(
                        "max-w-[280px] text-sm leading-relaxed border rounded-lg",
                        message.role === 'user' 
                          ? 'text-gray-200 p-3 border-gray-700/50' 
                          : isError 
                          ? 'text-red-200 p-3 border-red-500/30' 
                          : 'text-gray-100 p-3 border-gray-700/50 overflow-hidden'
                      )}>
                        {isThinking ? (
                          <div className="flex items-center gap-2 p-3">
                            <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                            <span className="text-gray-300">Thinking...</span>
                          </div>
                        ) : taskData ? (
                          // Beautiful task creation display
                          <div className="space-y-0">
                            <div className="p-3 pb-2">
                              <p className="text-gray-100 font-medium mb-1">✨ Task Created!</p>
                              <p className="text-gray-300 text-xs">{getContentText(message.content)}</p>
                            </div>
                            
                            {/* Task Details Card */}
                            <div className="bg-gray-900/50 p-3 space-y-2">
                              <div className="flex items-start gap-2">
                                <CheckSquare className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-white font-medium text-sm">{taskData.text}</p>
                                  {taskData.description && (
                                    <p className="text-gray-400 text-xs mt-1">{taskData.description}</p>
                                  )}
                                </div>
                              </div>
                              
                              {/* Tags */}
                              {taskData.tags && taskData.tags.length > 0 && (
                                <div className="flex items-center gap-1 flex-wrap">
                                  {taskData.tags.map((tag: string, idx: number) => (
                                    <span key={idx} className="text-[10px] px-1.5 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                              
                              {/* Due Date */}
                              {taskData.dueDate && (
                                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                  <Clock className="h-3 w-3" />
                                  <span>{new Date(taskData.dueDate).toLocaleString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric', 
                                    hour: 'numeric', 
                                    minute: '2-digit' 
                                  })}</span>
                                </div>
                              )}
                              
                              {/* Star indicator */}
                              {taskData.starred && (
                                <div className="flex items-center gap-1.5 text-xs text-yellow-400">
                                  <Star className="h-3 w-3 fill-yellow-400" />
                                  <span>High Priority</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 space-y-2">
                            {/* Display image if present */}
                            {Array.isArray(message.content) && message.content.some((part: any) => part.image) && (
                              <div className="mb-2">
                                {message.content.map((part: any, idx: number) => 
                                  part.image ? (
                                    <div key={idx} className="relative group">
                                      <img 
                                        src={part.image} 
                                        alt={part.fileName || 'Attached image'} 
                                        className="max-w-full rounded-lg border border-gray-700"
                                      />
                                      {part.fileName && (
                                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                          <ImageIcon className="h-3 w-3" />
                                          {part.fileName}
                                        </p>
                                      )}
                                    </div>
                                  ) : null
                                )}
                              </div>
                            )}
                            <div className="whitespace-pre-wrap">
                              {formatMessage(getContentText(message.content))}
                            </div>
                          </div>
                        )}
                      </div>
                      {message.role === 'user' && (
                        <Avatar className="w-8 h-8 shrink-0">
                          {user?.photoURL && (
                            <AvatarImage src={user.photoURL} alt={user.displayName || user.email || 'User'} />
                          )}
                          <AvatarFallback className="bg-gradient-to-r from-green-500 to-teal-600 text-white text-xs font-semibold">
                            {user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-700/50 bg-gray-800/30">
            {/* Show selected image preview */}
            {selectedImage && (
              <div className="mb-3 relative inline-block">
                <div className="relative group">
                  <img 
                    src={selectedImage} 
                    alt="Selected" 
                    className="max-w-[200px] max-h-[200px] rounded-lg border border-gray-700 object-cover"
                  />
                  <button
                    onClick={() => {
                      setSelectedImage(null);
                      setSelectedImageName('');
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">{selectedImageName}</p>
              </div>
            )}
            <PromptForm 
              onSubmit={handlePromptSubmit} 
              isLoading={isLoading} 
              showExamples={false}
              onImageSelect={handleImageSelect}
              lastTokenUsage={messages.filter(m => m.role === 'assistant').slice(-1)[0] ? (messages.filter(m => m.role === 'assistant').slice(-1)[0] as any).tokenUsage : undefined}
              selectedModel={selectedModel}
              onModelChange={onModelChange}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
