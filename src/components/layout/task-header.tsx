
'use client';

import { Button } from '@/components/ui/button';
import { Plus, CheckCircle, AlertCircle, List, MessageCircle, Bot } from 'lucide-react';
import { CreditsDisplay } from '@/components/credits/credits-display';

interface TaskHeaderProps {
  stats: {
    total: number;
    done: number;
    overdue: number;
  };
  onNewTask: () => void;
  onToggleAssistant: () => void;
  onToggleFeedback: () => void;
  onCreateTestTask?: () => void;
  onFetchTasks?: () => void;
  onTestNotification?: () => void;
  onRescheduleNotifications?: () => void;
}

export function TaskHeader({ stats, onNewTask, onToggleAssistant, onToggleFeedback }: TaskHeaderProps) {
  return (
    <header className="h-14 md:h-16 border-b border-border/50 flex items-center px-4 md:px-6 flex-shrink-0 justify-between">
      <div className="flex items-center gap-4 md:gap-6 flex-1 min-w-0">
        <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-bold font-headline">
              <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
                Tasks
              </span>
            </h1>
            <p className="text-xs text-muted-foreground hidden sm:block">Task Management</p>
        </div>
        
        {/* Desktop stats */}
        <div className="hidden md:flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-800/50 border border-gray-700/50">
              <List className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-gray-300">{stats.total}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-800/50 border border-gray-700/50">
              <CheckCircle className="h-3.5 w-3.5 text-green-400" />
              <span className="text-gray-300">{stats.done}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-800/50 border border-gray-700/50">
              <AlertCircle className="h-3.5 w-3.5 text-red-400" />
              <span className="text-gray-300">{stats.overdue}</span>
            </div>
        </div>
        
        {/* Mobile stats */}
        <div className="flex md:hidden items-center gap-2 text-xs ml-auto">
            <div className="flex items-center gap-1 text-blue-400">
              <List className="h-3 w-3" />
              <span>{stats.total}</span>
            </div>
            <div className="flex items-center gap-1 text-green-400">
              <CheckCircle className="h-3 w-3" />
              <span>{stats.done}</span>
            </div>
            <div className="flex items-center gap-1 text-red-400">
              <AlertCircle className="h-3 w-3" />
              <span>{stats.overdue}</span>
            </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2 ml-2">
        <CreditsDisplay />
        
        <Button 
          onClick={onNewTask} 
          size="sm" 
          className="h-9 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-sm"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          <span className="hidden sm:inline">New Task</span>
          <span className="sm:hidden">New</span>
        </Button>
        
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onToggleAssistant} 
          className="h-9 w-9 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          title="Toggle AI Assistant"
        >
            <Bot className="h-4 w-4" />
        </Button>
        
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onToggleFeedback} 
          className="h-9 w-9 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          title="Send Feedback"
        >
            <MessageCircle className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
