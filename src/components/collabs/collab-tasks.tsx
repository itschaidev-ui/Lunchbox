'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Plus, CheckSquare, Upload, Download, Users, Filter, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/context/auth-context';
import { useTasks } from '@/context/task-context';
import { 
  getCollabTasks, 
  createCollabTask, 
  updateCollabTask, 
  deleteCollabTask,
  hasPermission 
} from '@/lib/firebase-collaborations';
import type { CollabTask } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { TaskImportDialog } from '@/components/collabs/task-import-dialog';

interface CollabTasksProps {
  collabId: string;
}

export function CollabTasks({ collabId }: CollabTasksProps) {
  const { user } = useAuth();
  const { tasks: personalTasks } = useTasks();
  const { toast } = useToast();
  const [collabTasks, setCollabTasks] = useState<CollabTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [canCreate, setCanCreate] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Track tasks being toggled to prevent rapid toggles
  const togglingTasksRef = useRef<Set<string>>(new Set());

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      const tasks = await getCollabTasks(collabId);
      setCollabTasks(tasks);
    } catch (error) {
      console.error('Error loading collab tasks:', error);
      toast({
        title: 'Error',
        description: 'Failed to load collaboration tasks',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [collabId, toast]);

  const checkPermissions = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const canCreateTasks = await hasPermission(collabId, user.uid, 'create_tasks');
      const canEditTasks = await hasPermission(collabId, user.uid, 'edit_tasks');
      setCanCreate(canCreateTasks);
      setCanEdit(canEditTasks);
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  }, [collabId, user?.uid]);

  useEffect(() => {
    if (user?.uid && collabId) {
      loadTasks();
      checkPermissions();
    }
  }, [user?.uid, collabId, loadTasks, checkPermissions]);

  // Memoized toggle handler with optimistic updates and debounce to prevent flickering
  const handleToggleTask = useCallback(async (taskId: string) => {
    if (!canEdit) {
      toast({
        title: 'Permission Denied',
        description: 'You do not have permission to edit tasks',
        variant: 'destructive',
      });
      return;
    }

    // Prevent rapid toggles
    if (togglingTasksRef.current.has(taskId)) {
      return;
    }

    const task = collabTasks.find(t => t.id === taskId);
    if (!task) return;

    // Store the new completed state
    const newCompletedState = !task.completed;
    
    // Track this task as being toggled
    togglingTasksRef.current.add(taskId);

    // Optimistic update - update state immediately
    setCollabTasks(prev => {
      return prev.map(t =>
        t.id === taskId ? { ...t, completed: newCompletedState } : t
      );
    });

    try {
      // Update Firebase
      await updateCollabTask(taskId, { completed: newCompletedState });
    } catch (error) {
      console.error('Error toggling task:', error);
      
      // Revert optimistic update on error
      setCollabTasks(prev => {
        return prev.map(t =>
          t.id === taskId ? { ...t, completed: task.completed } : t
        );
      });
      
      toast({
        title: 'Error',
        description: 'Failed to update task',
        variant: 'destructive',
      });
    } finally {
      // Remove from set after a short delay to allow the toggle to complete
      setTimeout(() => {
        togglingTasksRef.current.delete(taskId);
      }, 500);
    }
  }, [canEdit, collabTasks, toast]);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    if (!canEdit) {
      toast({
        title: 'Permission Denied',
        description: 'You do not have permission to delete tasks',
        variant: 'destructive',
      });
      return;
    }

    // Optimistic update - remove task immediately
    const taskToDelete = collabTasks.find(t => t.id === taskId);
    setCollabTasks(prev => prev.filter(t => t.id !== taskId));

    try {
      await deleteCollabTask(taskId);
      toast({
        title: 'Success',
        description: 'Task deleted',
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      
      // Revert optimistic update on error
      if (taskToDelete) {
        setCollabTasks(prev => {
          // Find the original position by comparing with existing tasks
          const originalIndex = collabTasks.findIndex(t => t.id === taskToDelete.id);
          const newTasks = [...prev];
          if (originalIndex >= 0) {
            newTasks.splice(originalIndex, 0, taskToDelete);
          } else {
            newTasks.push(taskToDelete);
          }
          return newTasks;
        });
      }
      
      toast({
        title: 'Error',
        description: 'Failed to delete task',
        variant: 'destructive',
      });
    }
  }, [canEdit, collabTasks, toast]);

  // Memoize filtered tasks to prevent unnecessary recalculations
  const filteredTasks = useMemo(() => 
    collabTasks.filter(task =>
      task.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    ),
    [collabTasks, searchQuery]
  );

  // Helper to format date safely
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return null;
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch {
      return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-700/50 bg-gradient-to-r from-gray-900/50 to-gray-800/30 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <CheckSquare className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-headline tracking-tight">
                Shared Tasks
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {canCreate && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowImportDialog(true)}
                  className="h-9 border-gray-700/50 hover:bg-gray-800 text-gray-300 hover:text-white transition-colors"
                >
                  <Upload className="h-4 w-4 mr-1.5" />
                  Import
                </Button>
                <Button
                  size="sm"
                  onClick={() => {/* TODO: Add new task functionality */}}
                  className="h-9 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-sm"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  New Task
                </Button>
              </>
            )}
          </div>
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="pl-9 w-full text-sm h-10 bg-gray-900/50 border-gray-800"
          />
        </div>
      </div>

      {/* Tasks List */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 md:p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full"></div>
                <CheckSquare className="h-12 w-12 text-indigo-400 relative animate-pulse" />
              </div>
              <p className="text-muted-foreground mt-4">Loading tasks...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-16">
              <div className="relative inline-block mb-4">
                <div className="absolute inset-0 bg-indigo-500/10 blur-xl rounded-full"></div>
                <CheckSquare className="h-16 w-16 text-muted-foreground/30 relative" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? 'No tasks match your search' : 'No shared tasks yet'}
              </h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                {searchQuery 
                  ? 'Try adjusting your search terms'
                  : 'Get started by importing tasks from your personal list or creating a new task.'}
              </p>
              {canCreate && !searchQuery && (
                <Button
                  onClick={() => setShowImportDialog(true)}
                  size="sm"
                  className="h-9 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-sm"
                >
                  <Upload className="h-4 w-4 mr-1.5" />
                  Import from Personal Tasks
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => {
                const formattedDueDate = formatDate(task.dueDate);
                const isOverdue = task.dueDate && !task.completed && new Date(task.dueDate) < new Date();
                
                return (
                  <Card
                    key={task.id}
                    className="group p-5 bg-gradient-to-br from-gray-800/50 to-gray-900/30 border border-gray-700/50 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-200"
                  >
                    <div className="flex items-start gap-4">
                      <div className="mt-0.5">
                        <div
                          onClick={() => canEdit && handleToggleTask(task.id)}
                          className={`h-5 w-5 rounded border-2 flex items-center justify-center cursor-pointer transition-all duration-200 ${
                            canEdit ? 'hover:scale-110' : 'cursor-not-allowed opacity-50'
                          }`}
                          style={{
                            backgroundColor: task.completed 
                              ? 'rgb(59, 130, 246)' // blue-500
                              : 'rgba(31, 41, 55, 0.5)', // gray-800/50
                            borderColor: task.completed 
                              ? 'rgb(59, 130, 246)' // blue-500
                              : 'rgb(75, 85, 99)' // gray-600
                          }}
                        >
                          {task.completed && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className={`font-semibold text-base leading-snug ${
                              task.completed 
                                ? 'line-through text-muted-foreground/60' 
                                : 'text-foreground'
                            }`}>
                              {task.text}
                            </h3>
                            {task.description && (
                              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                                {task.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-3 flex-wrap">
                              {task.tags && task.tags.length > 0 && (
                                <div className="flex gap-1.5 flex-wrap">
                                  {task.tags.map((tag) => (
                                    <Badge 
                                      key={tag} 
                                      variant="secondary" 
                                      className="text-xs px-2 py-0.5 bg-indigo-500/10 text-indigo-300 border-indigo-500/20 hover:bg-indigo-500/20"
                                    >
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              {task.isShared && (
                                <Badge variant="outline" className="text-xs px-2 py-0.5 border-purple-500/30 text-purple-300 bg-purple-500/10">
                                  <Users className="h-3 w-3 mr-1" />
                                  In Main List
                                </Badge>
                              )}
                              {formattedDueDate && (
                                <span className={`text-xs px-2 py-0.5 rounded-md ${
                                  isOverdue 
                                    ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                                    : 'bg-gray-700/50 text-muted-foreground'
                                }`}>
                                  Due: {formattedDueDate}
                                </span>
                              )}
                            </div>
                          </div>
                          {canEdit && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteTask(task.id)}
                              className="h-9 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-destructive hover:bg-gray-800 shrink-0"
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Import Dialog */}
      <TaskImportDialog
        open={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        onSuccess={loadTasks}
        collabId={collabId}
        personalTasks={personalTasks}
      />
    </div>
  );
}

