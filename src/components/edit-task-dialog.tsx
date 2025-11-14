
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
import { useEffect, useRef } from 'react';
import { CalendarIcon, Star, Tag as TagIcon, X } from 'lucide-react';
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
        form.reset({
            text: task.text,
            description: task.description || '',
            dueDate: dueDate,
            dueTime: dueDate ? format(dueDate, 'HH:mm') : '',
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
        dueDate: finalDueDate?.toISOString(),
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
