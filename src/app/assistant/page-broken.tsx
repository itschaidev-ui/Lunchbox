'use client';

import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Bot, User, Sparkles, Trash2, Download, Save, RotateCcw, MoreVertical, Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react';
import { PromptForm } from '@/components/assistant/prompt-form';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { continueConversation } from '@/ai/flows/chat';
import type { Message } from '@/ai/flows/chat';
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

  useEffect(() => {
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

  const handlePromptSubmit = async (prompt: string) => {
    if (!prompt.trim()) return;

    // Create a new chat if we don't have one
    if (!currentChat) {
      try {
        const chatTitle = prompt.length > 50 ? prompt.substring(0, 50) + '...' : prompt;
        const chatId = await createNewChat(chatTitle);
        console.log('Created new chat:', chatId);
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

    const userMessage: Message = {
      role: 'user',
      content: [{ text: prompt }]
    };

    const updatedMessages = await addMessage(userMessage);
    setIsLoading(true);

    try {
      const response = await continueConversation(updatedMessages);
      
      // Handle task actions
      if (response[0]?.action) {
        console.log('Task action detected:', response[0].action);
        
        if (response[0].action === 'create' && response[0].tasks) {
          console.log('Creating tasks:', response[0].tasks);
          
          if (user) {
            // Create actual tasks for authenticated users
            try {
              const createdTasks = [];
              for (const task of response[0].tasks) {
                await addTask({
                  text: task.text,
                  dueDate: task.dueDate || undefined
                });
                createdTasks.push({ text: task.text });
              }
              
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
              const errorMessage: Message = {
                role: 'assistant',
                content: [{
                  text: 'Sorry, I encountered an error while creating your tasks. Please try again.'
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

      // Add the assistant's response
      const assistantMessage: Message = {
        role: 'assistant',
        content: [{ text: response[0].text || 'I understand.' }]
      };
      await addMessage(assistantMessage);
    } catch (error) {
      console.error('Error in chat:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: [{
          text: 'Sorry, I encountered an error. Please try again.'
        }]
      };
      await addMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const chatContent = (
    <div className="flex-1 flex flex-col min-h-0">
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 md:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
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
                "max-w-[85%] md:max-w-[70%] rounded-xl px-4 py-3 shadow-sm",
                message.role === 'user' 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted border"
              )}>
                <div className="whitespace-pre-wrap text-sm md:text-base leading-relaxed">
                  {Array.isArray(message.content) 
                    ? message.content.map((content: any, contentIndex: number) => (
                        <div key={contentIndex}>
                          {content.text}
                        </div>
                      ))
                    : message.content
                  }
                </div>
              </div>

              {message.role === 'user' && (
                <Avatar className="h-8 w-8 md:h-10 md:w-10 shrink-0">
                  <AvatarFallback className="bg-secondary text-secondary-foreground">
                    <User className="h-4 w-4 md:h-5 md:w-5" />
                  </AvatarFallback>
                </Avatar>
              )}
            </motion.div>
          ))}
          
          {isLoading && (
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
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>
      
      <div className="p-4 md:p-6 border-t bg-background/95 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          <PromptForm onSubmit={handlePromptSubmit} isLoading={isLoading} />
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
            <PromptForm onSubmit={handlePromptSubmit} isLoading={isLoading} />
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
    <div className="flex h-screen bg-background">
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
            onClick={() => {
              // Start new chat logic here
            }}
            className="w-full"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            New Chat
          </Button>
        </div>
        
        <ScrollArea className="flex-1 p-4">
          {savedChats.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                <Save className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                No saved chats yet
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {savedChats.map((chat: any) => (
                <div
                  key={chat.id}
                  className="p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer group"
                  onClick={async () => {
                    // Check if current chat has unsaved messages
                    if (currentChat && currentChat.id !== chat.id && messages.length > 0) {
                      const hasUnsavedMessages = messages.some(msg => 
                        msg.role === 'user' && 
                        !savedChats.find(savedChat => 
                          savedChat.id === currentChat.id && 
                          savedChat.messages.some(savedMsg => 
                            savedMsg.role === 'user' && 
                            JSON.stringify(savedMsg.content) === JSON.stringify(msg.content)
                          )
                        )
                      );
                      
                      if (hasUnsavedMessages) {
                        const confirmSwitch = window.confirm(
                          'You have unsaved messages in your current chat. Do you want to save them before switching?'
                        );
                        if (confirmSwitch) {
                          await saveCurrentChat();
                        }
                      }
                    }
                    
                    await loadChat(chat.id);
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{chat.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(chat.updatedAt).toLocaleDateString()}
                      </p>
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
                      className="opacity-0 group-hover:opacity-100 transition-all duration-200 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </aside>

      {/* Mobile Sidebar - Enhanced with better animations */}
      <AnimatePresence>
        {sidebarOpen && isMobile && (
          <motion.aside
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ 
              duration: 0.3, 
              ease: [0.4, 0.0, 0.2, 1],
              opacity: { duration: 0.2 }
            }}
            className="fixed lg:hidden z-50 w-80 h-full bg-background border-r flex flex-col shadow-2xl backdrop-blur-sm"
          >
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Saved Chats</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(false)}
                  className="hover:bg-muted/50 transition-all duration-200"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSidebarOpen(false);
                  // Start new chat logic here
                }}
                className="w-full"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                New Chat
              </Button>
            </div>
            
            <ScrollArea className="flex-1 p-4">
              {savedChats.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                    <Save className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    No saved chats yet
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {savedChats.map((chat: any) => (
                    <div
                      key={chat.id}
                      className="p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer group"
                      onClick={async () => {
                        // Check if current chat has unsaved messages
                        if (currentChat && currentChat.id !== chat.id && messages.length > 0) {
                          const hasUnsavedMessages = messages.some(msg => 
                            msg.role === 'user' && 
                            !savedChats.find(savedChat => 
                              savedChat.id === currentChat.id && 
                              savedChat.messages.some(savedMsg => 
                                savedMsg.role === 'user' && 
                                JSON.stringify(savedMsg.content) === JSON.stringify(msg.content)
                              )
                            )
                          );
                          
                          if (hasUnsavedMessages) {
                            const confirmSwitch = window.confirm(
                              'You have unsaved messages in your current chat. Do you want to save them before switching?'
                            );
                            if (confirmSwitch) {
                              await saveCurrentChat();
                            }
                          }
                        }
                        
                        await loadChat(chat.id);
                        setSidebarOpen(false);
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm truncate">{chat.title}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(chat.updatedAt).toLocaleDateString()}
                          </p>
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
                          className="opacity-0 group-hover:opacity-100 transition-all duration-200 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
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
                variant="outline"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hover:bg-muted/50 transition-all duration-200"
              >
                <motion.div
                  animate={{ rotate: sidebarOpen ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu className="h-4 w-4" />
                </motion.div>
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
              {messages.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={saveChat} disabled={isSaving}>
                      <Save className="mr-2 h-4 w-4" />
                      {isSaving ? 'Saving...' : 'Save Chat'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportChat}>
                      <Download className="mr-2 h-4 w-4" />
                      Export Chat
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleClearChat} className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Clear Chat
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              
              <Button asChild variant="outline" size="sm">
                <Link href="/home">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Back to Home</span>
                  <span className="sm:hidden">Back</span>
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