
'use client';

import { useState, useEffect, Suspense, useMemo, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { TaskHeader } from '@/components/layout/task-header';
import { TaskForm } from '@/components/task-form';
import { TaskItem } from '@/components/task-item';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, List, Search, ArrowLeft, Kanban, CheckSquare, Trash2, X, Tag as TagIcon, Filter, SlidersHorizontal } from 'lucide-react';
import { useTasks } from '@/context/task-context';
import { useAuth } from '@/context/auth-context';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaskCalendar } from '@/components/calendar/task-calendar';
import { TaskKanban } from '@/components/kanban/task-kanban';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import Link from 'next/link';
import { AssistantSidebar } from '@/components/assistant/assistant-sidebar';
import { FeedbackPopup } from '@/components/feedback/feedback-popup';
import { TaskSummaryDialog } from '@/components/task-summary-dialog';
import { useSearchParams } from 'next/navigation';
import type { Message } from '@/ai/flows/chat';
import { FloatingMenu } from '@/components/layout/floating-menu';
import { CreditsDisplay } from '@/components/credits/credits-display';
import { CreditsDialog } from '@/components/credits/credits-dialog';
// Removed old notification system import

function TasksPageContent() {
  const { tasks, loading, addTask, toggleTask, deleteTask, fetchTasks } = useTasks();
  const { user } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('recent');
  const [searchTerm, setSearchTerm] = useState('');
  const [previousTaskCount, setPreviousTaskCount] = useState(tasks.length);
  const [assistantMessages, setAssistantMessages] = useState<Message[]>([]);
  const [bulkSelectMode, setBulkSelectMode] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showCreditsDialog, setShowCreditsDialog] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  
  // Get search params - must be called unconditionally (hooks rule)
  const searchParams = useSearchParams();
  
  // Track tasks being toggled to prevent rapid toggles
  const togglingTasksRef = useRef<Set<string>>(new Set());
  
  // Memoized toggle handler with debounce to prevent flickering
  const handleToggle = useCallback(async (taskId: string) => {
    // Prevent rapid toggles
    if (togglingTasksRef.current.has(taskId)) {
      return;
    }
    
    togglingTasksRef.current.add(taskId);
    
    try {
      await toggleTask(taskId);
    } finally {
      // Remove from set after a short delay to allow the toggle to complete
      setTimeout(() => {
        togglingTasksRef.current.delete(taskId);
      }, 500);
    }
  }, [toggleTask]);

  // Bulk select handlers
  const toggleBulkSelect = () => {
    setBulkSelectMode(!bulkSelectMode);
    setSelectedTaskIds(new Set());
  };

  const toggleTaskSelection = (taskId: string) => {
    const newSelected = new Set(selectedTaskIds);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTaskIds(newSelected);
  };

  const selectAllTasks = () => {
    const allTaskIds = new Set(sortedTasks.map(task => task.id));
    setSelectedTaskIds(allTaskIds);
  };

  const deselectAllTasks = () => {
    setSelectedTaskIds(new Set());
  };

  const bulkDeleteTasks = async () => {
    if (selectedTaskIds.size === 0) return;
    
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selectedTaskIds.size} task(s)? This action cannot be undone.`
    );
    
    if (confirmDelete) {
      for (const taskId of selectedTaskIds) {
        await deleteTask(taskId);
      }
      setSelectedTaskIds(new Set());
      setBulkSelectMode(false);
    }
  };

  // Debug: Log task loading state
  useEffect(() => {
    console.log('Tasks page - loading:', loading, 'tasks:', tasks.length, 'user:', !!user);
  }, [loading, tasks.length, user]);

  // Debug: Create test task
  const createTestTask = async () => {
    if (!user) {
      console.log('No user, cannot create test task');
      return;
    }
    console.log('Creating test task for user:', user.uid);
    try {
      await addTask({
        text: 'Test task created at ' + new Date().toLocaleTimeString(),
        description: 'This is a test task to verify task creation works',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
      console.log('Test task created successfully');
    } catch (error) {
      console.error('Error creating test task:', error);
    }
  };

  // Test notification function
  const testNotification = async () => {
    if (!user || !user.email) {
      console.log('No user or email, cannot send test notification');
      alert('Please sign in with Google to test notifications');
      return;
    }
    
    try {
      console.log('Sending test notification to:', user.email);
      
      const response = await fetch('/api/notifications/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          userEmail: user.email,
          userName: user.displayName || user.email?.split('@')[0] || 'User',
          type: 'daily_summary'
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Test notification sent:', result);
        alert(`✅ Test notification sent to ${user.email}! Check your inbox.`);
      } else {
        const error = await response.json();
        console.error('Notification failed:', error);
        alert(`❌ Notification failed: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      alert(`❌ Error sending notification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Reschedule reminders for all existing tasks (NEW SYSTEM)
  const rescheduleNotifications = async () => {
    if (!user || !user.email) {
      console.log('No user or email, cannot reschedule reminders');
      alert('Please sign in with Google to reschedule reminders');
      return;
    }
    
    try {
      console.log('Rescheduling reminders for all tasks...');
      alert('🔄 Rescheduling reminders for all tasks...');
      
      // Get all tasks and create reminders for each one
      const tasksWithDueDates = tasks.filter(task => task.dueDate);
      
      for (const task of tasksWithDueDates) {
        try {
          // Delete old reminders first
          await fetch('/api/delete-task-reminders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ taskId: task.id })
          });
          
          // Create new reminders
          await fetch('/api/create-task-reminders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              taskId: task.id,
              userId: user.uid,
              userEmail: user.email,
              userName: user.displayName || 'User',
              dueTime: task.dueDate,
              taskTitle: task.text
            })
          });
          
          console.log(`✅ Reminders rescheduled for task: ${task.text}`);
        } catch (error) {
          console.error(`❌ Failed to reschedule reminders for task ${task.id}:`, error);
        }
      }
      
      console.log('✅ All reminders rescheduled successfully!');
      alert('✅ All reminders rescheduled successfully!');
      
    } catch (error) {
      console.error('Error rescheduling reminders:', error);
      alert('❌ Failed to reschedule reminders. Check console for details.');
    }
  };

  // Load chat history and open assistant if coming from assistant page
  useEffect(() => {
    // Check if we're on the client side
    if (typeof window === 'undefined') return;
    if (!searchParams) return;
    
    try {
      const assistantParam = searchParams.get('assistant');
      console.log('Assistant param:', assistantParam);
      if (assistantParam === 'true') {
        const chatHistory = sessionStorage.getItem('assistantChatHistory');
        console.log('Chat history from storage:', chatHistory);
        if (chatHistory) {
          try {
            const messages = JSON.parse(chatHistory);
            console.log('Parsed messages:', messages);
            // Validate that messages is an array
            if (Array.isArray(messages)) {
              setAssistantMessages(messages);
              setIsAssistantOpen(true);
              // Clear the session storage after loading
              sessionStorage.removeItem('assistantChatHistory');
            } else {
              console.warn('Chat history is not an array:', messages);
            }
          } catch (error) {
            console.error('Error loading chat history:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error in assistant param effect:', error);
    }
  }, [searchParams]);

  // Listen for custom button actions
  useEffect(() => {
    const handleOpenNewTaskForm = () => {
      setIsFormOpen(true);
    };

    const handleToggleAssistant = () => {
      setIsAssistantOpen(prev => !prev);
    };

    const handleToggleFeedback = () => {
      setIsFeedbackOpen(prev => !prev);
    };

    const handleOpenCreditsDialog = () => {
      setShowCreditsDialog(true);
    };

    window.addEventListener('open-new-task-form', handleOpenNewTaskForm);
    window.addEventListener('toggle-assistant', handleToggleAssistant);
    window.addEventListener('toggle-feedback', handleToggleFeedback);
    window.addEventListener('open-credits-dialog', handleOpenCreditsDialog);

    return () => {
      window.removeEventListener('open-new-task-form', handleOpenNewTaskForm);
      window.removeEventListener('toggle-assistant', handleToggleAssistant);
      window.removeEventListener('toggle-feedback', handleToggleFeedback);
      window.removeEventListener('open-credits-dialog', handleOpenCreditsDialog);
    };
  }, []);

  // Auto-open assistant when tasks are created (disabled - user preference)
  // useEffect(() => {
  //   if (tasks.length > previousTaskCount) {
  //     setIsAssistantOpen(true);
  //   }
  //   setPreviousTaskCount(tasks.length);
  // }, [tasks.length, previousTaskCount]);
  
  // Get all unique tags from tasks
  const allTags = useMemo(() => 
    Array.from(new Set(tasks.flatMap(t => t.tags || []))).sort(),
    [tasks]
  );

  // Memoize filtered and sorted tasks to prevent unnecessary re-renders
  const filteredTasks = useMemo(() => 
    tasks
      .filter(task => {
        // Note: Tasks with availableDays are shown but locked (not hidden)
        // The lock icon is displayed in TaskItem component
        
        if (filter === 'all') return true;
        if (filter === 'active') return !task.completed;
        if (filter === 'completed') return task.completed;
        if (filter === 'overdue') return task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;
        return true;
      })
      .filter(task => task.text.toLowerCase().includes(searchTerm.toLowerCase()))
      .filter(task => {
        // Tag filtering
        if (selectedTags.length === 0) return true;
        return selectedTags.some(tag => task.tags?.includes(tag));
      }),
    [tasks, filter, searchTerm, selectedTags]
  );

  const sortedTasks = useMemo(() => 
    [...filteredTasks].sort((a, b) => {
      if (sort === 'recent') {
        return (b.dueDate ? new Date(b.dueDate).getTime() : 0) - (a.dueDate ? new Date(a.dueDate).getTime() : 0);
      }
      if (sort === 'oldest') {
        return (a.dueDate ? new Date(a.dueDate).getTime() : 0) - (b.dueDate ? new Date(b.dueDate).getTime() : 0);
      }
      return 0;
    }),
    [filteredTasks, sort]
  );

  const stats = {
    total: tasks.length,
    done: tasks.filter(t => t.completed).length,
    overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && !t.completed).length,
  };
  
  const listView = (
      <>
        <div className="mt-2 md:mt-4">
            <div className="flex flex-col gap-2 mb-4 md:mb-6 shrink-0">
                {/* Search Bar */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input 
                        placeholder="Search tasks..." 
                        className="pl-9 pr-4 w-full text-sm h-10 bg-gray-900/50 border-gray-800"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                {/* Desktop Filters - Hidden on mobile */}
                <div className="hidden md:flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Select value={filter} onValueChange={setFilter}>
                      <SelectTrigger className="flex-1 text-xs sm:text-sm h-10 bg-gray-900/50 border-gray-800">
                        <SelectValue placeholder="Filter" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-800">
                        <SelectItem value="all" className="text-xs sm:text-sm">All Tasks</SelectItem>
                        <SelectItem value="active" className="text-xs sm:text-sm">Active</SelectItem>
                        <SelectItem value="completed" className="text-xs sm:text-sm">Completed</SelectItem>
                        <SelectItem value="overdue" className="text-xs sm:text-sm">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={sort} onValueChange={setSort}>
                      <SelectTrigger className="flex-1 text-xs sm:text-sm h-10 bg-gray-900/50 border-gray-800">
                        <SelectValue placeholder="Sort" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-800">
                        <SelectItem value="recent" className="text-xs sm:text-sm">Recent</SelectItem>
                        <SelectItem value="oldest" className="text-xs sm:text-sm">Oldest</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Desktop Tag Filter */}
                  {allTags.length > 0 && (
                    <div className="flex flex-wrap gap-2 items-center">
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Filter className="h-3 w-3" />
                        <span>Tags:</span>
                      </div>
                      {allTags.map(tag => (
                        <Button
                          key={tag}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedTags(prev => 
                              prev.includes(tag) 
                                ? prev.filter(t => t !== tag)
                                : [...prev, tag]
                            );
                          }}
                          className={`h-7 px-2 text-xs transition-all ${
                            selectedTags.includes(tag)
                              ? 'bg-blue-500/20 text-blue-300 border-blue-500/50 hover:bg-blue-500/30'
                              : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-white'
                          }`}
                        >
                          <TagIcon className="h-3 w-3 mr-1" />
                          {tag}
                        </Button>
                      ))}
                      {selectedTags.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedTags([])}
                          className="h-7 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Clear
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* Mobile Filter Button - Show on mobile only */}
                <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
                  <SheetTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="md:hidden w-full h-10 bg-gray-900/50 border-gray-800 justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <SlidersHorizontal className="h-4 w-4" />
                        <span className="text-sm">Filters</span>
                        {(filter !== 'all' || sort !== 'recent' || selectedTags.length > 0) && (
                          <span className="ml-2 px-2 py-0.5 text-xs bg-blue-500/20 text-blue-300 rounded-full">
                            {[
                              filter !== 'all' ? 1 : 0,
                              sort !== 'recent' ? 1 : 0,
                              selectedTags.length
                            ].reduce((a, b) => a + b, 0)}
                          </span>
                        )}
                      </div>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6 space-y-6">
                      {/* Filter Type */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Filter</label>
                        <Select value={filter} onValueChange={setFilter}>
                          <SelectTrigger className="w-full h-10 bg-gray-900/50 border-gray-800">
                            <SelectValue placeholder="Filter" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-900 border-gray-800">
                            <SelectItem value="all">All Tasks</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="overdue">Overdue</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Sort */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Sort</label>
                        <Select value={sort} onValueChange={setSort}>
                          <SelectTrigger className="w-full h-10 bg-gray-900/50 border-gray-800">
                            <SelectValue placeholder="Sort" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-900 border-gray-800">
                            <SelectItem value="recent">Recent</SelectItem>
                            <SelectItem value="oldest">Oldest</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Tags */}
                      {allTags.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-foreground flex items-center gap-2">
                              <Filter className="h-4 w-4" />
                              Tags
                            </label>
                            {selectedTags.length > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedTags([])}
                                className="h-7 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              >
                                <X className="h-3 w-3 mr-1" />
                                Clear All
                              </Button>
                            )}
                          </div>
                          <ScrollArea className="h-[200px] pr-4">
                            <div className="flex flex-wrap gap-2">
                              {allTags.map(tag => (
                                <Button
                                  key={tag}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedTags(prev => 
                                      prev.includes(tag) 
                                        ? prev.filter(t => t !== tag)
                                        : [...prev, tag]
                                    );
                                  }}
                                  className={`h-8 px-3 text-xs transition-all ${
                                    selectedTags.includes(tag)
                                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/50 hover:bg-blue-500/30'
                                      : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-white'
                                  }`}
                                >
                                  <TagIcon className="h-3 w-3 mr-1.5" />
                                  {tag}
                                </Button>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      )}

                      {/* Active Filters Summary */}
                      {(filter !== 'all' || sort !== 'recent' || selectedTags.length > 0) && (
                        <div className="pt-4 border-t border-gray-700">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Active Filters:</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setFilter('all');
                                setSort('recent');
                                setSelectedTags([]);
                              }}
                              className="text-xs text-red-400 hover:text-red-300"
                            >
                              Reset All
                            </Button>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {filter !== 'all' && (
                              <Badge variant="secondary" className="text-xs">
                                {filter === 'active' ? 'Active' : filter === 'completed' ? 'Completed' : 'Overdue'}
                              </Badge>
                            )}
                            {sort !== 'recent' && (
                              <Badge variant="secondary" className="text-xs">
                                {sort === 'oldest' ? 'Oldest' : 'Recent'}
                              </Badge>
                            )}
                            {selectedTags.map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </SheetContent>
                </Sheet>
            </div>
            {loading ? (
                <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6 sm:p-8">
                    <div className="text-center py-8 sm:py-12 border-2 border-dashed border-gray-700/50 rounded-lg">
                        <div className="flex items-center justify-center space-x-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                            <p className="text-sm text-muted-foreground">Loading tasks...</p>
                        </div>
                    </div>
                </div>
            ) : sortedTasks.length > 0 ? (
                <div className="flex flex-col gap-3">
                    <div className="bg-gray-800/30 border border-gray-700/50 rounded-t-xl p-3 sm:p-4 flex items-center justify-between shrink-0">
                        <h2 className="text-sm sm:text-base font-semibold text-foreground">All Tasks</h2>
                        <div className="flex items-center gap-2">
                            {!bulkSelectMode ? (
                                <>
                                    <div className="text-xs text-muted-foreground">
                                        {sortedTasks.length} of {tasks.length}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={toggleBulkSelect}
                                        className="h-7 px-2 text-xs text-gray-400 hover:text-white hover:bg-gray-700"
                                    >
                                        <CheckSquare className="h-3 w-3 mr-1" />
                                        Select
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <div className="text-xs text-blue-400 font-medium">
                                        {selectedTaskIds.size} selected
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={selectAllTasks}
                                        className="h-7 px-2 text-xs text-gray-400 hover:text-white hover:bg-gray-700"
                                    >
                                        Select All
                                    </Button>
                                    {selectedTaskIds.size > 0 && (
                                        <>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={deselectAllTasks}
                                                className="h-7 px-2 text-xs text-gray-400 hover:text-white hover:bg-gray-700"
                                            >
                                                Clear
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={bulkDeleteTasks}
                                                className="h-7 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                            >
                                                <Trash2 className="h-3 w-3 mr-1" />
                                                Delete
                                            </Button>
                                        </>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={toggleBulkSelect}
                                        className="h-7 px-2 text-xs text-gray-400 hover:text-white hover:bg-gray-700"
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="bg-gray-800/30 border border-gray-700/50 rounded-b-xl overflow-hidden">
                        <div className="divide-y divide-gray-700/30">
                            {sortedTasks.map(task => (
                            <TaskItem
                                key={task.id}
                                task={task}
                                onToggle={handleToggle}
                                onDelete={deleteTask}
                                bulkSelectMode={bulkSelectMode}
                                isSelected={selectedTaskIds.has(task.id)}
                                onToggleSelect={() => toggleTaskSelection(task.id)}
                            />
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6 sm:p-8">
                    <div className="text-center py-8 sm:py-12 border-2 border-dashed border-gray-700/50 rounded-lg">
                        <CheckSquare className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 text-muted-foreground" />
                        <p className="text-sm sm:text-base text-muted-foreground">No tasks match your criteria</p>
                        <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters</p>
                    </div>
                </div>
            )}
          </div>
      </>
  );

  const mainContent = (
    <div className="flex flex-col min-w-0 flex-1 h-full outline-none focus:outline-none focus-visible:outline-none">
        <TaskHeader 
          stats={stats} 
          onNewTask={() => setIsFormOpen(true)} 
          onToggleAssistant={() => setIsAssistantOpen(!isAssistantOpen)}
          onToggleFeedback={() => setIsFeedbackOpen(!isFeedbackOpen)}
          onCreateTestTask={createTestTask}
          onFetchTasks={fetchTasks}
          onTestNotification={testNotification}
          onRescheduleNotifications={rescheduleNotifications}
        />
        <div className="flex-1 flex flex-col px-3 sm:px-4 md:px-6 py-3 sm:py-4 overflow-y-auto outline-none focus:outline-none focus-visible:outline-none">
          <AnimatePresence mode="wait">
            {isFormOpen && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className="mb-4"
              >
                <TaskForm onCancel={() => setIsFormOpen(false)} />
              </motion.div>
            )}
          </AnimatePresence>
          <Tabs defaultValue="list" className="flex-1 flex flex-col outline-none focus:outline-none focus-visible:outline-none">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4 md:mb-6">
              <TabsList className="inline-flex h-9 items-center justify-center rounded-lg bg-gray-900/50 p-1 text-muted-foreground border border-gray-800 w-full sm:w-auto">
                <TabsTrigger 
                  value="list" 
                  className="flex-1 sm:flex-none inline-flex items-center justify-center whitespace-nowrap rounded-md px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition-all outline-none focus:outline-none focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-gray-800 data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  <List className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="hidden sm:inline">List</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="kanban" 
                  className="flex-1 sm:flex-none inline-flex items-center justify-center whitespace-nowrap rounded-md px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition-all outline-none focus:outline-none focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-gray-800 data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  <Kanban className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Kanban</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="calendar" 
                  className="flex-1 sm:flex-none inline-flex items-center justify-center whitespace-nowrap rounded-md px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition-all outline-none focus:outline-none focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-gray-800 data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Calendar</span>
                </TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <TaskSummaryDialog 
                  tasks={tasks} 
                  onAskAI={() => {
                    setIsAssistantOpen(true);
                    // Pre-fill with task summary request
                    setTimeout(() => {
                      const summaryPrompt = `Please analyze my tasks and provide insights:\n\n📊 Statistics:\n- Total: ${tasks.length}\n- Completed: ${tasks.filter(t => t.completed).length}\n- Active: ${tasks.filter(t => !t.completed).length}\n- Overdue: ${tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && !t.completed).length}\n\nWhat insights or recommendations do you have?`;
                      // The AI assistant will pick this up
                      sessionStorage.setItem('aiPrompt', summaryPrompt);
                    }, 100);
                  }}
                />
                <Button asChild variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-gray-800 transition-colors text-xs sm:text-sm flex-1 sm:flex-none">
                  <Link href="/">
                    <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    <span className="hidden sm:inline">Back to Home</span>
                    <span className="sm:hidden">Back</span>
                  </Link>
                </Button>
              </div>
            </div>
            <TabsContent value="list" className="flex-1 flex flex-col outline-none focus:outline-none focus-visible:outline-none">
                {listView}
            </TabsContent>
            <TabsContent value="kanban" className="flex-1 flex flex-col outline-none focus:outline-none focus-visible:outline-none">
              <TaskKanban 
                tasks={tasks} 
                onToggle={handleToggle} 
                onDelete={deleteTask}
                onNewTask={() => setIsFormOpen(true)}
              />
            </TabsContent>
            <TabsContent value="calendar" className="flex-1 flex flex-col items-center justify-center p-2 md:p-4 outline-none focus:outline-none focus-visible:outline-none">
              <TaskCalendar tasks={tasks} toggleTask={handleToggle} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
  );

  return (
    <div className="flex h-screen bg-background pt-0 outline-none focus:outline-none focus-visible:outline-none">
      <div className="flex flex-col w-full h-screen outline-none focus:outline-none focus-visible:outline-none">
        <Header />
        <div className="flex-1 min-h-0 outline-none focus:outline-none focus-visible:outline-none">
          {mainContent}
        </div>
      </div>
      {isAssistantOpen && (
        <AssistantSidebar 
          isOpen={isAssistantOpen}
          onClose={() => setIsAssistantOpen(false)}
          initialMessages={assistantMessages}
        />
      )}
      
      <FeedbackPopup 
        isOpen={isFeedbackOpen} 
        onClose={() => setIsFeedbackOpen(false)}
      />

      <FloatingMenu 
        onCreditsClick={() => setShowCreditsDialog(true)}
        onTutorialsClick={() => alert('Tutorials feature coming soon! 🎓')}
      />

      <CreditsDialog
        open={showCreditsDialog}
        onClose={() => setShowCreditsDialog(false)}
      />
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-background"><div className="text-muted-foreground">Loading...</div></div>}>
      <TasksPageContent />
    </Suspense>
  );
}
