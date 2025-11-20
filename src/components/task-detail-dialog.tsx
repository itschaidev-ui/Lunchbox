'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Edit, Trash2, Star, Repeat, Clock, Calendar as CalendarIcon } from 'lucide-react';
import type { Task } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { getTagStyles } from '@/lib/tag-colors';
import { EditTaskDialog } from './edit-task-dialog';
import { useState } from 'react';

interface TaskDetailDialogProps {
  task: Task | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  isCompleted: boolean;
}

// URL detection and rendering component
const Markdown = ({ text }: { text: string }) => {
  const urlPattern = /(@)?(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}[^\s]*)/gi;
  
  let html = text.replace(urlPattern, (match, atSymbol, url) => {
    const cleanUrl = atSymbol ? url : match;
    const fullUrl = cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`;
    return `<a href="${fullUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 hover:underline">${match}</a>`;
  });
  
  html = html
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$2</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\n\s*-\s/g, '</li><li>')
    .replace(/\n\s*\*\s/g, '</li><li>')
    .replace(/\n\d+\.\s/g, '</li><li>')
    .replace(/\n(?!<li|<\/ul>|<\/ol>|<h1>|<h2>|<h3>)/g, '<br/>');

  const listFixedHtml = html.replace(/<li>/g, (match, offset, fullString) => {
    if(fullString.slice(offset-4, offset) === '<ul>' || fullString.slice(offset-4, offset) === '<ol>') return '<li>';
    const isNumbered = /\d/.test(fullString.charAt(offset-2));
    return isNumbered ? '<ol><li>' : '<ul><li>';
  }).replace(/<\/li><li>/g, '</li><li>');

  return <div className="prose-sm prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: listFixedHtml }} />;
};

export function TaskDetailDialog({ 
  task, 
  isOpen, 
  onOpenChange, 
  onToggle, 
  onEdit, 
  onDelete,
  isCompleted 
}: TaskDetailDialogProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  if (!task) return null;

  const formattedDate = task.dueDate ? (() => {
    const date = parseISO(task.dueDate);
    if (isNaN(date.getTime())) return 'Invalid date';
    if (date.getHours() === 0 && date.getMinutes() === 0) {
      return format(date, 'MMM d, yyyy');
    }
    return format(date, 'MMM d, yyyy, p');
  })() : null;

  const handleToggle = () => {
    onToggle(task.id);
  };

  const handleEdit = () => {
    setIsEditDialogOpen(true);
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this task?')) {
      onDelete(task.id);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className={cn(isCompleted && 'line-through text-gray-400')}>
              {task.text}
            </span>
            {task.starred && (
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Completion Checkbox */}
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "h-6 w-6 rounded border-2 flex items-center justify-center cursor-pointer transition-all",
                isCompleted
                  ? "bg-gray-600 border-gray-600"
                  : "border-gray-600 hover:border-gray-500"
              )}
              onClick={handleToggle}
            >
              {isCompleted && (
                <svg className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <label 
              className={cn(
                "text-sm font-medium cursor-pointer",
                isCompleted ? "text-gray-400 line-through" : "text-white"
              )}
              onClick={handleToggle}
            >
              {isCompleted ? 'Completed' : 'Mark as completed'}
            </label>
          </div>

          {/* Description */}
          {task.description && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-400">Description</h3>
              <div className="text-sm text-gray-300">
                <Markdown text={task.description} />
              </div>
            </div>
          )}

          {/* Date & Time */}
          {(formattedDate || task.availableDaysTime) && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <CalendarIcon className="h-4 w-4" />
              <span>
                {formattedDate || task.availableDaysTime}
              </span>
            </div>
          )}

          {/* Repeating Task Indicator */}
          {task.availableDays && task.availableDays.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-purple-400">
              <Repeat className="h-4 w-4" />
              <span>Repeating task</span>
            </div>
          )}

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-400">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {task.tags.map((tag, index) => {
                  const hexColor = task.tagColors?.[tag] || '#3b82f6';
                  const styles = getTagStyles(hexColor);
                  return (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="text-xs px-2 py-1 border font-medium"
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
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-4 border-t border-gray-700">
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
              className="flex-1"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="flex-1 text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </DialogContent>
      
      {/* Edit Task Dialog */}
      <EditTaskDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        task={task}
      />
    </Dialog>
  );
}

