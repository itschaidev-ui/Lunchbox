'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useRef } from 'react';
import { useTasks } from '@/context/task-context';
import { Textarea } from './ui/textarea';

const formSchema = z.object({
  text: z.string().min(1, { message: 'Task cannot be empty.' }),
  description: z.string().optional(),
  dueDate: z.date().optional(),
  dueTime: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface TaskFormProps {
  onCancel: () => void;
}

export function TaskForm({ onCancel }: TaskFormProps) {
  const { addTask } = useTasks();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: '',
      description: '',
      dueDate: undefined,
      dueTime: '',
    },
  });

  const timeInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (values: FormValues) => {
    let finalDueDate: Date | undefined = values.dueDate;

    if (values.dueDate && values.dueTime) {
      const [hours, minutes] = values.dueTime.split(':').map(Number);
      const newDate = new Date(values.dueDate);
      newDate.setHours(hours, minutes);
      finalDueDate = newDate;
    }

    addTask({
      text: values.text,
      description: values.description,
      dueDate: finalDueDate?.toISOString(),
    });
    form.reset();
    onCancel();
  };

  return (
    <div className="bg-card p-4 rounded-lg border mb-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="text"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">Task</FormLabel>
                <FormControl>
                  <Input placeholder="Enter a new task..." {...field} />
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
                <FormLabel className="sr-only">Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="Add a description (optional)..." {...field} rows={3} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-between items-center gap-2">
            <div className="flex items-center gap-2">
               <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
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
                              // Auto-focus time input when date is selected
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
                    <FormItem>
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
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit">Add Task</Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
