'use client';

import type { Project } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface ProjectItemProps {
  project: Project;
  onToggleFavorite: (id: string) => void;
}

export function ProjectItem({ project, onToggleFavorite }: ProjectItemProps) {
  return (
    <div className="relative group">
      <Link href={`/projects/${project.id}`} className="block h-full">
        <div className="h-full p-6 bg-card border border-border rounded-lg hover:bg-card/80 hover:border-primary/50 transition-all">
          <h3 className="text-lg font-headline font-semibold text-foreground mb-2">
            {project.name}
          </h3>
          <p className="text-muted-foreground text-sm">{project.description}</p>
        </div>
      </Link>
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(project.id);
        }}
        className="absolute top-3 right-3 h-8 w-8 text-muted-foreground hover:text-yellow-500"
      >
        <Star className={cn('h-5 w-5', project.isFavorite && 'fill-yellow-500 text-yellow-500')} />
      </Button>
    </div>
  );
}
