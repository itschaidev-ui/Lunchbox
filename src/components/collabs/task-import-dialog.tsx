'use client';

import { useState, useEffect } from 'react';
import { Upload, Download, CheckSquare, X, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { 
  createCollabTask,
  getCollabTasks 
} from '@/lib/firebase-collaborations';
import type { Task, CollabTask } from '@/lib/types';

interface TaskImportDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  collabId: string;
  personalTasks: Task[];
}

export function TaskImportDialog({
  open,
  onClose,
  onSuccess,
  collabId,
  personalTasks,
}: TaskImportDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingTaskIds, setExistingTaskIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open && collabId) {
      loadExistingTasks();
    }
  }, [open, collabId]);

  const loadExistingTasks = async () => {
    try {
      const collabTasks = await getCollabTasks(collabId);
      // Check which personal tasks are already in the collab (by text matching)
      const existing = new Set<string>();
      for (const collabTask of collabTasks) {
        for (const personalTask of personalTasks) {
          if (personalTask.text === collabTask.text) {
            existing.add(personalTask.id);
          }
        }
      }
      setExistingTaskIds(existing);
    } catch (error) {
      console.error('Error loading existing tasks:', error);
    }
  };

  const filteredTasks = personalTasks.filter(task =>
    !task.completed && // Only show incomplete tasks
    (task.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
     task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     task.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const toggleTaskSelection = (taskId: string) => {
    const newSelected = new Set(selectedTaskIds);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTaskIds(newSelected);
  };

  const handleImport = async () => {
    if (!user?.uid || selectedTaskIds.size === 0) return;

    try {
      setLoading(true);
      const tasksToImport = personalTasks.filter(t => selectedTaskIds.has(t.id));
      
      for (const task of tasksToImport) {
        // Create collab task from personal task
        await createCollabTask(collabId, user.uid, {
          text: task.text,
          completed: task.completed,
          dueDate: task.dueDate,
          description: task.description,
          tags: task.tags,
          tagColors: task.tagColors,
          starred: task.starred,
          isShared: false, // Not shared to main list by default
        });
      }

      toast({
        title: 'Success!',
        description: `Imported ${tasksToImport.length} task(s) to collaboration`,
      });

      onSuccess();
      onClose();
      setSelectedTaskIds(new Set());
    } catch (error: any) {
      console.error('Error importing tasks:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to import tasks',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!user?.uid || selectedTaskIds.size === 0) return;

    try {
      setLoading(true);
      const collabTasks = await getCollabTasks(collabId);
      const tasksToExport = collabTasks.filter(t => selectedTaskIds.has(t.id));
      
      // Create personal tasks from collab tasks
      // This would need to be done via API route to add to user's personal tasks
      const response = await fetch('/api/collabs/export-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          tasks: tasksToExport.map(t => ({
            text: t.text,
            completed: t.completed,
            dueDate: t.dueDate,
            description: t.description,
            tags: t.tags,
            tagColors: t.tagColors,
            starred: t.starred,
          })),
        }),
      });

      if (!response.ok) throw new Error('Export failed');

      toast({
        title: 'Success!',
        description: `Exported ${tasksToExport.length} task(s) to your personal list`,
      });

      onSuccess();
      onClose();
      setSelectedTaskIds(new Set());
    } catch (error: any) {
      console.error('Error exporting tasks:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to export tasks',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-indigo-400" />
            Import/Export Tasks
          </DialogTitle>
          <DialogDescription>
            Import tasks from your personal list or export collaboration tasks to your personal list
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="pl-9"
            />
          </div>

          {/* Tasks List */}
          <ScrollArea className="max-h-96 border rounded-md p-2">
            <div className="space-y-2">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? 'No tasks match your search' : 'No incomplete tasks to import'}
                </div>
              ) : (
                filteredTasks.map((task) => {
                  const isExisting = existingTaskIds.has(task.id);
                  return (
                    <div
                      key={task.id}
                      className={`flex items-start gap-3 p-3 rounded-md border ${
                        isExisting ? 'bg-gray-800/50 opacity-60' : 'bg-gray-800/30 hover:bg-gray-800/50'
                      }`}
                    >
                      <Checkbox
                        checked={selectedTaskIds.has(task.id)}
                        onCheckedChange={() => toggleTaskSelection(task.id)}
                        disabled={isExisting}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h4 className="font-medium">{task.text}</h4>
                            {task.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {task.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              {task.tags && task.tags.length > 0 && (
                                <div className="flex gap-1 flex-wrap">
                                  {task.tags.map((tag) => (
                                    <Badge key={tag} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              {isExisting && (
                                <Badge variant="outline" className="text-xs">
                                  Already in collab
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {selectedTaskIds.size} task(s) selected
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={loading || selectedTaskIds.size === 0}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Upload className="h-4 w-4 mr-2" />
                {loading ? 'Importing...' : 'Import Selected'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

