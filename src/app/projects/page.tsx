'use client';

import { useState } from 'react';
import { LeftSidebar } from '@/components/layout/left-sidebar';
import { Button } from '@/components/ui/button';
import { PlusCircle, Book, School } from 'lucide-react';
import type { Project } from '@/lib/types';
import { ProjectItem } from '@/components/project-item';
import { Header } from '@/components/layout/header';
import { cn } from '@/lib/utils';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';

const templates = [
  {
    name: 'School Planner',
    icon: School,
    description: 'Organize your classes, assignments, and study schedule.',
  },
  {
    name: 'Personal Diary',
    icon: Book,
    description: 'A private space for your thoughts and reflections.',
  },
];

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);

  const handleNewProject = () => {
    const newProject: Project = {
      id: `project-${Date.now()}`,
      name: 'Untitled Project',
      description: 'Add a description...',
      tags: [],
      isFavorite: false,
    };
    setProjects(prev => [newProject, ...prev]);
  };

  const handleToggleFavorite = (projectId: string) => {
    setProjects(prev =>
      prev.map(p => (p.id === projectId ? { ...p, isFavorite: !p.isFavorite } : p))
    );
  };
  
  const favoriteProjects = projects.filter(p => p.isFavorite);

  const sidebar = (
    <LeftSidebar 
      tools={[]}
      storageUsed={0}
      onToolSelect={() => {}}
      onDeleteTool={() => {}}
      favoriteProjects={favoriteProjects}
      isCollapsed={leftPanelCollapsed}
    />
  );

  const projectContent = (
     <div className="flex-1 flex flex-col p-8 bg-background overflow-y-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-headline font-bold text-foreground">
            Projects
          </h1>
          <p className="text-muted-foreground mt-2">
            Create and manage your workspaces.
          </p>
        </header>

        <div className="mb-8">
          <Button size="lg" onClick={handleNewProject}>
            <PlusCircle className="mr-2 h-5 w-5" />
            New Project
          </Button>
        </div>

        <div className="mb-12">
          <h2 className="text-lg font-headline font-semibold text-muted-foreground mb-4">
            Templates
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(template => (
              <div key={template.name} className="p-4 bg-card border rounded-lg hover:bg-card/80 cursor-pointer transition-colors">
                <template.icon className="h-6 w-6 mb-2 text-primary" />
                <h3 className="font-semibold text-foreground">{template.name}</h3>
                <p className="text-sm text-muted-foreground">{template.description}</p>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h2 className="text-lg font-headline font-semibold text-muted-foreground mb-4">
            All Projects
          </h2>
          {projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map(project => (
                <ProjectItem
                  key={project.id}
                  project={project}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
              <p className="text-muted-foreground">No projects yet.</p>
              <p className="text-sm text-muted-foreground">Click "New Project" to get started.</p>
            </div>
          )}
        </div>
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
