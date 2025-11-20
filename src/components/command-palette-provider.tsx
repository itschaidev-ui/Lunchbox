'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { CommandPalette } from './command-palette';
import { useRouter } from 'next/navigation';

interface CommandPaletteContextType {
  open: () => void;
  close: () => void;
  isOpen: boolean;
}

const CommandPaletteContext = createContext<CommandPaletteContextType | undefined>(undefined);

export function useCommandPalette() {
  const context = useContext(CommandPaletteContext);
  if (!context) {
    throw new Error('useCommandPalette must be used within CommandPaletteProvider');
  }
  return context;
}

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  const handleNewTask = () => {
    router.push('/tasks');
    // Dispatch event to open task form
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('open-new-task-form'));
    }, 100);
  };

  return (
    <CommandPaletteContext.Provider value={{ open, close, isOpen }}>
      {children}
      <CommandPalette 
        isOpen={isOpen} 
        onOpenChange={setIsOpen}
        onNewTask={handleNewTask}
      />
    </CommandPaletteContext.Provider>
  );
}

