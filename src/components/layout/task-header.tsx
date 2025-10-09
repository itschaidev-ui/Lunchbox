
'use client';

import { Button } from '@/components/ui/button';
import { PlusCircle, CheckCircle, AlertCircle, List, PanelRight } from 'lucide-react';

interface TaskHeaderProps {
  stats: {
    total: number;
    done: number;
    overdue: number;
  };
  onNewTask: () => void;
  onToggleAssistant: () => void;
}

export function TaskHeader({ stats, onNewTask, onToggleAssistant }: TaskHeaderProps) {
  return (
    <header className="h-20 border-b border-border flex items-center px-4 md:px-8 flex-shrink-0 justify-between">
      <div className="flex items-center gap-6">
        <div>
            <h1 className="text-2xl font-headline">
              <span
                style={{
                  background: 'linear-gradient(to right, #8A2BE2, #FF69B4)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
              Tasks
              </span>
            </h1>
            <p className="text-sm text-muted-foreground">Task Management</p>
        </div>
        <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-2"><List className="h-4 w-4 text-primary" /> {stats.total} tasks</span>
            <span className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> {stats.done} done</span>
            <span className="flex items-center gap-2"><AlertCircle className="h-4 w-4 text-red-500" /> {stats.overdue} overdue</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={onNewTask}>
          <PlusCircle className="mr-2 h-5 w-5" />
          New Task
        </Button>
        <Button variant="outline" size="icon" onClick={onToggleAssistant} className="hidden md:flex">
            <PanelRight className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
