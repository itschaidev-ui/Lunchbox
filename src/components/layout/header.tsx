
'use client';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { PanelLeft, PanelRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { CreditsDisplay } from '@/components/credits/credits-display';

interface HeaderProps {
  leftSheetContent?: ReactNode;
  rightSheetContent?: ReactNode;
}

export function Header({ leftSheetContent, rightSheetContent }: HeaderProps) {
  return (
    <header className="h-14 md:h-16 border-b border-border flex items-center px-3 md:px-4 lg:px-6 flex-shrink-0 justify-between">
      <div className="flex items-center gap-1 md:gap-2">
        {leftSheetContent && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8 md:h-10 md:w-10">
                  <PanelLeft className="h-4 w-4 md:h-5 md:w-5" />
                  <span className="sr-only">Toggle Left Sidebar</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0">
                {leftSheetContent}
              </SheetContent>
            </Sheet>
        )}
      </div>

      <div className="flex items-center gap-2 md:gap-4 ml-auto">
        <CreditsDisplay />
        
        {rightSheetContent && (
          <Sheet>
              <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8 md:h-10 md:w-10">
                  <PanelRight className="h-4 w-4 md:h-5 md:w-5" />
                  <span className="sr-only">Toggle Right Sidebar</span>
              </Button>
              </SheetTrigger>
              <SheetContent side="right" className="p-0">
                  {rightSheetContent}
              </SheetContent>
          </Sheet>
        )}
      </div>
    </header>
  );
}
