
'use client';

import { useState } from 'react';
import { LeftSidebar } from '@/components/layout/left-sidebar';
import { Workspace } from '@/components/workspace';
import type { Tool, GeneratedCode } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { premadeWidgets } from '@/lib/premade-widgets';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { cn } from '@/lib/utils';
import { Header } from '@/components/layout/header';
import { Anvil } from 'lucide-react';

export default function WorkspacePage() {
  const [workspaceTools, setWorkspaceTools] = useState<Tool[]>(premadeWidgets);

  const { toast } = useToast();
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);

  const handleDeleteTool = (toolId: string) => {
    setWorkspaceTools(prev => prev.filter(t => t.id !== toolId));
    toast({ title: 'Widget Removed', description: `A widget was removed from your workspace.` });
  };

  const leftSidebar = (
    <LeftSidebar 
      tools={premadeWidgets}
      storageUsed={0}
      onToolSelect={() => {}}
      onDeleteTool={handleDeleteTool}
      isCollapsed={leftPanelCollapsed}
    />
  );
  
  const rightSidebar = (
     <aside className="w-96 bg-card border-l border-border flex flex-col p-4">
        <div className="flex-1 flex flex-col min-h-0 items-center justify-center text-center text-muted-foreground">
            <Anvil className="h-12 w-12 mb-4" />
            <h3 className="font-headline text-lg">AI Toolsmith is Offline</h3>
            <p className="text-sm">The AI widget generator is temporarily unavailable. Please check back later.</p>
        </div>
      </aside>
  );

  return (
    <div className="flex h-screen flex-col">
       <Header leftSheetContent={leftSidebar} rightSheetContent={rightSidebar} />
        <main className="flex-1 overflow-hidden hidden md:flex">
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel
              defaultSize={20}
              minSize={15}
              maxSize={25}
              collapsible
              collapsedSize={4}
              onCollapse={() => setLeftPanelCollapsed(true)}
              onExpand={() => setLeftPanelCollapsed(false)}
              className={cn("min-w-[50px] transition-all duration-300 ease-in-out", leftPanelCollapsed && "min-w-[72px]")}
            >
              {leftSidebar}
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={55}>
                <Workspace
                  tools={workspaceTools}
                  onDeleteTool={handleDeleteTool}
                />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={25} minSize={20} maxSize={30} collapsible collapsedSize={0} className="min-w-[320px]">
              {rightSidebar}
            </ResizablePanel>
          </ResizablePanelGroup>
        </main>
        <div className="flex-1 overflow-y-auto bg-background p-4 md:hidden">
            <Workspace
                tools={workspaceTools}
                onDeleteTool={handleDeleteTool}
            />
        </div>
    </div>
  );
}
