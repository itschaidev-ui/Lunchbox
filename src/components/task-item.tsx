
'use client';

import type { Task } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { MoreVertical, Flag, Trash2, ChevronDown, Timer, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isPast, parseISO } from 'date-fns';
import { Badge } from './ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useState } from 'react';
import { EditTaskDialog } from './edit-task-dialog';

// A simple markdown to HTML converter
const Markdown = ({ text }: { text: string }) => {
    const html = text
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\n\s*-\s/g, '</li><li>')
      .replace(/\n\d+\.\s/g, '</li><li>')
      .replace(/\n(?!<li|<\/ul>|<\/ol>|<h1>|<h2>|<h3>)/g, '<br/>');

    const listFixedHtml = html.replace(/<li>/g, (match, offset, fullString) => {
        const prevChar = fullString.charAt(offset - 1);
        if(fullString.slice(offset-4, offset) === '<ul>' || fullString.slice(offset-4, offset) === '<ol>') return '<li>';
        
        const isNumbered = /\d/.test(fullString.charAt(offset-2));
        return isNumbered ? '<ol><li>' : '<ul><li>';
    }).replace(/<\/li><li>/g, '</li><li>');

    return <div className="prose-sm prose-invert" dangerouslySetInnerHTML={{ __html: listFixedHtml }} />;
};


interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && !task.completed;
  
  const formattedDate = task.dueDate ? (() => {
    const date = parseISO(task.dueDate);
    // Check if the time is midnight, which suggests no time was set manually by the user in the form
    if (date.getHours() === 0 && date.getMinutes() === 0) {
        return format(date, 'MMM d, yyyy');
    }
    return format(date, 'MMM d, yyyy, p');
  })() : null;
  

  return (
    <>
    <Collapsible>
      <div
        className={cn(
          'flex items-start gap-4 p-3 rounded-lg border transition-colors',
          task.completed ? 'bg-card/50 border-border/50' : 'bg-card border-border hover:bg-muted/50'
        )}
      >
        <Checkbox
          id={`task-${task.id}`}
          checked={task.completed}
          onCheckedChange={() => onToggle(task.id)}
          className="h-5 w-5 mt-0.5"
        />
        <div className="flex-1">
          <label
            htmlFor={`task-${task.id}`}
            className={cn(
              'font-medium cursor-pointer transition-colors',
              task.completed ? 'text-muted-foreground line-through' : 'text-foreground'
            )}
          >
            {task.text}
          </label>
          {formattedDate && (
            <div className="flex items-center gap-2 mt-1">
              {isOverdue && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                      <Flag className="h-3 w-3"/> Overdue
                  </Badge>
              )}
               <p className={cn(
                  'text-xs',
                  isOverdue ? 'text-destructive' : 'text-muted-foreground'
              )}>
                {formattedDate}
              </p>
            </div>
          )}
        </div>

        {task.description && (
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="data-[state=open]:rotate-180 transition-transform">
              <ChevronDown className="h-4 w-4" />
            </Button>
          </CollapsibleTrigger>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
             <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Task
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(task.id)}
              className="text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

       {task.description && (
        <CollapsibleContent>
            <div className="prose prose-sm prose-invert max-w-none text-muted-foreground p-4 pl-12 border-t border-dashed">
                <style jsx global>{`
                    .prose h3 { color: white; margin-bottom: 0.5rem; margin-top: 1rem; font-size: 1rem; }
                    .prose ul, .prose ol { margin-left: 1rem; padding-left: 1rem; }
                    .prose li { margin-bottom: 0.25rem; }
                `}</style>
                <Markdown text={task.description} />
            </div>
        </CollapsibleContent>
       )}
    </Collapsible>
    <EditTaskDialog 
        isOpen={isEditDialogOpen} 
        onOpenChange={setIsEditDialogOpen} 
        task={task}
    />
    </>
  );
}
