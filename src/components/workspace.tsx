
'use client';

import { cn } from '@/lib/utils';
import type { Tool } from '@/lib/types';
import { Anvil, X } from 'lucide-react';
import { ToolPreview } from './tool-preview';
import { Button } from './ui/button';

interface WorkspaceProps {
  tools: Tool[];
  onDeleteTool: (toolId: string) => void;
}

export function Workspace({ tools, onDeleteTool }: WorkspaceProps) {
  if (tools.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 bg-background">
        <div className="text-center">
          <Anvil className="mx-auto h-16 w-16 text-muted-foreground/50" strokeWidth={1} />
          <h2 className="mt-4 text-2xl font-headline">Your workspace is empty</h2>
          <p className="mt-2 text-muted-foreground">
            The AI Toolsmith is currently offline. You can still use premade widgets.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-4 overflow-auto bg-background">
      {tools.map(tool => (
        <div
          key={tool.id}
          className="relative group rounded-lg transition-all"
        >
          <div className="p-2 bg-card border rounded-lg shadow-sm">
            <ToolPreview code={tool.code} />
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-0 right-0 h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteTool(tool.id);
            }}
          >
            <X className="h-4 w-4" />
          </Button>

        </div>
      ))}
    </div>
  );
}
