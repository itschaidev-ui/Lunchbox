
'use client';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { PanelLeft, PanelRight } from 'lucide-react';
import type { ReactNode } from 'react';

interface HeaderProps {
  leftSheetContent?: ReactNode;
  rightSheetContent?: ReactNode;
}

export function Header({ leftSheetContent, rightSheetContent }: HeaderProps) {
  return (
    <header className="h-16 border-b border-border flex items-center px-4 md:px-6 flex-shrink-0 justify-between">
      <div className="flex items-center gap-2">
        {leftSheetContent && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden">
                  <PanelLeft className="h-5 w-5" />
                  <span className="sr-only">Toggle Left Sidebar</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0">
                {leftSheetContent}
              </SheetContent>
            </Sheet>
        )}
      </div>

      <div className="flex items-center gap-4 ml-auto">
        {rightSheetContent && (
          <Sheet>
              <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                  <PanelRight className="h-5 w-5" />
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
