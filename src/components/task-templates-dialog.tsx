'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/auth-context';
import { getUserTaskTemplates, createTaskTemplate, deleteTaskTemplate, type TaskTemplate } from '@/lib/firebase-task-templates';
import { FileText, Plus, Trash2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTasks } from '@/context/task-context';

interface TaskTemplatesDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate?: (template: TaskTemplate) => void;
}

export function TaskTemplatesDialog({ isOpen, onOpenChange, onSelectTemplate }: TaskTemplatesDialogProps) {
  const { user } = useAuth();
  const { addTask } = useTasks();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    text: '',
    description: '',
    tags: [] as string[],
  });

  useEffect(() => {
    if (isOpen && user?.uid) {
      loadTemplates();
    }
  }, [isOpen, user?.uid]);

  const loadTemplates = async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    try {
      const userTemplates = await getUserTaskTemplates(user.uid);
      setTemplates(userTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load templates',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!user?.uid || !newTemplate.name || !newTemplate.text) {
      toast({
        title: 'Error',
        description: 'Name and task text are required',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);
    try {
      await createTaskTemplate(user.uid, {
        name: newTemplate.name,
        text: newTemplate.text,
        description: newTemplate.description,
        tags: newTemplate.tags,
      });
      
      toast({
        title: 'Success',
        description: 'Template created successfully',
      });
      
      setNewTemplate({ name: '', text: '', description: '', tags: [] });
      loadTemplates();
    } catch (error) {
      console.error('Error creating template:', error);
      toast({
        title: 'Error',
        description: 'Failed to create template',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await deleteTaskTemplate(templateId);
      toast({
        title: 'Success',
        description: 'Template deleted',
      });
      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete template',
        variant: 'destructive',
      });
    }
  };

  const handleUseTemplate = (template: TaskTemplate) => {
    if (onSelectTemplate) {
      onSelectTemplate(template);
    } else {
      // Create task from template
      addTask({
        text: template.text,
        description: template.description,
        tags: template.tags,
      });
      
      toast({
        title: 'Task created',
        description: `Created task from template "${template.name}"`,
      });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Task Templates
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Create New Template */}
          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-sm">Create New Template</h3>
            <div className="space-y-2">
              <div>
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  placeholder="e.g., Daily Standup"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="template-text">Task Text</Label>
                <Input
                  id="template-text"
                  placeholder="Task title..."
                  value={newTemplate.text}
                  onChange={(e) => setNewTemplate({ ...newTemplate, text: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="template-description">Description (optional)</Label>
                <Textarea
                  id="template-description"
                  placeholder="Task description..."
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                  rows={3}
                />
              </div>
              <Button
                onClick={handleCreateTemplate}
                disabled={isCreating || !newTemplate.name || !newTemplate.text}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </div>
          </div>

          {/* Templates List */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Your Templates</h3>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading templates...</div>
            ) : templates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border rounded-lg">
                No templates yet. Create one above!
              </div>
            ) : (
              <div className="space-y-2">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="border rounded-lg p-3 flex items-start justify-between hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium">{template.name}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{template.text}</p>
                      {template.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {template.description}
                        </p>
                      )}
                      {template.tags && template.tags.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {template.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUseTemplate(template)}
                      >
                        <Sparkles className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

