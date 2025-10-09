
'use client';

import { Anvil } from 'lucide-react';

export function RightSidebar() {
  return (
    <aside className="w-96 bg-card border-l border-border flex flex-col p-4">
        <div className="flex-1 flex flex-col min-h-0 items-center justify-center text-center text-muted-foreground">
            <Anvil className="h-12 w-12 mb-4" />
            <h3 className="font-headline text-lg">AI Toolsmith is Offline</h3>
            <p className="text-sm">The AI widget generator is temporarily unavailable. Please check back later.</p>
        </div>
      </aside>
  );
}
