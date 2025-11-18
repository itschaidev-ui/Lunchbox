'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Task } from '@/lib/types';
import { format, isSameDay, parseISO, startOfToday, add, sub, startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, endOfMonth, isToday, isSameMonth } from 'date-fns';
import { Repeat, Star, Clock } from 'lucide-react';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isTaskCompletedForDate } from '@/lib/firebase-task-daily-completions';

type ViewMode = 'day' | 'week' | 'month';

interface TaskCalendarProps {
    tasks: Task[];
    toggleTask: (id: string) => void;
}

/**
 * Get tasks for a specific date, including repeating day-of-week tasks
 */
function getTasksForDate(tasks: Task[], date: Date): Task[] {
  const dayOfWeek = date.getDay(); // 0=Sunday, 1=Monday, etc.
  const dateStr = format(date, 'yyyy-MM-dd');
  
  return tasks.filter((task: Task) => {
    // Regular tasks with dueDate matching this date
    if (task.dueDate) {
      try {
        const dueDate = parseISO(task.dueDate);
        if (isSameDay(dueDate, date)) {
          return true;
        }
      } catch (e) {
        // Invalid date, skip
      }
    }
    
    // Repeating day-of-week tasks
    if (task.availableDays && task.availableDays.length > 0) {
      // Check if today is one of the available days
      if (task.availableDays.includes(dayOfWeek)) {
        // Check if repeat limit has been reached
        if (task.repeatWeeks && task.repeatStartDate) {
          const startDate = new Date(task.repeatStartDate);
          const endDate = new Date(startDate.getTime() + task.repeatWeeks * 7 * 24 * 60 * 60 * 1000);
          if (date > endDate) {
            return false; // Repeat limit reached
          }
        }
        return true;
      }
    }
    
    return false;
  });
}

