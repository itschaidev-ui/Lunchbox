
'use client';

import type { Task, KanbanColumn } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import * as Icons from 'lucide-react';
import { MoreVertical, Flag, Trash2, ChevronDown, Timer, Edit, Clock, PlayCircle, CheckSquare, Star, Tag as TagIcon, Paperclip, File, Image as ImageIcon, Download, ExternalLink } from 'lucide-react';
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
import { useState, useEffect, useRef } from 'react';
import { EditTaskDialog } from './edit-task-dialog';
import { TaskTimer } from './task-timer';
import { useAuth } from '@/context/auth-context';
import { DEFAULT_COLUMNS } from './kanban/column-manager';
import { getTagStyles } from '@/lib/tag-colors';

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
  bulkSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

export function TaskItem({ task, onToggle, onDelete, bulkSelectMode = false, isSelected = false, onToggleSelect }: TaskItemProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const { user } = useAuth();
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && !task.completed;
  
  // Debug: Log task data to see if tags are present
  console.log('Task data:', task.id, task.text, 'tags:', task.tags, 'starred:', task.starred);
  
  // Load columns from localStorage
  const [columns, setColumns] = useState<KanbanColumn[]>(() => {
    const saved = localStorage.getItem('kanban-columns');
    const loadedColumns = saved ? JSON.parse(saved) : DEFAULT_COLUMNS;
    console.log('📋 Loaded columns:', loadedColumns.map((c: KanbanColumn) => `${c.id} (${c.title})`));
    return loadedColumns;
  });
  
  // Listen for column changes from localStorage
  useEffect(() => {
    const handleColumnsChange = () => {
      const saved = localStorage.getItem('kanban-columns');
      if (saved) {
        const newColumns = JSON.parse(saved);
        console.log('📋 Columns updated:', newColumns.map((c: KanbanColumn) => `${c.id} (${c.title})`));
        setColumns(newColumns);
      }
    };
    
    window.addEventListener('storage', handleColumnsChange);
    // Also listen for custom event
    window.addEventListener('kanban-columns-changed', handleColumnsChange);
    
    return () => {
      window.removeEventListener('storage', handleColumnsChange);
      window.removeEventListener('kanban-columns-changed', handleColumnsChange);
    };
  }, []);

  // Get current task column
  const [taskColumnId, setTaskColumnId] = useState<string>(() => {
    const saved = localStorage.getItem('kanban-task-statuses');
    const statuses = saved ? JSON.parse(saved) : {};
    return statuses[task.id] || task.columnId || 'todo';
  });
  
  // Track if we're currently cycling to prevent useEffect from interfering
  const isCyclingRef = useRef(false);

  // Sync column with actual task.completed state (only when task.completed changes externally)
  // Don't force sync if we're cycling through columns - let the cycling logic handle it
  useEffect(() => {
    // Skip sync if we're currently cycling
    if (isCyclingRef.current) {
      console.log('⏭️ Skipping sync - currently cycling');
      return;
    }
    
    const saved = localStorage.getItem('kanban-task-statuses');
    const statuses = saved ? JSON.parse(saved) : {};
    const savedColumnId = statuses[task.id] || taskColumnId || 'todo';
    
    // Always sync column to match task.completed state
    // If task is completed, column should be 'completed'
    // If task is not completed, column should not be 'completed'
    if (task.completed && savedColumnId !== 'completed') {
      console.log('🔄 Task completed, syncing to completed column');
      statuses[task.id] = 'completed';
      setTaskColumnId('completed');
      localStorage.setItem('kanban-task-statuses', JSON.stringify(statuses));
    } else if (!task.completed && savedColumnId === 'completed') {
      // Task was uncompleted, move it back to the first non-completed column
      const firstNonCompletedColumn = columns.find(col => col.id !== 'completed') || columns[0];
      if (firstNonCompletedColumn) {
        console.log('🔄 Task uncompleted, syncing to', firstNonCompletedColumn.id);
        statuses[task.id] = firstNonCompletedColumn.id;
        setTaskColumnId(firstNonCompletedColumn.id);
        localStorage.setItem('kanban-task-statuses', JSON.stringify(statuses));
      }
    }
  }, [task.completed, task.id, columns]);

  // Listen for column updates
  useEffect(() => {
    const handleStatusChange = () => {
      // Skip if we're cycling - don't override our cycling logic
      if (isCyclingRef.current) {
        return;
      }
      
      const saved = localStorage.getItem('kanban-task-statuses');
      const statuses = saved ? JSON.parse(saved) : {};
      // Only update if the status in localStorage is different from current state
      const savedColumnId = statuses[task.id];
      if (savedColumnId && savedColumnId !== taskColumnId) {
        setTaskColumnId(savedColumnId);
      }
    };

    const handleColumnsChange = () => {
      const saved = localStorage.getItem('kanban-columns');
      if (saved) {
        setColumns(JSON.parse(saved));
      }
    };

    window.addEventListener('task-status-change', handleStatusChange);
    window.addEventListener('storage', handleColumnsChange);
    
    return () => {
      window.removeEventListener('task-status-change', handleStatusChange);
      window.removeEventListener('storage', handleColumnsChange);
    };
  }, [task.id, taskColumnId]);

  // Get the current column
  const currentColumn = columns.find(col => col.id === taskColumnId) || columns[0];
  
  // Get icon component
  const getIconComponent = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName];
    return IconComponent || Clock;
  };
  
  const ColumnIcon = getIconComponent(currentColumn.icon);

  // Get RGB values for inline styles
  const getColorStyles = (color: string) => {
    const colorMap: Record<string, { bg: string; border: string }> = {
      'text-blue-500': { bg: 'rgba(59, 130, 246, 0.1)', border: 'rgb(59, 130, 246)' },
      'text-orange-500': { bg: 'rgba(249, 115, 22, 0.1)', border: 'rgb(249, 115, 22)' },
      'text-green-500': { bg: 'rgba(34, 197, 94, 0.1)', border: 'rgb(34, 197, 94)' },
      'text-purple-500': { bg: 'rgba(168, 85, 247, 0.1)', border: 'rgb(168, 85, 247)' },
      'text-red-500': { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgb(239, 68, 68)' },
      'text-yellow-500': { bg: 'rgba(234, 179, 8, 0.1)', border: 'rgb(234, 179, 8)' },
      'text-amber-500': { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgb(245, 158, 11)' },
      'text-indigo-500': { bg: 'rgba(99, 102, 241, 0.1)', border: 'rgb(99, 102, 241)' },
      'text-emerald-500': { bg: 'rgba(16, 185, 129, 0.1)', border: 'rgb(16, 185, 129)' },
      'text-pink-500': { bg: 'rgba(236, 72, 153, 0.1)', border: 'rgb(236, 72, 153)' },
      'text-cyan-500': { bg: 'rgba(6, 182, 212, 0.1)', border: 'rgb(6, 182, 212)' },
      'text-amber-600': { bg: 'rgba(217, 119, 6, 0.1)', border: 'rgb(217, 119, 6)' },
      'text-rose-500': { bg: 'rgba(244, 63, 94, 0.1)', border: 'rgb(244, 63, 94)' },
      'text-blue-600': { bg: 'rgba(37, 99, 235, 0.1)', border: 'rgb(37, 99, 235)' },
      'text-violet-500': { bg: 'rgba(139, 92, 246, 0.1)', border: 'rgb(139, 92, 246)' },
      'text-teal-500': { bg: 'rgba(20, 184, 166, 0.1)', border: 'rgb(20, 184, 166)' },
      'text-lime-500': { bg: 'rgba(132, 204, 22, 0.1)', border: 'rgb(132, 204, 22)' },
      'text-slate-500': { bg: 'rgba(100, 116, 139, 0.1)', border: 'rgb(100, 116, 139)' },
      'text-gray-500': { bg: 'rgba(107, 114, 128, 0.1)', border: 'rgb(107, 114, 128)' },
    };
    return colorMap[color] || { bg: 'rgba(107, 114, 128, 0.1)', border: 'rgb(107, 114, 128)' };
  };
  
  const handleToggleProgress = () => {
    // Mark that we're cycling to prevent useEffect from interfering
    isCyclingRef.current = true;
    
    // Get current statuses from localStorage
    const saved = localStorage.getItem('kanban-task-statuses');
    const statuses = saved ? JSON.parse(saved) : {};
    
    // Find current column index - use the actual current column from localStorage or state
    const currentColumnId = statuses[task.id] || taskColumnId || 'todo';
    console.log('🔄 Cycling task:', task.id, 'Current column:', currentColumnId, 'Available columns:', columns.map(c => c.id));
    
    const currentIndex = columns.findIndex(c => c.id === currentColumnId);
    
    // If current column not found, default to first column
    const safeIndex = currentIndex >= 0 ? currentIndex : 0;
    const nextIndex = (safeIndex + 1) % columns.length;
    const nextColumn = columns[nextIndex];
    const targetColumnId = nextColumn.id;
    
    console.log('🔄 Moving to next column:', targetColumnId, 'from', currentColumnId);

    // Update the column status (cycle through all columns)
    statuses[task.id] = targetColumnId;
    setTaskColumnId(targetColumnId);
    localStorage.setItem('kanban-task-statuses', JSON.stringify(statuses));

    // If moving to 'completed' column and task is not completed, toggle it
    // If moving away from 'completed' column and task is completed, toggle it
    const willBeCompleted = targetColumnId === 'completed';
    if (task.completed !== willBeCompleted) {
      // Add a small delay before toggling to allow UI to update first
      setTimeout(() => {
        onToggle(task.id);
        // Clear cycling flag after toggle completes
        setTimeout(() => {
          isCyclingRef.current = false;
        }, 1000);
      }, 100);
    } else {
      // Clear cycling flag immediately if no toggle needed
      setTimeout(() => {
        isCyclingRef.current = false;
      }, 500);
    }

    // Dispatch event to update Kanban board if it's open (but listeners will skip if cycling)
    window.dispatchEvent(new Event('task-status-change'));
  };
  
  const formattedDate = task.dueDate ? (() => {
    const date = parseISO(task.dueDate);
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
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
          'mobile-list-item flex items-start gap-3 p-4 rounded-lg border transition-colors',
          task.completed ? 'bg-gray-800/30 border-gray-700/50' : 'bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 hover:border-gray-600',
          isSelected && 'ring-2 ring-blue-500 bg-blue-500/10'
        )}
      >
        {bulkSelectMode ? (
          <div 
            className="h-5 w-5 flex items-center justify-center cursor-pointer"
            onClick={onToggleSelect}
          >
            <Checkbox
              checked={isSelected}
              className="h-5 w-5 border-2 border-gray-600 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
            />
          </div>
        ) : (
          <div
            className="h-5 w-5 rounded border-2 flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110"
            style={{
              backgroundColor: task.completed
                ? 'rgb(107, 114, 128)' 
                : currentColumn.id === 'todo' 
                ? 'rgba(31, 41, 55, 0.5)' 
                : getColorStyles(currentColumn.color).bg,
              borderColor: task.completed
                ? 'rgb(107, 114, 128)' 
                : currentColumn.id === 'todo' 
                ? 'rgb(75, 85, 99)' 
                : getColorStyles(currentColumn.color).border
            }}
            onClick={() => { handleToggleProgress(); }}
            title={currentColumn.title}
          >
            {!task.completed && currentColumn.id !== 'todo' && currentColumn.id !== 'completed' && (
              <ColumnIcon className={`${currentColumn.color} h-3 w-3 transition-all duration-200`} />
            )}
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <label
              htmlFor={`task-${task.id}`}
              className={cn(
                'mobile-body font-medium cursor-pointer transition-colors',
                task.completed ? 'text-muted-foreground line-through' : 'text-foreground'
              )}
            >
              {task.text}
            </label>
            {task.starred && (
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 shrink-0" />
            )}
          </div>
          
          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="flex items-center gap-1 mt-1.5 flex-wrap">
              {task.tags.map((tag, index) => {
                const hexColor = task.tagColors?.[tag] || '#3b82f6';
                const styles = getTagStyles(hexColor);
                return (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="text-xs px-2 py-0.5 border font-medium"
                    style={{
                      backgroundColor: styles.backgroundColor,
                      color: styles.color,
                      borderColor: styles.borderColor,
                    }}
                  >
                    {tag}
                  </Badge>
                );
              })}
            </div>
          )}
          
          {formattedDate && (
            <div className="flex items-center gap-2 mt-1">
              {isOverdue && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                      <Flag className="h-3 w-3"/> Overdue
                  </Badge>
              )}
               <p className={cn(
                  'mobile-caption',
                  isOverdue ? 'text-destructive' : 'text-muted-foreground'
              )}>
                {formattedDate}
              </p>
            </div>
          )}
        </div>

        {(task.description || (task.attachments && task.attachments.length > 0)) && (
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="mobile-button data-[state=open]:rotate-180 transition-transform">
              <ChevronDown className="h-4 w-4" />
              {task.attachments && task.attachments.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                  {task.attachments.length}
                </Badge>
              )}
            </Button>
          </CollapsibleTrigger>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-gray-800 border-gray-700">
             <DropdownMenuItem 
              onClick={() => setIsEditDialogOpen(true)}
              className="hover:bg-gray-700 focus:bg-gray-700"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Task
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={handleToggleProgress}
              className="hover:bg-gray-700 focus:bg-gray-700"
            >
              {(() => {
                const currentIndex = columns.findIndex(c => c.id === taskColumnId);
                const nextIndex = (currentIndex + 1) % columns.length;
                const nextColumn = columns[nextIndex];
                const NextIcon = getIconComponent(nextColumn.icon);
                return (
                  <>
                    <NextIcon className={`mr-2 h-4 w-4 ${nextColumn.color}`} />
                    Move to {nextColumn.title}
                  </>
                );
              })()}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setIsTimerOpen(true)}
              className="hover:bg-gray-700 focus:bg-gray-700"
            >
              <Clock className="mr-2 h-4 w-4" />
              Set Timer
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-700" />
            <DropdownMenuItem
              onClick={() => onDelete(task.id)}
              className="text-red-400 focus:text-red-400 hover:bg-red-500/10 focus:bg-red-500/10"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

       {(task.description || (task.attachments && task.attachments.length > 0)) && (
        <CollapsibleContent>
            <div className="p-4 pl-12 border-t border-dashed border-gray-700">
              {task.description && (
                <div className="prose prose-sm prose-invert max-w-none text-muted-foreground mb-4">
                  <style jsx global>{`
                      .prose h3 { color: white; margin-bottom: 0.5rem; margin-top: 1rem; font-size: 1rem; }
                      .prose ul, .prose ol { margin-left: 1rem; padding-left: 1rem; }
                      .prose li { margin-bottom: 0.25rem; }
                  `}</style>
                  <Markdown text={task.description} />
                </div>
              )}
              
              {/* Attachments */}
              {task.attachments && task.attachments.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-2">
                    <Paperclip className="h-4 w-4" />
                    <span>Attachments ({task.attachments.length})</span>
                  </div>
                  <div className="space-y-2">
                    {task.attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700 hover:bg-gray-800 transition-colors group"
                      >
                        {attachment.fileType.startsWith('image/') ? (
                          <div className="relative">
                            <ImageIcon className="h-5 w-5 text-blue-400 shrink-0" />
                          </div>
                        ) : (
                          <File className="h-5 w-5 text-gray-400 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-200 truncate font-medium">{attachment.fileName}</p>
                          <p className="text-xs text-gray-400">
                            {(attachment.fileSize / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              // Open image in new tab or download
                              if (attachment.fileType.startsWith('image/')) {
                                const win = window.open();
                                if (win) {
                                  win.document.write(`<img src="${attachment.fileUrl}" style="max-width:100%;height:auto;" />`);
                                }
                              } else {
                                // Download file
                                const link = document.createElement('a');
                                link.href = attachment.fileUrl;
                                link.download = attachment.fileName;
                                link.click();
                              }
                            }}
                            title={attachment.fileType.startsWith('image/') ? 'View' : 'Download'}
                          >
                            {attachment.fileType.startsWith('image/') ? (
                              <ExternalLink className="h-4 w-4 text-blue-400" />
                            ) : (
                              <Download className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
        </CollapsibleContent>
       )}
    </Collapsible>
    <EditTaskDialog 
        isOpen={isEditDialogOpen} 
        onOpenChange={setIsEditDialogOpen} 
        task={task}
    />
    
    {/* Timer Dialog */}
    {isTimerOpen && (
      <div className="mobile-modal">
        <div className="mobile-modal-content">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="mobile-subheading">Task Timer</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsTimerOpen(false)}
              className="mobile-button h-8 w-8 p-0"
            >
              ×
            </Button>
          </div>
          <TaskTimer
            taskId={task.id}
            taskTitle={task.text}
            userEmail={user?.email || undefined}
            userName={user?.displayName || undefined}
            onTimerComplete={(taskId, duration) => {
              console.log(`Timer completed for task ${taskId} after ${duration} seconds`);
              setIsTimerOpen(false);
            }}
          />
        </div>
      </div>
    )}
    </>
  );
}
