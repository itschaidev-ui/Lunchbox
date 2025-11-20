'use client';

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { useRouter } from 'next/navigation';
import { Search, Home, CheckSquare, Sparkles, FileText, Settings, Calendar, Kanban, Users, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useKeyboardShortcuts, COMMON_SHORTCUTS } from '@/hooks/use-keyboard-shortcuts';

interface CommandAction {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  action: () => void;
  keywords?: string[];
  category?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onNewTask?: () => void;
}

export function CommandPalette({ isOpen, onOpenChange, onNewTask }: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const router = useRouter();

  // Define all available commands
  const commands: CommandAction[] = useMemo(() => [
    // Navigation
    {
      id: 'home',
      label: 'Go to Home',
      icon: Home,
      action: () => { router.push('/'); onOpenChange(false); },
      keywords: ['home', 'dashboard'],
      category: 'Navigation',
    },
    {
      id: 'tasks',
      label: 'Go to Tasks',
      icon: CheckSquare,
      action: () => { router.push('/tasks'); onOpenChange(false); },
      keywords: ['tasks', 'todo'],
      category: 'Navigation',
    },
    {
      id: 'assistant',
      label: 'Go to Assistant',
      icon: Sparkles,
      action: () => { router.push('/assistant'); onOpenChange(false); },
      keywords: ['assistant', 'ai', 'chat'],
      category: 'Navigation',
    },
    {
      id: 'docs',
      label: 'Go to Events',
      icon: FileText,
      action: () => { router.push('/docs'); onOpenChange(false); },
      keywords: ['docs', 'events', 'documentation'],
      category: 'Navigation',
    },
    {
      id: 'settings',
      label: 'Go to Settings',
      icon: Settings,
      action: () => { router.push('/settings'); onOpenChange(false); },
      keywords: ['settings', 'preferences', 'config'],
      category: 'Navigation',
    },
    {
      id: 'calendar',
      label: 'Open Calendar',
      icon: Calendar,
      action: () => { router.push('/tasks?tab=calendar'); onOpenChange(false); },
      keywords: ['calendar', 'schedule'],
      category: 'Navigation',
    },
    {
      id: 'kanban',
      label: 'Open Kanban',
      icon: Kanban,
      action: () => { router.push('/tasks?tab=kanban'); onOpenChange(false); },
      keywords: ['kanban', 'board'],
      category: 'Navigation',
    },
    {
      id: 'collabs',
      label: 'Go to Collaborations',
      icon: Users,
      action: () => { router.push('/collabs'); onOpenChange(false); },
      keywords: ['collabs', 'collaboration', 'team'],
      category: 'Navigation',
    },
    
    // Actions
    {
      id: 'new-task',
      label: 'Create New Task',
      icon: Plus,
      action: () => {
        if (onNewTask) {
          onNewTask();
        } else {
          router.push('/tasks');
          window.dispatchEvent(new CustomEvent('open-new-task-form'));
        }
        onOpenChange(false);
      },
      keywords: ['new', 'create', 'add', 'task'],
      category: 'Actions',
    },
  ], [router, onOpenChange, onNewTask]);

  // Filter commands based on search
  const filteredCommands = useMemo(() => {
    if (!search.trim()) return commands;
    
    const searchLower = search.toLowerCase();
    return commands.filter(cmd => {
      const labelMatch = cmd.label.toLowerCase().includes(searchLower);
      const keywordMatch = cmd.keywords?.some(kw => kw.toLowerCase().includes(searchLower));
      return labelMatch || keywordMatch;
    });
  }, [commands, search]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandAction[]> = {};
    filteredCommands.forEach(cmd => {
      const category = cmd.category || 'Other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  // Keyboard shortcut to open command palette
  useKeyboardShortcuts([
    {
      ...COMMON_SHORTCUTS.COMMAND_PALETTE,
      action: () => onOpenChange(true),
    },
  ]);

  // Reset search when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setSearch('');
    }
  }, [isOpen]);

  // Handle command selection
  const handleSelect = (commandId: string) => {
    const command = commands.find(cmd => cmd.id === commandId);
    if (command) {
      command.action();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
        <Command className="rounded-lg border-0">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              placeholder="Type a command or search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-0 focus-visible:ring-0"
              autoFocus
            />
            <button
              onClick={() => onOpenChange(false)}
              className="ml-2 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <CommandList className="max-h-[400px] overflow-y-auto">
            <CommandEmpty>No results found.</CommandEmpty>
            {Object.entries(groupedCommands).map(([category, categoryCommands]) => (
              <CommandGroup key={category} heading={category}>
                {categoryCommands.map((command) => {
                  const Icon = command.icon;
                  return (
                    <CommandItem
                      key={command.id}
                      value={command.id}
                      onSelect={handleSelect}
                      className="cursor-pointer"
                    >
                      {Icon && <Icon className="mr-2 h-4 w-4" />}
                      <span>{command.label}</span>
                      {command.keywords && command.keywords.length > 0 && (
                        <span className="ml-auto text-xs text-muted-foreground">
                          {command.keywords[0]}
                        </span>
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ))}
          </CommandList>
          <div className="flex items-center border-t px-3 py-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  <span className="text-xs">↑</span>
                  <span className="text-xs">↓</span>
                </kbd>
                <span>Navigate</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  Enter
                </kbd>
                <span>Select</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  Esc
                </kbd>
                <span>Close</span>
              </div>
            </div>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

