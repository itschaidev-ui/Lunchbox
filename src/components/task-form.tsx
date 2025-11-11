'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Star, Tag, Sparkles, Loader2, Paperclip, X as XIcon, File, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useRef, useState } from 'react';
import { useTasks } from '@/context/task-context';
import { Textarea } from './ui/textarea';
import { assignTagColors, generateRandomHexColor, getTagStyles } from '@/lib/tag-colors';
import { Badge } from './ui/badge';
import { X, Plus } from 'lucide-react';

const formSchema = z.object({
  text: z.string().min(1, { message: 'Task cannot be empty.' }),
  description: z.string().optional(),
  dueDate: z.date().optional(),
  dueTime: z.string().optional(),
  tags: z.string().optional(), // Comma-separated tags
  starred: z.boolean().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface TaskFormProps {
  onCancel: () => void;
}

export function TaskForm({ onCancel }: TaskFormProps) {
  const { addTask } = useTasks();
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [tags, setTags] = useState<Array<{ name: string; color: string }>>([]);
  const [tagInput, setTagInput] = useState('');
  const [attachments, setAttachments] = useState<Array<{ id: string; fileName: string; fileType: string; fileUrl: string; fileSize: number }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: '',
      description: '',
      dueDate: undefined,
      dueTime: '',
      tags: '',
      starred: false,
    },
  });

  const timeInputRef = useRef<HTMLInputElement>(null);

  // Get default time (round up to next hour)
  const getDefaultTime = (): string => {
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setHours(now.getHours() + 1);
    nextHour.setMinutes(0);
    nextHour.setSeconds(0);
    
    const hours = nextHour.getHours().toString().padStart(2, '0');
    const minutes = nextHour.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Add tag function
  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.some(t => t.name === trimmedTag)) {
      const newTag = {
        name: trimmedTag,
        color: generateRandomHexColor(),
      };
      setTags([...tags, newTag]);
      setTagInput('');
    }
  };

  // Remove tag function
  const handleRemoveTag = (tagName: string) => {
    setTags(tags.filter(t => t.name !== tagName));
  };

  // Handle Enter key in tag input
  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  // Handle file attachment
  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    console.log('📎 Files selected:', files.length);
    
    files.forEach(file => {
      console.log('📄 Processing file:', {
        name: file.name,
        type: file.type,
        size: file.size,
        sizeKB: (file.size / 1024).toFixed(2) + ' KB'
      });
      
      // Firestore has 1MB document limit, base64 increases size by ~33%
      // So max file size should be ~700KB to stay under 1MB after encoding
      const maxSize = 700 * 1024; // 700KB
      
      if (file.size > maxSize) {
        const fileSizeKB = (file.size / 1024).toFixed(0);
        alert(
          `❌ File Too Large\n\n` +
          `File: ${file.name}\n` +
          `Size: ${fileSizeKB} KB\n` +
          `Limit: 700 KB\n\n` +
          `💡 Solutions:\n` +
          `• Compress the PDF online\n` +
          `• Use a smaller file\n` +
          `• Split into multiple smaller files\n\n` +
          `Images and small PDFs work best!`
        );
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const estimatedSize = base64String.length;
        const estimatedKB = (estimatedSize / 1024).toFixed(0);
        
        console.log(`📊 File encoded: ${file.name}, Base64 size: ${estimatedKB} KB`);
        
        // Double check after encoding
        if (estimatedSize > 900 * 1024) {
          alert(
            `❌ File Too Large After Encoding\n\n` +
            `File: ${file.name}\n` +
            `Encoded size: ${estimatedKB} KB\n` +
            `Limit: 900 KB\n\n` +
            `This file is too large even after compression.\n` +
            `Please use a smaller file or compress it further.`
          );
          return;
        }
        
        const newAttachment = {
          id: `${Date.now()}-${Math.random()}`,
          fileName: file.name,
          fileType: file.type || 'application/octet-stream',
          fileUrl: base64String,
          fileSize: file.size,
        };
        console.log('✅ Attachment added:', newAttachment.fileName, newAttachment.fileType);
        setAttachments(prev => [...prev, newAttachment]);
      };
      
      reader.onerror = (error) => {
        console.error('❌ Error reading file:', file.name, error);
        alert(`Failed to read file: ${file.name}`);
      };
      
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleAISuggest = async () => {
    const taskText = form.getValues('text');
    
    if (!taskText || taskText.trim().length === 0) {
      alert('Please enter a task name first!');
      return;
    }

    setIsGeneratingSuggestions(true);
    
    try {
      const response = await fetch('/api/suggest-task-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskText })
      });

      if (!response.ok) {
        throw new Error('Failed to generate suggestions');
      }

      const data = await response.json();
      
      // Update form with AI suggestions
      if (data.cleanTaskName) {
        form.setValue('text', data.cleanTaskName);
      }
      if (data.description) {
        form.setValue('description', data.description);
      }
      if (data.tags && data.tags.length > 0) {
        // Convert AI suggested tags to tag objects with random colors
        const suggestedTags = data.tags.map((tagName: string) => ({
          name: tagName,
          color: generateRandomHexColor(),
        }));
        setTags(suggestedTags);
      }
      if (data.dueDate) {
        try {
          const dueDate = new Date(data.dueDate);
          form.setValue('dueDate', dueDate);
          // Extract time from the date
          const hours = dueDate.getHours().toString().padStart(2, '0');
          const minutes = dueDate.getMinutes().toString().padStart(2, '0');
          form.setValue('dueTime', `${hours}:${minutes}`);
        } catch (e) {
          console.error('Error parsing due date:', e);
        }
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
      alert('Failed to generate suggestions. Please try again.');
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  const handleSubmit = (values: FormValues) => {
    let finalDueDate: Date | undefined = values.dueDate;

    if (values.dueDate && values.dueTime) {
      const [hours, minutes] = values.dueTime.split(':').map(Number);
      const newDate = new Date(values.dueDate);
      newDate.setHours(hours, minutes);
      finalDueDate = newDate;
    }

    // Use the tags array with colors
    const tagNames = tags.length > 0 ? tags.map(t => t.name) : undefined;
    const tagColors = tags.length > 0 
      ? tags.reduce((acc, tag) => ({ ...acc, [tag.name]: tag.color }), {})
      : undefined;

    const taskData = {
      text: values.text,
      description: values.description,
      // Store the due date with timezone information
      dueDate: finalDueDate?.toISOString(),
      // Store user's timezone for proper notification scheduling
      userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      tags: tagNames,
      tagColors: tagColors,
      starred: values.starred || false,
      attachments: attachments.length > 0 ? attachments.map(att => ({
        id: att.id,
        fileName: att.fileName,
        fileType: att.fileType,
        fileUrl: att.fileUrl,
        fileSize: att.fileSize,
        uploadedAt: new Date().toISOString()
      })) : undefined,
    };

    console.log('Creating task with data:', taskData);
    addTask(taskData);
    form.reset();
    setTags([]);
    setTagInput('');
    setAttachments([]);
    onCancel();
  };

  return (
    <div className="mobile-card p-4 mb-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="text"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between mb-2">
                  <FormLabel className="mobile-body font-medium">Task</FormLabel>
                  {/* AI Suggest Button - Moved to header */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleAISuggest}
                    disabled={isGeneratingSuggestions || !form.watch('text')}
                    className="h-7 px-2 text-xs bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:text-purple-200 transition-all"
                  >
                    {isGeneratingSuggestions ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI Suggest
                      </>
                    )}
                  </Button>
                </div>
                <FormControl>
                  <Input 
                    placeholder="Enter a new task..." 
                    className="mobile-input"
                    {...field} 
                  />
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
                <FormLabel className="mobile-body font-medium">Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Add a description (optional)..." 
                    className="mobile-textarea"
                    {...field} 
                    rows={3} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
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
                              'mobile-button w-full sm:w-[200px] justify-start text-left font-normal',
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
                              // Set default time if not already set
                              if (!form.getValues('dueTime')) {
                                form.setValue('dueTime', getDefaultTime());
                              }
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
                            className="mobile-input w-full sm:w-[120px]" 
                            {...field}
                            ref={timeInputRef}
                            disabled={!form.watch('dueDate')}
                          />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          
          {/* Tags Field */}
          <div className="space-y-2">
            <FormLabel className="mobile-body font-medium flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Tags
            </FormLabel>
            
            {/* Tag Input */}
            <div className="flex gap-2">
              <Input
                placeholder="Type a tag name..."
                className="mobile-input flex-1"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTag}
                disabled={!tagInput.trim()}
                className="shrink-0"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Tag
              </Button>
            </div>
            
            {/* Display Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => {
                  const styles = getTagStyles(tag.color);
                  return (
                    <Badge
                      key={tag.name}
                      variant="secondary"
                      className="text-xs px-2 py-1 border font-medium flex items-center gap-1"
                      style={{
                        backgroundColor: styles.backgroundColor,
                        color: styles.color,
                        borderColor: styles.borderColor,
                      }}
                    >
                      {tag.name}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag.name)}
                        className="ml-1 hover:opacity-70"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          {/* Attachments */}
          <div className="space-y-2">
            <FormLabel className="mobile-body font-medium flex items-center gap-2">
              <Paperclip className="h-4 w-4" />
              Attachments
              <span className="text-xs text-gray-500 font-normal">(Max 700 KB per file)</span>
            </FormLabel>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx,.zip,.rar"
              onChange={handleFileChange}
              className="hidden"
            />
            
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleFileSelect}
                className="w-full"
              >
                <Paperclip className="h-4 w-4 mr-2" />
                Add Files
              </Button>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <p className="text-xs text-blue-300 flex items-start gap-2">
                  <span className="text-blue-400 shrink-0">ℹ️</span>
                  <span>
                    <strong>File size limit: 700 KB per file</strong><br/>
                    Images and small PDFs work best. Large PDFs may need compression.
                  </span>
                </p>
              </div>
            </div>
            
            {/* Display Attachments */}
            {attachments.length > 0 && (
              <div className="space-y-2 mt-2">
                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center gap-2 p-2 bg-gray-800 rounded-lg border border-gray-700"
                  >
                    {attachment.fileType.startsWith('image/') ? (
                      <ImageIcon className="h-4 w-4 text-blue-400 shrink-0" />
                    ) : (
                      <File className="h-4 w-4 text-gray-400 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-200 truncate">{attachment.fileName}</p>
                      <p className="text-xs text-gray-400">{formatFileSize(attachment.fileSize)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(attachment.id)}
                      className="p-1 hover:bg-red-500/20 rounded transition-colors"
                    >
                      <XIcon className="h-4 w-4 text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Starred Checkbox */}
          <FormField
            control={form.control}
            name="starred"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0">
                <FormControl>
                  <button
                    type="button"
                    onClick={() => field.onChange(!field.value)}
                    className="flex items-center gap-2 hover:bg-gray-800 p-2 rounded transition-colors"
                  >
                    <Star 
                      className={cn(
                        "h-5 w-5 transition-colors",
                        field.value ? "fill-yellow-400 text-yellow-400" : "text-gray-400"
                      )} 
                    />
                    <span className="text-sm text-gray-300">
                      {field.value ? "Starred" : "Star this task"}
                    </span>
                  </button>
                </FormControl>
              </FormItem>
            )}
          />

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 justify-end">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={onCancel}
              className="mobile-button hover-scale transition-buttery"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="mobile-button hover-lift hover-glow transition-buttery"
            >
              Add Task
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
