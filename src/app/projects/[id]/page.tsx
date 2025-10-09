'use client';

import { useParams } from 'next/navigation';
import { LeftSidebar } from '@/components/layout/left-sidebar';
import { Header } from '@/components/layout/header';
import { useState } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { cn } from '@/lib/utils';
import { TooltipProvider } from '@/components/ui/tooltip';

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);

  const sidebar = (
    <TooltipProvider>
     <LeftSidebar 
        tools={[]}
        storageUsed={0}
        onToolSelect={() => {}}
        onDeleteTool={() => {}}
        favoriteProjects={[]}
        isCollapsed={leftPanelCollapsed}
      />
    </TooltipProvider>
  );
  
  const projectContent = (
    <div className="flex-1 flex flex-col p-8 bg-background overflow-y-auto">
      <header className="mb-8">
        <h1 className="text-4xl font-headline font-bold text-foreground">
          Project: {id}
        </h1>
        <p className="text-muted-foreground mt-2">
          This is where you'll manage your individual project.
        </p>
      </header>
    </div>
  );

  return (
    <div className="flex h-screen flex-col">
       <Header leftSheetContent={sidebar} />
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
                  {sidebar}
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={80}>
                {projectContent}
              </ResizablePanel>
          </ResizablePanelGroup>
       </main>
       <div className="flex-1 overflow-y-auto bg-background p-4 md:hidden">
        {projectContent}
      </div>
    </div>
  );
}
