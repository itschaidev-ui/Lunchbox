'use client';

import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean; // Cmd on Mac
  action: () => void;
  description?: string;
  preventDefault?: boolean;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    for (const shortcut of shortcuts) {
      const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatches = shortcut.ctrl ? event.ctrlKey : !event.ctrlKey;
      const shiftMatches = shortcut.shift ? event.shiftKey : !event.shiftKey;
      const altMatches = shortcut.alt ? event.altKey : !event.altKey;
      const metaMatches = shortcut.meta ? event.metaKey : !event.metaKey;
      
      // On Mac, treat Cmd as Ctrl for cross-platform compatibility
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlOrCmd = isMac 
        ? (shortcut.ctrl ? (event.metaKey || event.ctrlKey) : (!event.metaKey && !event.ctrlKey))
        : ctrlMatches;
      
      if (keyMatches && ctrlOrCmd && shiftMatches && altMatches && (isMac ? metaMatches : true)) {
        if (shortcut.preventDefault !== false) {
          event.preventDefault();
        }
        shortcut.action();
        break;
      }
    }
  }, [shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}

// Common keyboard shortcuts
export const COMMON_SHORTCUTS = {
  NEW_TASK: { key: 'n', ctrl: true, description: 'New task' },
  SEARCH: { key: '/', ctrl: true, description: 'Search' },
  COMMAND_PALETTE: { key: 'k', ctrl: true, description: 'Command palette' },
  ESCAPE: { key: 'Escape', description: 'Close modal/dialog' },
  SAVE: { key: 's', ctrl: true, description: 'Save' },
  DELETE: { key: 'Delete', description: 'Delete selected' },
  SELECT_ALL: { key: 'a', ctrl: true, description: 'Select all' },
  UNDO: { key: 'z', ctrl: true, description: 'Undo' },
  REDO: { key: 'y', ctrl: true, description: 'Redo' },
  TOGGLE_SIDEBAR: { key: 'b', ctrl: true, description: 'Toggle sidebar' },
};

