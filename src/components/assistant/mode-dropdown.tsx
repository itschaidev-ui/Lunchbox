'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, Code, Target, Calendar, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModeDropdownProps {
  activeTab: 'message' | 'code' | 'canvas' | 'plan';
  onTabChange: (tab: 'message' | 'code' | 'canvas' | 'plan') => void;
}

const modes = [
  { 
    id: 'code' as const, 
    label: 'Code', 
    icon: <Code className="h-4 w-4" />,
    color: 'bg-blue-500',
    hoverColor: 'hover:bg-blue-600',
    textColor: 'text-blue-100'
  },
  { 
    id: 'canvas' as const, 
    label: 'Canvas', 
    icon: <Target className="h-4 w-4" />,
    color: 'bg-purple-500',
    hoverColor: 'hover:bg-purple-600',
    textColor: 'text-purple-100'
  },
  { 
    id: 'plan' as const, 
    label: 'Plan', 
    icon: <Calendar className="h-4 w-4" />,
    color: 'bg-green-500',
    hoverColor: 'hover:bg-green-600',
    textColor: 'text-green-100'
  },
];

export function ModeDropdown({ activeTab, onTabChange }: ModeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleModeSelect = (modeId: 'code' | 'canvas' | 'plan') => {
    onTabChange(modeId);
    setIsOpen(false);
  };

  const handleResetToAuto = () => {
    onTabChange('message');
    setIsOpen(false);
  };

  const isAutoDetect = activeTab === 'message';
  const selectedMode = modes.find(mode => mode.id === activeTab);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Mode Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
          isAutoDetect 
            ? "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white" 
            : selectedMode 
              ? `${selectedMode.color} ${selectedMode.textColor} ${selectedMode.hoverColor}`
              : "bg-gray-600 text-gray-400 hover:bg-gray-500 hover:text-gray-300"
        )}
      >
        {isAutoDetect ? (
          <>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Auto</span>
          </>
        ) : selectedMode ? (
          <>
            {selectedMode.icon}
            {selectedMode.label}
          </>
        ) : (
          <Plus className="h-4 w-4" />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-10 left-0 z-50 bg-gray-800 border border-gray-700 rounded-lg shadow-lg py-1 min-w-[120px]">
          {!isAutoDetect && (
            <button
              type="button"
              onClick={handleResetToAuto}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium transition-all duration-200 bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              Auto Detect
            </button>
          )}
          {modes.map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => handleModeSelect(mode.id)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-sm font-medium transition-all duration-200",
                mode.color,
                mode.hoverColor,
                mode.textColor,
                "hover:scale-[1.02] active:scale-[0.98]"
              )}
            >
              {mode.icon}
              {mode.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
