
'use client';

import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Bot, User } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react';
import { PromptForm } from '@/components/assistant/prompt-form';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { continueConversation } from '@/ai/flows/chat';
import type { Message } from '@/ai/flows/chat';

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({
            top: scrollAreaRef.current.scrollHeight,
            behavior: 'smooth',
        });
    }
  }, [messages]);
  
  const handlePromptSubmit = async (prompt: string) => {
    setIsLoading(true);
    const userMessage: Message = {
      role: 'user',
      content: [{ text: prompt }],
    };
    
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);

    const thinkingMessage: Message & { id: string, isThinking: boolean } = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: [],
      isThinking: true
    };
    setMessages(prev => [...prev, thinkingMessage as any]);

    try {
      const response = await continueConversation(currentMessages);
      
      const assistantResponse: Message = {
        role: 'assistant',
        content: response,
      };

      setMessages(prev => {
        const newMessages = [...prev];
        const thinkingIndex = newMessages.findIndex(m => (m as any).isThinking);
        if (thinkingIndex !== -1) {
          newMessages[thinkingIndex] = assistantResponse;
        } else {
          newMessages.push(assistantResponse);
        }
        return newMessages;
      });

    } catch (e: any) {
       const errorMessage: Message & {id: string, isError: boolean} = {
            id: thinkingMessage.id, // Use the same ID to replace the thinking message
            role: 'assistant',
            content: [{text: e.message || "Sorry, I encountered an error."}],
            isError: true,
        };
        setMessages(prev => prev.map(msg => (msg as any).id === thinkingMessage.id ? errorMessage as any : msg));
    } finally {
        setIsLoading(false);
    }
  }

  const getContentText = (content: Message['content']) => {
    if (!content) return '';
    if (Array.isArray(content)) {
      return content.map(part => part.text || '').join('');
    }
    // Handle cases where content might be a single part object, not in an array
    if (typeof content === 'object' && 'text' in content) {
      return (content as any).text;
    }
    return '';
  }
  
  const chatContent = (
      <div className="flex flex-col bg-background h-full w-full max-w-4xl mx-auto">
          <header className="p-4 md:p-6 border-b shrink-0 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-headline font-bold text-foreground">
                AI Assistant
              </h1>
            </div>
            <Button asChild variant="outline">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </header>
          
          <ScrollArea className="flex-1" viewportRef={scrollAreaRef}>
             <div className="space-y-6 p-4">
                {messages.map((message, index) => {
                    const isThinking = (message as any).isThinking;
                    const isError = (message as any).isError;
                    return (
                        <div key={index} className={cn("flex items-start gap-4", message.role === 'user' && 'justify-end')}>
                           {message.role === 'assistant' && (
                               <Avatar className="h-9 w-9 border">
                                   <AvatarFallback className={cn(isError && "bg-destructive text-destructive-foreground")}>
                                       <Bot className="h-5 w-5" />
                                   </AvatarFallback>
                               </Avatar>
                           )}
                           <div className={cn("max-w-md rounded-lg p-3", message.role === 'user' ? 'bg-primary text-primary-foreground' : (isError ? 'bg-destructive/20 text-destructive-foreground' : 'bg-muted'))}>
                                {isThinking ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Thinking...</span>
                                    </div>
                                ) : (
                                   <p className="text-sm">{getContentText(message.content)}</p>
                                )}
                           </div>
                           {message.role === 'user' && (
                               <Avatar className="h-9 w-9 border">
                                   <AvatarFallback>
                                       <User className="h-5 w-5" />
                                   </AvatarFallback>
                               </Avatar>
                           )}
                        </div>
                    )
                })}
            </div>
          </ScrollArea>
          
          <div className="p-4 border-t">
            <PromptForm onSubmit={handlePromptSubmit} isLoading={isLoading} />
          </div>
      </div>
  )

  const emptyStateContent = (
    <div className="flex flex-col bg-background h-full w-full max-w-4xl mx-auto">
      <header className="p-4 md:p-6 border-b shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-headline font-bold text-foreground">
            AI Assistant
          </h1>
        </div>
        <Button asChild variant="outline">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </header>
      
      <div className="flex-1 flex flex-col justify-center items-center p-4 min-h-0">
          <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="w-full"
              >
                <div className="text-center mb-8">
                  <h2 className="text-4xl md:text-5xl font-bold font-headline tracking-tight">
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
                   <p className="mt-4 text-lg text-muted-foreground">Ask me anything, or give me a task to do.</p>
                </div>
                <PromptForm onSubmit={handlePromptSubmit} isLoading={isLoading} />
              </motion.div>
          </AnimatePresence>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
      <main className="flex-1 flex flex-col overflow-hidden">
        {messages.length > 0 ? chatContent : emptyStateContent}
      </main>
    </div>
  );
}
