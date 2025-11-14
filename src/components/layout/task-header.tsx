
'use client';

import { Button } from '@/components/ui/button';
import { Plus, CheckCircle, AlertCircle, List, MessageCircle, Bot, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

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
    <>
      {/* Mobile Header - Compact and organized */}
      <header className="md:hidden border-b border-border/50 flex flex-col flex-shrink-0">
        {/* Top Row: Title, Stats, Actions */}
        <div className="h-14 flex items-center justify-between px-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <h1 className="text-lg font-bold font-headline">
              <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
                Tasks
              </span>
            </h1>
            
            {/* Mobile Stats - Compact badges */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20">
                <List className="h-3 w-3 text-blue-400" />
                <span className="text-xs font-medium text-blue-300">{stats.total}</span>
              </div>
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-green-500/10 border border-green-500/20">
                <CheckCircle className="h-3 w-3 text-green-400" />
                <span className="text-xs font-medium text-green-300">{stats.done}</span>
              </div>
              {stats.overdue > 0 && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-red-500/10 border border-red-500/20">
                  <AlertCircle className="h-3 w-3 text-red-400" />
                  <span className="text-xs font-medium text-red-300">{stats.overdue}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-2">
            <Button 
              onClick={onNewTask} 
              size="default" 
              className="h-9 px-4 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-md font-medium"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              New
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-gray-900 border-gray-700">
                <DropdownMenuItem 
                  onClick={onToggleAssistant}
                  className="text-gray-300 hover:text-white hover:bg-gray-800 cursor-pointer"
                >
                  <Bot className="h-4 w-4 mr-2" />
                  AI Assistant
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={onToggleFeedback}
                  className="text-gray-300 hover:text-white hover:bg-gray-800 cursor-pointer"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Send Feedback
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Desktop Header - Original layout */}
      <header className="hidden md:flex h-16 border-b border-border/50 items-center px-6 flex-shrink-0 justify-between">
        <div className="flex items-center gap-6 flex-1 min-w-0">
          <div className="min-w-0">
              <h1 className="text-2xl font-bold font-headline">
                <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
                  Tasks
                </span>
              </h1>
              <p className="text-xs text-muted-foreground">Task Management</p>
          </div>
          
          {/* Desktop stats */}
          <div className="flex items-center gap-3 text-xs">
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
        </div>
        
        <div className="flex items-center gap-2 ml-2">
          <Button 
            onClick={onNewTask} 
            size="sm" 
            className="h-9 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-sm"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            New Task
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
    </>
  );
}
