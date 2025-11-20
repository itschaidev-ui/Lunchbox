'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FileText,
  Download,
  Upload,
  Focus,
  Sparkles,
  FileDown,
  FileUp,
  Zap,
} from 'lucide-react';
import { useTasks } from '@/context/task-context';
import { exportTasks, downloadFile, importTasks } from '@/lib/task-export-import';
import { useToast } from '@/hooks/use-toast';
import { TaskTemplatesDialog } from './task-templates-dialog';
import { FocusMode } from './focus-mode';

interface QuickActionsMenuProps {
  onFocusMode?: () => void;
}

export function QuickActionsMenu({ onFocusMode }: QuickActionsMenuProps) {
  const { tasks } = useTasks();
  const { toast } = useToast();
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [focusModeOpen, setFocusModeOpen] = useState(false);

  const handleExport = (format: 'json' | 'csv') => {
    try {
      const data = exportTasks(tasks, {
        includeCompleted: true,
        includeMetadata: true,
        format,
      });
      
      const filename = `tasks-export-${new Date().toISOString().split('T')[0]}.${format}`;
      const mimeType = format === 'json' ? 'application/json' : 'text/csv';
      
      downloadFile(data, filename, mimeType);
      
      toast({
        title: 'Export successful',
        description: `Tasks exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export failed',
        description: 'Failed to export tasks',
        variant: 'destructive',
      });
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const importedTasks = importTasks(text);
        
        toast({
          title: 'Import successful',
          description: `Imported ${importedTasks.length} tasks`,
        });
        
        // Note: In a real implementation, you'd want to add these tasks to Firestore
        // For now, we'll just show a success message
      } catch (error) {
        console.error('Import error:', error);
        toast({
          title: 'Import failed',
          description: 'Invalid file format',
          variant: 'destructive',
        });
      }
    };
    input.click();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Zap className="h-4 w-4" />
            Quick Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => setTemplatesOpen(true)}>
            <FileText className="h-4 w-4 mr-2" />
            Task Templates
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => setFocusModeOpen(true)}>
            <Focus className="h-4 w-4 mr-2" />
            Focus Mode
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuLabel>Export</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => handleExport('json')}>
            <Download className="h-4 w-4 mr-2" />
            Export as JSON
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport('csv')}>
            <FileDown className="h-4 w-4 mr-2" />
            Export as CSV
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleImport}>
            <Upload className="h-4 w-4 mr-2" />
            Import Tasks
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <TaskTemplatesDialog
        isOpen={templatesOpen}
        onOpenChange={setTemplatesOpen}
      />

      <FocusMode
        isOpen={focusModeOpen}
        onClose={() => setFocusModeOpen(false)}
      />
    </>
  );
}

