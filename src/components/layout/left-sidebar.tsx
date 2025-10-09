
'use client';

import Link from 'next/link';
import { Anvil, FolderKanban, Home, LayoutDashboard, Settings, Star, Trash2, Folder, ChevronDown, ChevronRight, Sparkles, CheckSquare, FileText } from 'lucide-react';
import type { Tool, Project } from '@/lib/types';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';
import Image from 'next/image';

interface LeftSidebarProps {
  tools: Tool[];
  storageUsed: number;
  onToolSelect: (tool: Tool) => void;
  onDeleteTool: (toolId: string) => void;
  favoriteProjects?: Project[];
  isCollapsed?: boolean;
}

export function LeftSidebar({ tools, storageUsed, onToolSelect, onDeleteTool, favoriteProjects = [], isCollapsed = false }: LeftSidebarProps) {
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(true);
  
  const customTools = tools.filter(t => !t.isPremade);
  const premadeTools = tools.filter(t => t.isPremade);

  const renderToolItem = (tool: Tool) => (
    <div key={tool.id} className="group flex items-center">
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={cn("w-full justify-start text-muted-foreground hover:text-foreground flex-1", isCollapsed && "justify-center px-0")}
                onClick={() => onToolSelect(tool)}
              >
                <span className={cn("truncate", isCollapsed && "hidden")}>{tool.name}</span>
                {isCollapsed && <span className="sr-only">{tool.name}</span>}
              </Button>
          </TooltipTrigger>
          {isCollapsed && <TooltipContent side="right">{tool.name}</TooltipContent>}
        </Tooltip>
      </TooltipProvider>

      {!tool.isPremade && !isCollapsed && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
          onClick={() => onDeleteTool(tool.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
  
  const NavLink = ({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) => (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
            <Button variant="ghost" className={cn("w-full justify-start text-muted-foreground hover:text-foreground", isCollapsed && "justify-center")} asChild>
              <Link href={href}>
                <Icon className={cn(!isCollapsed && "mr-2", "h-4 w-4")} /> <span className={cn(isCollapsed && "hidden")}>{label}</span>
              </Link>
            </Button>
        </TooltipTrigger>
        {isCollapsed && <TooltipContent side="right">{label}</TooltipContent>}
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <aside className={cn("bg-card border-r border-border flex flex-col transition-all duration-300", isCollapsed ? "w-[72px]" : "w-64")}>
      <div className={cn("p-4 border-b border-border flex items-center gap-2 h-16", isCollapsed ? 'justify-center px-2' : 'justify-start')}>
        <Image src="https://cdn.discordapp.com/attachments/1063641662925701120/1254117395065012224/logo-lunchbox.png?ex=667856d9&is=66770559&hm=df33994358356b69b00713b1907727103f13f5a5e3f19385959959663f733e85&" alt="Lunchbox AI" width={isCollapsed ? 36 : 100} height={25} />
      </div>

      <nav className={cn("p-2", isCollapsed && "px-2.5")}>
        <NavLink href="/" icon={Home} label="Home" />
        <NavLink href="/tasks" icon={CheckSquare} label="Tasks" />
        <NavLink href="/assistant" icon={Sparkles} label="Assistant" />
        <NavLink href="/docs" icon={FileText} label="Events" />
      </nav>

      {favoriteProjects.length > 0 && (
        <>
          <Separator />
          <div className={cn("p-4", isCollapsed && "px-0")}>
            <h2 className={cn("text-sm font-headline uppercase text-muted-foreground tracking-widest mb-2 px-2", isCollapsed && "hidden")}>Favorites</h2>
             <div className={cn(isCollapsed && "px-2.5")}>
              {favoriteProjects.map(project => (
                 <TooltipProvider key={project.id} delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" className={cn("w-full justify-start text-muted-foreground hover:text-foreground", isCollapsed && "justify-center")} asChild>
                          <Link href={`/projects/${project.id}`}>
                            <Star className={cn("h-4 w-4 text-yellow-500 fill-yellow-500", !isCollapsed && "mr-2")} /> 
                            <span className={cn("truncate", isCollapsed && "hidden")}>{project.name}</span>
                          </Link>
                        </Button>
                      </TooltipTrigger>
                      {isCollapsed && <TooltipContent side="right">{project.name}</TooltipContent>}
                    </Tooltip>
                 </TooltipProvider>
              ))}
            </div>
          </div>
        </>
      )}

      <Separator />
      <div className="flex-1" />

      <div className="p-4 border-t border-border">
         <NavLink href="/settings" icon={Settings} label="Settings" />
      </div>
    </aside>
  );
}
