
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
import { CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { Calendar } from './ui/calendar';

const formSchema = z.object({
  text: z.string().min(1, { message: 'Task cannot be empty.' }),
  description: z.string().optional(),
  dueDate: z.date().optional(),
  dueTime: z.string().optional(),
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
