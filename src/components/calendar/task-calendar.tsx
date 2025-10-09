
'use client';

import { useState } from 'react';
import type { Task } from '@/lib/types';
import { format, isSameDay, parseISO, startOfToday, add, sub } from 'date-fns';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Calendar as UICalendar } from '@/components/ui/calendar';
import { ScrollArea } from '../ui/scroll-area';

const DayComponent = ({ date, ...props }: { date: Date; displayMonth: Date }) => {
    const { tasks } = props as any;
    const tasksForDay = tasks.filter((task: Task) => task.dueDate && isSameDay(parseISO(task.dueDate), date));
  
    return (
      <div className="h-28 flex flex-col p-1 relative border-t border-r border-border">
        <time dateTime={date.toISOString()} className="text-xs text-right pr-1">{format(date, 'd')}</time>
        <div className="flex-1 overflow-y-auto mt-1 space-y-1 px-1">
          {tasksForDay.map((task: Task) => (
            <div key={task.id} className="text-xs bg-primary/20 text-primary-foreground p-1 rounded-sm truncate">
              {task.text}
            </div>
          ))}
        </div>
      </div>
    );
};

interface TaskCalendarProps {
    tasks: Task[];
    toggleTask: (id: string) => void;
}

export function TaskCalendar({ tasks, toggleTask }: TaskCalendarProps) {
  const today = startOfToday();
  const [currentMonth, setCurrentMonth] = useState(today);

  const handlePrevMonth = () => {
    setCurrentMonth(sub(currentMonth, { months: 1 }));
  };

  const handleNextMonth = () => {
    setCurrentMonth(add(currentMonth, { months: 1 }));
  };
  
  const handleToday = () => {
    setCurrentMonth(today);
  }

  return (
    <div className="bg-card border rounded-lg flex flex-col w-full max-w-4xl max-h-[80vh] overflow-hidden">
        <header className="p-4 flex items-center justify-between border-b shrink-0">
            <h2 className="text-lg font-headline">{format(currentMonth, 'MMMM yyyy')}</h2>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleToday}>Today</Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={handlePrevMonth}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleNextMonth}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </header>
        <ScrollArea>
            <UICalendar
                mode="single"
                selected={today}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                components={{
                Day: (props) => <DayComponent {...props} tasks={tasks} />,
                }}
                className="p-0 [&_td]:p-0 [&_tr]:border-b [&_thead]:text-xs [&_thead]:text-muted-foreground"
                classNames={{
                    months: 'flex flex-col',
                    month: 'flex-1 flex flex-col',
                    table: 'w-full h-full border-collapse flex-1 flex flex-col',
                    head_row: 'grid grid-cols-7',
                    head_cell: 'text-center font-normal border-b py-2',
                    row: 'grid grid-cols-7 flex-1',
                    cell: 'flex-1',
                    day: 'w-full h-full',
                    day_selected: '',
                    day_today: 'bg-primary/10',
                    day_outside: 'text-muted-foreground/50',
                }}
            />
        </ScrollArea>
    </div>
  );
}