export function TaskCalendar({ tasks, toggleTask }: TaskCalendarProps) {
  const today = startOfToday();
  const [currentDate, setCurrentDate] = useState(today);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedDayForTasks, setSelectedDayForTasks] = useState<Date | null>(null);
  const [dailyCompletions, setDailyCompletions] = useState<Map<string, boolean>>(new Map());

  // Check daily completions for repeating tasks
  const refreshDailyCompletions = useCallback(async () => {
    const newCompletions = new Map<string, boolean>();
    
    // Get all dates that might be displayed
    const datesToCheck: Date[] = [];
    if (viewMode === 'day') {
      datesToCheck.push(currentDate);
    } else if (viewMode === 'week') {
      const start = startOfWeek(currentDate);
      const end = endOfWeek(currentDate);
      datesToCheck.push(...eachDayOfInterval({ start, end }));
    } else {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const startDate = startOfWeek(monthStart);
      const endDate = endOfWeek(monthEnd);
      datesToCheck.push(...eachDayOfInterval({ start: startDate, end: endDate }));
    }

    // Check completion for each repeating task on each date
    for (const task of tasks) {
      if (task.availableDays && task.availableDays.length > 0) {
        for (const date of datesToCheck) {
          const dateStr = date.toISOString().split('T')[0];
          const key = `${task.id}_${dateStr}`;
          if (!newCompletions.has(key)) {
            const isCompleted = await isTaskCompletedForDate(task.id, date);
            newCompletions.set(key, isCompleted);
          }
        }
      }
    }

    setDailyCompletions(newCompletions);
  }, [tasks, currentDate, viewMode]);

  // Refresh completions when tasks, date, or view mode changes
  useEffect(() => {
    refreshDailyCompletions();
  }, [refreshDailyCompletions]);
  
  // Listen for daily completion changes (when user toggles a task)
  useEffect(() => {
    const handleCompletionChange = () => {
      refreshDailyCompletions();
    };
    
    window.addEventListener('daily-completion-changed', handleCompletionChange);
    return () => {
      window.removeEventListener('daily-completion-changed', handleCompletionChange);
    };
  }, [refreshDailyCompletions]);

  // Helper to check if a task is completed for a specific date
  const isTaskCompletedForDateLocal = (task: Task, date: Date): boolean => {
    // For repeating tasks, check daily completions
    if (task.availableDays && task.availableDays.length > 0) {
      const dateStr = date.toISOString().split('T')[0];
      return dailyCompletions.get(`${task.id}_${dateStr}`) || false;
    }
    // For regular tasks, use the global completed flag
    return task.completed || false;
  };

  const handlePrev = () => {
    if (viewMode === 'day') {
      setCurrentDate(sub(currentDate, { days: 1 }));
    } else if (viewMode === 'week') {
      setCurrentDate(sub(currentDate, { weeks: 1 }));
    } else {
      setCurrentDate(sub(currentDate, { months: 1 }));
    }
  };

  const handleNext = () => {
    if (viewMode === 'day') {
      setCurrentDate(add(currentDate, { days: 1 }));
    } else if (viewMode === 'week') {
      setCurrentDate(add(currentDate, { weeks: 1 }));
    } else {
      setCurrentDate(add(currentDate, { months: 1 }));
    }
  };
  
  const handleToday = () => {
    setCurrentDate(today);
  };

  const getHeaderTitle = () => {
    if (viewMode === 'day') {
      return format(currentDate, 'MMMM d, yyyy');
    } else if (viewMode === 'week') {
      const start = startOfWeek(currentDate);
      const end = endOfWeek(currentDate);
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
    } else {
      return format(currentDate, 'MMMM yyyy');
    }
  };

  const renderDayView = () => {
    const tasksForDay = getTasksForDate(tasks, currentDate);

    return (
      <div className="flex-1 overflow-y-auto p-4 md:p-6 min-h-0">
        <div className="max-w-3xl mx-auto">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white mb-2">
              {format(currentDate, 'EEEE, MMMM d')}
            </h3>
            <p className="text-sm text-gray-400">
              {tasksForDay.length} task{tasksForDay.length !== 1 ? 's' : ''} due
            </p>
          </div>
          {tasksForDay.length > 0 ? (
            <div className="space-y-2 pb-4">
              {tasksForDay.map((task: Task) => {
                const isCompleted = isTaskCompletedForDateLocal(task, currentDate);
                return (
                <div
                  key={task.id}
                  className={cn(
                    "p-4 rounded-lg border transition-all cursor-pointer",
                    isCompleted
                      ? "bg-gray-800/30 border-gray-700/50"
                      : "bg-gray-800/50 border-gray-700 hover:bg-gray-800/70"
                  )}
                  onClick={() => toggleTask(task.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5",
                      isCompleted ? "bg-gray-600 border-gray-600" : "border-gray-600"
                    )}>
                      {isCompleted && (
                        <svg className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={cn(
                        "font-medium",
                        isCompleted ? "line-through text-gray-400" : "text-white"
                      )}>
                        {task.text}
                      </p>
                      {task.description && (
                        <p className="text-sm text-gray-400 mt-1">{task.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {task.availableDays && task.availableDays.length > 0 && (
                          <div className="flex items-center gap-1 text-xs text-purple-400">
                            <Repeat className="h-3 w-3" />
                            <span>Repeating</span>
                          </div>
                        )}
                        {task.dueDate && (
                          <p className="text-xs text-gray-500">
                            {format(parseISO(task.dueDate), 'p')}
                          </p>
                        )}
                        {task.availableDaysTime && (
                          <p className="text-xs text-gray-500">
                            {task.availableDaysTime}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-gray-700/50 rounded-lg">
              <CalendarIcon className="h-12 w-12 mx-auto mb-3 text-gray-600" />
              <p className="text-gray-400">No tasks due today</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const start = startOfWeek(currentDate);
    const end = endOfWeek(currentDate);
    const days = eachDayOfInterval({ start, end });

    return (
      <div className="flex-1 overflow-x-auto min-h-0">
        <div className="grid grid-cols-1 md:grid-cols-7 min-w-full" style={{ minHeight: '100%', gridAutoRows: '1fr' }}>
          {days.map((day, idx) => {
            const tasksForDay = getTasksForDate(tasks, day);
            const isDayToday = isToday(day);

            return (
            <div
              key={idx}
              className={cn(
                "border-r border-b border-gray-700/50 p-3 flex flex-col min-h-[500px]",
                isDayToday && "bg-blue-500/5"
              )}
            >
                <div className="mb-2 shrink-0">
                  <div className={cn(
                    "text-xs font-medium uppercase text-gray-400",
                    isDayToday && "text-blue-400"
                  )}>
                    {format(day, 'EEE')}
                  </div>
                  <div className={cn(
                    "text-lg font-bold",
                    isDayToday ? "text-blue-400" : "text-white"
                  )}>
                    {format(day, 'd')}
                  </div>
                  {tasksForDay.length > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      {tasksForDay.length} task{tasksForDay.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-1 overflow-y-auto">
                  {tasksForDay.map((task: Task) => {
                    const isCompleted = isTaskCompletedForDateLocal(task, day);
                    return (
                    <div
                      key={task.id}
                      className={cn(
                        "text-xs p-2 rounded cursor-pointer transition-all",
                        isCompleted
                          ? "bg-gray-700/30 text-gray-400 line-through"
                          : "bg-blue-500/20 text-blue-300 hover:bg-blue-500/30"
                      )}
                      onClick={() => toggleTask(task.id)}
                      title={task.text}
                    >
                      <div className="flex items-center gap-1">
                        <div className="truncate flex-1">{task.text}</div>
                        {task.availableDays && task.availableDays.length > 0 && (
                          <Repeat className="h-2.5 w-2.5 text-purple-400 shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mt-0.5">
                        {task.availableDaysTime && (
                          <span>{task.availableDaysTime}</span>
                        )}
                        {task.dueDate && (
                          <span>{format(parseISO(task.dueDate), 'p')}</span>
                        )}
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    return (
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Desktop View */}
        <div className="hidden md:block min-h-full">
          <div className="grid grid-cols-7 border-l border-t border-gray-700/50" style={{ gridTemplateRows: `auto repeat(${weeks.length}, 1fr)` }}>
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="text-center font-semibold text-sm text-gray-400 py-3 border-r border-b border-gray-700/50 bg-gray-800/50"
              >
                {day}
              </div>
            ))}
            {/* Calendar days */}
            {days.map((day, idx) => {
              const tasksForDay = getTasksForDate(tasks, day);
              const isDayToday = isToday(day);
              const isCurrentMonth = isSameMonth(day, currentDate);

              return (
                <div
                  key={idx}
                  className={cn(
                    "border-r border-b border-gray-700/50 p-2 transition-colors flex flex-col min-h-[120px]",
                    isDayToday && "bg-blue-500/5",
                    !isCurrentMonth && "bg-gray-900/50 opacity-50",
                    "hover:bg-gray-800/30"
                  )}
                >
                  <div className={cn(
                    "text-sm font-medium mb-1 shrink-0",
                    isDayToday && "inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-500 text-white",
                    !isDayToday && isCurrentMonth && "text-white",
                    !isDayToday && !isCurrentMonth && "text-gray-500"
                  )}>
                    {format(day, 'd')}
                  </div>
                  <div className="flex-1 space-y-1 overflow-y-auto">
                    {tasksForDay.slice(0, 3).map((task: Task) => {
                      const isCompleted = isTaskCompletedForDateLocal(task, day);
                      return (
                      <div
                        key={task.id}
                        className={cn(
                          "text-[10px] p-1 rounded cursor-pointer truncate transition-all",
                          isCompleted
                            ? "bg-gray-700/30 text-gray-400 line-through"
                            : "bg-blue-500/20 text-blue-300 hover:bg-blue-500/30"
                        )}
                        onClick={() => toggleTask(task.id)}
                        title={task.text}
                      >
                        <div className="flex items-center gap-1">
                          <span className="truncate flex-1">{task.text}</span>
                          {task.availableDays && task.availableDays.length > 0 && (
                            <Repeat className="h-2 w-2 text-purple-400 shrink-0" />
                          )}
                        </div>
                      </div>
                      );
                    })}
                    {tasksForDay.length > 3 && (
                      <div className="text-[10px] text-gray-500 text-center">
                        +{tasksForDay.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile View - Purple Gradient Style */}
        <div className="md:hidden bg-white dark:bg-gray-900">
          {/* Purple Gradient Header */}
          <div className="relative bg-gradient-to-br from-purple-600 via-purple-500 to-purple-400 overflow-hidden">
            {/* Wavy Pattern Background */}
            <div className="absolute inset-0 opacity-20">
              <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
                <path d="M0,100 Q100,50 200,100 T400,100 L400,0 L0,0 Z" fill="white" opacity="0.1"/>
                <path d="M0,150 Q150,100 300,150 T400,150 L400,200 L0,200 Z" fill="white" opacity="0.1"/>
              </svg>
            </div>
            
            {/* Header Content */}
            <div className="relative px-4 py-6 flex items-center justify-between">
              <div>
                <div className="text-white/80 text-xs font-medium mb-0.5">
                  {format(currentDate, 'yyyy')}
                </div>
                <div className="text-white text-2xl font-bold">
                  {format(currentDate, 'MMMM')}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={() => setCurrentDate(sub(currentDate, { months: 1 }))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={() => setCurrentDate(add(currentDate, { months: 1 }))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="bg-white dark:bg-gray-900">
            {/* Week Day Headers */}
            <div className="grid grid-cols-7 px-2 pt-4 pb-2">
              {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day, idx) => (
                <div key={idx} className="text-center">
                  <div className={cn(
                    "text-xs font-semibold",
                    idx === 0 ? "text-red-500" : "text-gray-500 dark:text-gray-400"
                  )}>
                    {day}
                  </div>
                </div>
              ))}
            </div>

            {/* Calendar Dates */}
            <div className="px-2 pb-4">
              {weeks.map((week, weekIdx) => {
                // Check for consecutive days with tasks for grouping
                const weekDates = week.map(day => ({
                  day,
                  hasTasks: getTasksForDate(tasks, day).length > 0,
                  isToday: isToday(day)
                }));
                
                return (
                  <div key={weekIdx} className="grid grid-cols-7 gap-1">
                    {week.map((day, dayIdx) => {
                      const tasksForDay = getTasksForDate(tasks, day);
                      const isDayToday = isToday(day);
                      const isCurrentMonth = isSameMonth(day, currentDate);
                      const taskCount = tasksForDay.length;
                      const hasRepeatingTasks = tasksForDay.some(t => t.availableDays && t.availableDays.length > 0);
                      const hasRegularTasks = tasksForDay.some(t => !t.availableDays || t.availableDays.length === 0);
                      const hasStarredTasks = tasksForDay.some(t => t.starred);
                      
                      // Check if this day is part of a consecutive group
                      const prevDay = dayIdx > 0 ? weekDates[dayIdx - 1] : null;
                      const nextDay = dayIdx < weekDates.length - 1 ? weekDates[dayIdx + 1] : null;
                      const isInGroup = (prevDay?.hasTasks && !prevDay.isToday) || (nextDay?.hasTasks && !nextDay.isToday);
                      const isGroupStart = taskCount > 0 && !prevDay?.hasTasks && nextDay?.hasTasks && !nextDay.isToday;
                      const isGroupEnd = taskCount > 0 && prevDay?.hasTasks && !prevDay.isToday && !nextDay?.hasTasks;
                      const isGroupMiddle = taskCount > 0 && prevDay?.hasTasks && !prevDay.isToday && nextDay?.hasTasks && !nextDay.isToday;

                      // Determine circle color (priority: starred > repeating > regular)
                      let circleColor = '';
                      if (hasStarredTasks) {
                        circleColor = 'bg-orange-500';
                      } else if (hasRepeatingTasks) {
                        circleColor = 'bg-purple-500';
                      } else if (hasRegularTasks) {
                        circleColor = 'bg-red-500';
                      }

                      return (
                        <div
                          key={day.toISOString()}
                          className={cn(
                            "relative aspect-square flex items-center justify-center rounded-full transition-all",
                            !isCurrentMonth && "opacity-30",
                            taskCount > 0 && "cursor-pointer"
                          )}
                          onClick={() => {
                            if (taskCount > 0) {
                              setSelectedDayForTasks(day);
                            }
                          }}
                        >
                          {/* Date Number */}
                          <div className={cn(
                            "text-sm font-medium z-10",
                            isDayToday 
                              ? "text-white" 
                              : isCurrentMonth 
                              ? "text-gray-900 dark:text-gray-100" 
                              : "text-gray-400 dark:text-gray-600"
                          )}>
                            {format(day, 'd')}
                          </div>

                          {/* Background Circle for Today */}
                          {isDayToday && (
                            <div className="absolute inset-0 rounded-full bg-purple-600 z-0" />
                          )}

                          {/* Colored Circles for Tasks */}
                          {!isDayToday && taskCount > 0 && circleColor && (
                            <div className={cn("absolute rounded-full w-8 h-8 z-0", circleColor)} />
                          )}

                          {/* Grouped dates indicator - only show for consecutive days */}
                          {isInGroup && taskCount > 0 && !isDayToday && (
                            <div className={cn(
                              "absolute -bottom-0.5 h-1 bg-purple-300 dark:bg-purple-400/30 rounded-full",
                              isGroupStart && "left-1/2 right-0",
                              isGroupEnd && "left-0 right-1/2",
                              isGroupMiddle && "left-0 right-0"
                            )} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Today's Tasks Section */}
          {(() => {
            const dayToShow = selectedDayForTasks || today;
            const selectedDayTasks = getTasksForDate(tasks, dayToShow);
            
            return (
              <div className="bg-white dark:bg-gray-900 px-4 py-4 border-t border-gray-200 dark:border-gray-700">
                <div className="mb-3">
                  <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {selectedDayForTasks ? format(dayToShow, 'EEEE, MMMM d') : 'Today'}
                  </h3>
                </div>
                
                {selectedDayTasks.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDayTasks.map((task: Task) => {
                      const isCompleted = isTaskCompletedForDateLocal(task, dayToShow);
                      const taskTime = task.availableDaysTime || (task.dueDate ? format(parseISO(task.dueDate), 'p') : null);
                      const taskLocation = task.description || '';
                      
                      return (
                        <div
                          key={task.id}
                          className="flex items-start gap-3 cursor-pointer group"
                          onClick={() => toggleTask(task.id)}
                        >
                          {/* Purple Square Bullet */}
                          <div className="mt-0.5">
                            <div className={cn(
                              "w-2 h-2 rounded-sm",
                              isCompleted 
                                ? "bg-gray-400" 
                                : "bg-purple-500"
                            )} />
                          </div>
                          
                          {/* Task Content */}
                          <div className="flex-1 min-w-0">
                            <div className={cn(
                              "text-sm font-medium",
                              isCompleted 
                                ? "text-gray-400 line-through" 
                                : "text-gray-900 dark:text-gray-100"
                            )}>
                              {task.text}
                            </div>
                            {taskTime && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {taskTime}
                                {taskLocation && ` - ${taskLocation}`}
                              </div>
                            )}
                          </div>
                          
                          {/* Checkbox Circle */}
                          <div className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                            isCompleted
                              ? "border-purple-500 bg-purple-500"
                              : "border-gray-300 dark:border-gray-600 group-hover:border-purple-400"
                          )}>
                            {isCompleted && (
                              <svg className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
                    No tasks for this day
                  </p>
                )}
              </div>
            );
          })()}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col w-full bg-gray-900/30 rounded-xl border border-gray-700/50 overflow-hidden" style={{ height: '700px' }}>
      {/* Header */}
      <header className="flex flex-col gap-3 p-4 border-b border-gray-700/50 bg-gray-800/30 shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-xl md:text-2xl font-bold text-white">
            {getHeaderTitle()}
          </h2>
            <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 px-3 text-xs bg-gray-800 border-gray-600 hover:bg-gray-700 text-white" 
              onClick={handleToday}
            >
              Today
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8 bg-gray-800 border-gray-600 hover:bg-gray-700" 
              onClick={handlePrev}
            >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8 bg-gray-800 border-gray-600 hover:bg-gray-700" 
              onClick={handleNext}
            >
                    <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* View Mode Selector */}
        <div className="flex items-center gap-1 bg-gray-800/50 p-1 rounded-lg border border-gray-700/50 w-fit">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('day')}
            className={cn(
              "h-7 px-3 text-xs transition-all",
              viewMode === 'day' 
                ? "bg-gray-700 text-white" 
                : "text-gray-400 hover:text-white hover:bg-gray-700/50"
            )}
          >
            Day
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('week')}
            className={cn(
              "h-7 px-3 text-xs transition-all",
              viewMode === 'week' 
                ? "bg-gray-700 text-white" 
                : "text-gray-400 hover:text-white hover:bg-gray-700/50"
            )}
          >
            Week
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('month')}
            className={cn(
              "h-7 px-3 text-xs transition-all",
              viewMode === 'month' 
                ? "bg-gray-700 text-white" 
                : "text-gray-400 hover:text-white hover:bg-gray-700/50"
            )}
          >
            Month
                </Button>
            </div>
        </header>

      {/* Calendar View */}
      {viewMode === 'day' && renderDayView()}
      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'month' && renderMonthView()}
    </div>
  );
}

