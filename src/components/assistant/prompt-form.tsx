
'use client';

import { Loader2, ArrowUp, User, Mail, MessageSquare, Code } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { useState } from 'react';

const examplePrompts = [
    {
      text: "Write a to-do list for a personal project",
      icon: <User className="h-5 w-5" />,
    },
    {
      text: "Generate an email to reply to a job offer",
      icon: <Mail className="h-5 w-5" />,
    },
    {
      text: "Summarize this article in one paragraph",
      icon: <MessageSquare className="h-5 w-5" />,
    },
    {
      text: "How does AI work in a technical capacity",
      icon: <Code className="h-5 w-5" />,
    },
];


export function PromptForm({ onSubmit, isLoading }: { onSubmit: (prompt: string) => void, isLoading: boolean }) {
  const [prompt, setPrompt] = useState('');

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };

  const handleExampleClick = (text: string) => {
    setPrompt(text);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    
    onSubmit(prompt);
    setPrompt('');
  };

  return (
    <div className="w-full">
        <form onSubmit={handleSubmit}>
            <div className="bg-card border rounded-lg p-3 relative">
                <Textarea
                    placeholder="Ask AI a question or make a request..."
                    className="pr-12 py-4 text-base border-none focus-visible:ring-0 shadow-none resize-none min-h-[60px]"
                    value={prompt}
                    onChange={handlePromptChange}
                    disabled={isLoading}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            // This will trigger the form's onSubmit
                            (e.target as HTMLTextAreaElement).form?.requestSubmit();
                        }
                    }}
                />
                <Button
                    type="submit"
                    size="icon"
                    className="absolute right-4 bottom-4 rounded-full"
                    disabled={isLoading || !prompt.trim()}
                >
                    {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                    <ArrowUp className="h-5 w-5" />
                    )}
                </Button>
            </div>
        </form>

        <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground mb-4 font-medium tracking-wide">GET STARTED WITH AN EXAMPLE BELOW</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {examplePrompts.map((example) => (
                    <button
                        key={example.text}
                        disabled={isLoading}
                        onClick={() => handleExampleClick(example.text)}
                        className="bg-card border rounded-lg p-4 text-left hover:bg-secondary transition-colors disabled:opacity-50"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium">{example.text}</p>
                            {example.icon}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    </div>
  );
}
