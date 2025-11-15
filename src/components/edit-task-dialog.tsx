
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from './ui/textarea';
import { useTasks } from '@/context/task-context';
import type { Task } from '@/lib/types';
import { useEffect, useRef, useState } from 'react';
import { CalendarIcon, Star, Tag as TagIcon, X, Repeat } from 'lucide-react';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { Calendar } from './ui/calendar';

const formSchema = z.object({
  text: z.string().min(1, { message: 'Task cannot be empty.' }),
  description: z.string().optional(),
  dueDate: z.date().optional(),
  dueTime: z.string().optional(),
  availableDays: z.array(z.number()).optional(), // Days of week (0=Sunday, 1=Monday, ..., 6=Saturday)
  tags: z.array(z.string()).optional(),
  starred: z.boolean().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditTaskDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  task: Task | null;
}

export function EditTaskDialog({ isOpen, onOpenChange, task }: EditTaskDialogProps) {
  const { editTask } = useTasks();
  const timeInputRef = useRef<HTMLInputElement>(null);
  const [dateMode, setDateMode] = useState<'date' | 'days'>(() => {
    // Determine mode based on task data
    if (task?.availableDays && task.availableDays.length > 0) {
      return 'days';
    }
    return 'date';
  });
  const [selectedDays, setSelectedDays] = useState<number[]>(() => task?.availableDays || []);
  const [daysTime, setDaysTime] = useState<string>(() => task?.availableDaysTime || '09:00');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: '',
      description: '',
      dueDate: undefined,
      dueTime: '',
      tags: [],
      starred: false,
    },
  });
  
  useEffect(() => {
    if (task && isOpen) {
        const dueDate = task.dueDate ? parseISO(task.dueDate) : undefined;
        const hasAvailableDays = task.availableDays && task.availableDays.length > 0;
        setDateMode(hasAvailableDays ? 'days' : 'date');
        setSelectedDays(task.availableDays || []);
        setDaysTime(task.availableDaysTime || '09:00');
        form.reset({
            text: task.text,
            description: task.description || '',
            dueDate: dueDate,
            dueTime: dueDate ? format(dueDate, 'HH:mm') : '',
            availableDays: task.availableDays || [],
            tags: task.tags || [],
            starred: task.starred || false,
        })
    }
  }, [task, form, isOpen]);

  if (!task) return null;

  const handleManualSubmit = (values: FormValues) => {
    let finalDueDate: Date | undefined = values.dueDate;

    if (values.dueDate) {
        finalDueDate = new Date(values.dueDate);
        finalDueDate.setSeconds(0, 0); // Clear seconds/ms
        if (values.dueTime) {
            const [hours, minutes] = values.dueTime.split(':').map(Number);
            finalDueDate.setHours(hours, minutes);
        } else {
             // If date is set but time is cleared, set time to midnight
            finalDueDate.setHours(0, 0, 0, 0);
        }
    }

    editTask(task.id, {
        text: values.text,
        description: values.description,
        dueDate: dateMode === 'date' ? finalDueDate?.toISOString() : undefined,
        availableDays: dateMode === 'days' && selectedDays.length > 0 ? selectedDays : undefined,
        availableDaysTime: dateMode === 'days' && selectedDays.length > 0 && daysTime ? daysTime : undefined,
        tags: values.tags,
        starred: values.starred,
    });
    onOpenChange(false);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>
            Make changes to your task here.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleManualSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add a detailed description..."
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-col gap-2">
              {/* Mode Toggle */}
              <div className="flex gap-2 p-1 bg-gray-800/50 rounded-lg border border-gray-700">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDateMode('date');
                    form.setValue('dueDate', undefined);
                    setSelectedDays([]);
                  }}
                  className={cn(
                    'flex-1 transition-all duration-200',
                    dateMode === 'date'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-sm'
                      : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'
                  )}
                >
                  <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
                  <span className="text-xs sm:text-sm">Date</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDateMode('days');
                    form.setValue('dueDate', undefined);
                    form.setValue('dueTime', '');
                  }}
                  className={cn(
                    'flex-1 transition-all duration-200',
                    dateMode === 'days'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-sm'
                      : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'
                  )}
                >
                  <Repeat className="h-3.5 w-3.5 mr-1.5" />
                  <span className="text-xs sm:text-sm">Days</span>
                </Button>
              </div>

              {/* Date Picker Mode */}
              {dateMode === 'date' && (
                <div className="flex items-center gap-2">
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Due Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={'outline'}
                              className={cn(
                                'w-[200px] justify-start text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={(date) => {
                                field.onChange(date);
                                setTimeout(() => timeInputRef.current?.focus(), 0);
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dueTime"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Time</FormLabel>
                        <FormControl>
                          <Input 
                            type="time" 
                            className="w-[120px]" 
                            {...field}
                            ref={timeInputRef}
                            disabled={!form.watch('dueDate')}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Days of Week Mode */}
              {dateMode === 'days' && (
                <div className="flex flex-col gap-3">
                  <FormLabel className="text-sm font-medium">Available Days</FormLabel>
                  <div className="flex gap-1.5 sm:gap-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => {
                      const dayNumber = index === 0 ? 0 : index === 6 ? 6 : index; // Sunday=0, Monday=1, etc.
                      const isSelected = selectedDays.includes(dayNumber);
                      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                      return (
                        <Button
                          key={index}
                          type="button"
                          variant={isSelected ? 'default' : 'outline'}
                          size="sm"
                          className={cn(
                            'h-10 w-10 sm:h-11 sm:w-11 p-0 flex-shrink-0 transition-all duration-200',
                            isSelected 
                              ? 'bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-md shadow-purple-500/30 scale-105' 
                              : 'border-gray-600 hover:border-purple-500/50 hover:bg-purple-500/10 text-gray-400 hover:text-purple-300',
                            'font-semibold text-sm sm:text-base'
                          )}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedDays(selectedDays.filter(d => d !== dayNumber));
                            } else {
                              setSelectedDays([...selectedDays, dayNumber].sort());
                            }
                          }}
                          title={dayNames[dayNumber]}
                        >
                          {day}
                        </Button>
                      );
                    })}
                  </div>
                  {selectedDays.length > 0 && (
                    <div className="flex items-center gap-2 px-2 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                      <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
                      <p className="text-xs sm:text-sm text-purple-300 font-medium">
                        Available on: <span className="text-purple-200">{selectedDays.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ')}</span>
                      </p>
                    </div>
                  )}
                  {selectedDays.length === 0 && (
                    <p className="text-xs text-muted-foreground px-2">
                      Select days when this task should be available
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Tags Field */}
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <TagIcon className="h-4 w-4" />
                    Tags
                  </FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Input
                        placeholder="Add a tag and press Enter"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const value = e.currentTarget.value.trim();
                            if (value && !field.value?.includes(value)) {
                              field.onChange([...(field.value || []), value]);
                              e.currentTarget.value = '';
                            }
                          }
                        }}
                        className="bg-gray-800 border-gray-700"
                      />
                      {field.value && field.value.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {field.value.map((tag, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="flex items-center gap-1 bg-blue-500/20 text-blue-300 border-blue-500/30"
                            >
                              {tag}
                              <button
                                type="button"
                                onClick={() => {
                                  field.onChange(field.value?.filter((_, i) => i !== idx));
                                }}
                                className="ml-1 hover:opacity-70"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Starred Field */}
            <FormField
              control={form.control}
              name="starred"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="flex items-center gap-2 cursor-pointer">
                      <Star className={cn("h-4 w-4", field.value && "fill-yellow-400 text-yellow-400")} />
                      Mark as Important (Starred)
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
