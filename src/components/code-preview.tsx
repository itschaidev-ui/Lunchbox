'use client';

import { useTypewriter } from '@/hooks/use-typewriter';
import { ScrollArea } from './ui/scroll-area';

interface CodePreviewProps {
  code: string;
}

export function CodePreview({ code }: CodePreviewProps) {
  const displayedCode = useTypewriter(code);

  return (
    <ScrollArea className="h-full w-full rounded-md bg-background/50">
      <pre className="p-4 text-xs font-code text-accent">
        <code className="whitespace-pre-wrap">{displayedCode}</code>
      </pre>
    </ScrollArea>
  );
}
