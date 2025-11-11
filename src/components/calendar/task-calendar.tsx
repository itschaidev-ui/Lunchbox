'use client';

import { useState } from 'react';
import type { Task } from '@/lib/types';
import { format, isSameDay, parseISO, startOfToday, add, sub, startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, endOfMonth, isToday, isSameMonth } from 'date-fns';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type ViewMode = 'day' | 'week' | 'month';

interface TaskCalendarProps {
    tasks: Task[];
    toggleTask: (id: string) => void;
}

export function TaskCalendar({ tasks, toggleTask }: TaskCalendarProps) {
  const today = startOfToday();
  const [currentDate, setCurrentDate] = useState(today);
  const [viewMode, setViewMode] = useState<ViewMode>('month');

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
    const tasksForDay = tasks.filter((task: Task) => 
      task.dueDate && isSameDay(parseISO(task.dueDate), currentDate)
    );

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
              {tasksForDay.map((task: Task) => (
                <div
                  key={task.id}
                  className={cn(
                    "p-4 rounded-lg border transition-all cursor-pointer",
                    task.completed
                      ? "bg-gray-800/30 border-gray-700/50"
                      : "bg-gray-800/50 border-gray-700 hover:bg-gray-800/70"
                  )}
                  onClick={() => toggleTask(task.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5",
                      task.completed ? "bg-gray-600 border-gray-600" : "border-gray-600"
                    )}>
                      {task.completed && (
                        <svg className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={cn(
                        "font-medium",
                        task.completed ? "line-through text-gray-400" : "text-white"
                      )}>
                        {task.text}
                      </p>
                      {task.description && (
                        <p className="text-sm text-gray-400 mt-1">{task.description}</p>
                      )}
                      {task.dueDate && (
                        <p className="text-xs text-gray-500 mt-1">
                          {format(parseISO(task.dueDate), 'p')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
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
            const tasksForDay = tasks.filter((task: Task) => 
              task.dueDate && isSameDay(parseISO(task.dueDate), day)
            );
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
                  {tasksForDay.map((task: Task) => (
                    <div
                      key={task.id}
                      className={cn(
                        "text-xs p-2 rounded cursor-pointer transition-all",
                        task.completed
                          ? "bg-gray-700/30 text-gray-400 line-through"
                          : "bg-blue-500/20 text-blue-300 hover:bg-blue-500/30"
                      )}
                      onClick={() => toggleTask(task.id)}
                      title={task.text}
                    >
                      <div className="truncate">{task.text}</div>
                      {task.dueDate && (
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          {format(parseISO(task.dueDate), 'p')}
                        </div>
                      )}
                    </div>
                  ))}
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
              const tasksForDay = tasks.filter((task: Task) => 
                task.dueDate && isSameDay(parseISO(task.dueDate), day)
              );
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
                    {tasksForDay.slice(0, 3).map((task: Task) => (
                      <div
                        key={task.id}
                        className={cn(
                          "text-[10px] p-1 rounded cursor-pointer truncate transition-all",
                          task.completed
                            ? "bg-gray-700/30 text-gray-400 line-through"
                            : "bg-blue-500/20 text-blue-300 hover:bg-blue-500/30"
                        )}
                        onClick={() => toggleTask(task.id)}
                        title={task.text}
                      >
                        {task.text}
                      </div>
                    ))}
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

        {/* Mobile View - Notion-style */}
        <div className="md:hidden p-4 space-y-2">
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="space-y-2">
              {week.map((day) => {
                const tasksForDay = tasks.filter((task: Task) => 
                  task.dueDate && isSameDay(parseISO(task.dueDate), day)
                );
                const isDayToday = isToday(day);
                const isCurrentMonth = isSameMonth(day, currentDate);

                // Only show days with tasks or current day on mobile
                if (!isDayToday && tasksForDay.length === 0) return null;

                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "rounded-lg border p-3 transition-all",
                      isDayToday 
                        ? "bg-blue-500/10 border-blue-500/50" 
                        : "bg-gray-800/50 border-gray-700/50",
                      !isCurrentMonth && "opacity-50"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "text-sm font-medium",
                          isDayToday ? "text-blue-400" : "text-gray-400"
                        )}>
                          {format(day, 'EEE')}
                        </div>
                        <div className={cn(
                          "text-lg font-bold",
                          isDayToday ? "text-blue-400" : "text-white"
                        )}>
                          {format(day, 'd')}
                        </div>
                      </div>
                      {tasksForDay.length > 0 && (
                        <div className="flex items-center gap-1">
                          {tasksForDay.slice(0, 5).map((task) => (
                            <div
                              key={task.id}
                              className={cn(
                                "h-2 w-2 rounded-full",
                                task.completed ? "bg-gray-600" : "bg-blue-500"
                              )}
                            />
                          ))}
                          {tasksForDay.length > 5 && (
                            <span className="text-xs text-gray-500 ml-1">
                              +{tasksForDay.length - 5}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {tasksForDay.length > 0 && (
                      <div className="space-y-1.5">
                        {tasksForDay.map((task: Task) => (
                          <div
                            key={task.id}
                            className={cn(
                              "text-sm p-2 rounded cursor-pointer transition-all",
                              task.completed
                                ? "bg-gray-700/30 text-gray-400 line-through"
                                : "bg-blue-500/20 text-blue-300"
                            )}
                            onClick={() => toggleTask(task.id)}
                          >
                            {task.text}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
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
