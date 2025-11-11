'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import * as Icons from 'lucide-react';
import { Plus, MoreHorizontal, Trash2, PlayCircle, CheckSquare, Clock, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/context/auth-context';
import { ColumnManager, DEFAULT_COLUMNS } from './column-manager';
import type { Task, KanbanColumn } from '@/lib/types';
import { getUserPreferences, saveKanbanColumns } from '@/lib/firebase-user-preferences';

interface TaskKanbanProps {
  tasks: Task[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onNewTask: () => void;
}

// Kanban Card Component
const KanbanCard = ({ task, onToggle, onDelete }: { task: Task; onToggle: (id: string) => void; onDelete: (id: string) => void }) => {
  const { user } = useAuth();

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      onDelete(task.id);
    }
  };

  const userInitials = user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U';
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;

  return (
    <Card className="bg-gray-800/70 border border-gray-700/50 rounded-lg hover:border-gray-600 transition-all group">
      <CardContent className="p-3">
        <div className="space-y-2">
          {/* Task Title & Menu */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-white text-sm leading-snug break-words">
                  {task.text}
                </h3>
                {task.starred && (
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 shrink-0" />
                )}
              </div>
              
              {/* Tags */}
              {task.tags && task.tags.length > 0 && (
                <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                  {task.tags.map((tag, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 px-1.5 py-0.5"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 hover:bg-gray-700 shrink-0 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 bg-gray-800 border-gray-700">
                <DropdownMenuItem 
                  onClick={(e) => { e.stopPropagation(); onToggle(task.id); }}
                  className="cursor-pointer hover:bg-gray-700 text-gray-200 text-xs"
                >
                  <CheckSquare className="mr-2 h-3.5 w-3.5" />
                  {task.completed ? 'Incomplete' : 'Complete'}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                  className="cursor-pointer hover:bg-gray-700 text-red-400 text-xs"
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Description */}
          {task.description && (
            <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{task.description}</p>
          )}
          
          {/* Footer */}
          <div className="flex items-center justify-between pt-1">
            {isOverdue ? (
              <Badge className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5">
                Overdue
              </Badge>
            ) : task.completed ? (
              <Badge className="text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5">
                Done
              </Badge>
            ) : (
              <div className="w-1" />
            )}
            <Avatar className="w-6 h-6 ring-1 ring-gray-700">
              <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || user?.email || 'User'} />
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-[10px] text-white font-semibold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export function TaskKanban({ tasks, onToggle, onDelete, onNewTask }: TaskKanbanProps) {
  const { user } = useAuth();
  
  // Load columns from localStorage initially
  const [columns, setColumns] = useState<KanbanColumn[]>(() => {
    const saved = localStorage.getItem('kanban-columns');
    return saved ? JSON.parse(saved) : DEFAULT_COLUMNS;
  });

  const [taskStatuses, setTaskStatuses] = useState<Record<string, string>>(() => {
    // Load from localStorage
    const saved = localStorage.getItem('kanban-task-statuses');
    return saved ? JSON.parse(saved) : {};
  });

  // Load columns from Firebase when user logs in
  useEffect(() => {
    if (!user) return;

    const loadColumnsFromFirebase = async () => {
      try {
        const preferences = await getUserPreferences(user.uid);
        if (preferences?.kanbanColumns) {
          console.log('✅ Loaded Kanban columns from Firebase');
          setColumns(preferences.kanbanColumns);
          localStorage.setItem('kanban-columns', JSON.stringify(preferences.kanbanColumns));
        }
      } catch (error) {
        console.error('Failed to load columns from Firebase:', error);
      }
    };

    loadColumnsFromFirebase();
  }, [user]);

  // Save columns to localStorage and Firebase whenever they change
  useEffect(() => {
    localStorage.setItem('kanban-columns', JSON.stringify(columns));
    
    // Save to Firebase if user is logged in
    if (user) {
      saveKanbanColumns(user.uid, columns).catch(error => {
        console.error('Failed to save columns to Firebase:', error);
      });
    }
  }, [columns, user]);

  // Listen for task status changes from other components
  useEffect(() => {
    const handleStatusChange = (e: CustomEvent) => {
      const saved = localStorage.getItem('kanban-task-statuses');
      if (saved) {
        setTaskStatuses(JSON.parse(saved));
      }
    };

    const handleColumnDeleted = (e: CustomEvent) => {
      const { columnId } = e.detail;
      // Move all tasks from deleted column to 'todo'
      const newStatuses = { ...taskStatuses };
      Object.keys(newStatuses).forEach(taskId => {
        if (newStatuses[taskId] === columnId) {
          newStatuses[taskId] = 'todo';
        }
      });
      setTaskStatuses(newStatuses);
      localStorage.setItem('kanban-task-statuses', JSON.stringify(newStatuses));
    };

    window.addEventListener('task-status-change', handleStatusChange as EventListener);
    window.addEventListener('column-deleted', handleColumnDeleted as EventListener);
    return () => {
      window.removeEventListener('task-status-change', handleStatusChange as EventListener);
      window.removeEventListener('column-deleted', handleColumnDeleted as EventListener);
    };
  }, [taskStatuses]);

  // Helper to get task column
  const getTaskColumn = (task: Task): string => {
    if (task.completed) return 'completed';
    return taskStatuses[task.id] || task.columnId || 'todo';
  };

  // Categorize tasks by column
  const getTasksByColumn = (columnId: string) => {
    return tasks.filter(task => getTaskColumn(task) === columnId);
  };

  // Handle drag end with @hello-pangea/dnd
  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    // Dropped outside the list
    if (!destination) return;

    // Dropped in the same position
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const taskId = draggableId;
    const newColumnId = destination.droppableId;
    const task = tasks.find(t => t.id === taskId);

    if (!task) return;

    // Update task status
    const newStatuses = { ...taskStatuses, [taskId]: newColumnId };
    setTaskStatuses(newStatuses);
    localStorage.setItem('kanban-task-statuses', JSON.stringify(newStatuses));

    // Toggle completion if moving to/from 'completed' column
    if (newColumnId === 'completed' && !task.completed) {
      onToggle(task.id);
    } else if (newColumnId !== 'completed' && task.completed) {
      onToggle(task.id);
    }

    // Dispatch event
    window.dispatchEvent(new CustomEvent('task-status-change', { 
      detail: { taskId, status: newColumnId } 
    }));
  };

  // Get icon component dynamically
  const getIconComponent = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName];
    return IconComponent || Clock;
  };

  const KanbanColumn = ({ 
    column,
    columnTasks
  }: { 
    column: KanbanColumn;
    columnTasks: Task[];
  }) => {
    const IconComponent = getIconComponent(column.icon);
    
    return (
      <div className="flex-shrink-0 w-[85vw] sm:flex-1 sm:min-w-0">
        <div className="bg-gray-900/50 rounded-lg border border-gray-700/50 h-full flex flex-col">
          {/* Column Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-700/50">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <IconComponent className={`h-5 w-5 ${column.color} shrink-0`} />
              <span className="font-semibold text-white text-sm truncate">{column.title}</span>
              <Badge variant="secondary" className="text-[10px] bg-gray-800/50 text-gray-400 px-2 py-0.5 h-5 rounded-full shrink-0">
                {columnTasks.length}
              </Badge>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 hover:bg-gray-800 text-gray-400 hover:text-white shrink-0"
              onClick={() => onNewTask()}
              title="Add task"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Column Content */}
          <Droppable droppableId={column.id}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`flex-1 overflow-y-auto p-3 space-y-2.5 min-h-[50vh] sm:min-h-[60vh] ${
                  snapshot.isDraggingOver ? 'bg-primary/5' : ''
                }`}
              >
                {columnTasks.length === 0 && !snapshot.isDraggingOver && (
                  <div className="flex flex-col items-center justify-center h-32 text-gray-500 text-sm">
                    <IconComponent className={`h-8 w-8 ${column.color} opacity-30 mb-2`} />
                    <p className="text-xs">No tasks yet</p>
                  </div>
                )}
                
                {columnTasks.map((task, index) => (
                  <Draggable key={task.id} draggableId={task.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`transition-all ${
                          snapshot.isDragging ? 'opacity-70 scale-105 rotate-2' : 'opacity-100'
                        }`}
                      >
                        <KanbanCard
                          task={task}
                          onToggle={onToggle}
                          onDelete={onDelete}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
          
          {/* Add Task Button */}
          <div className="p-3 border-t border-gray-700/50">
            <Button
              variant="ghost"
              className="w-full h-9 border border-dashed border-gray-700 hover:border-gray-600 hover:bg-gray-800/50 text-gray-400 hover:text-white rounded-lg transition-all text-sm active:scale-95"
              onClick={onNewTask}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full space-y-3 sm:space-y-4">
      {/* Column Manager Button */}
      <div className="flex justify-end px-2 sm:px-0">
        <ColumnManager columns={columns} onColumnsChange={setColumns} />
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4 px-2 sm:px-0 -mx-2 sm:mx-0">
          <div className="flex gap-3 sm:gap-4 h-full min-w-max sm:min-w-full">
            {columns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                columnTasks={getTasksByColumn(column.id)}
              />
            ))}
          </div>
        </div>
      </DragDropContext>
    </div>
  );
}
