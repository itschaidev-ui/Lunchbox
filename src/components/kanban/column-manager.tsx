'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Settings, Plus, Trash2, GripVertical,
  CheckCircle, Clock, AlertCircle, Target, Flag, Zap, Star,
  Calendar, TrendingUp, Award, Briefcase, Coffee, Heart,
  Shield, Rocket, Users, Activity, Layers, Archive
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { KanbanColumn } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { saveKanbanColumns } from '@/lib/firebase-user-preferences';

// Available icons for selection
const AVAILABLE_ICONS = [
  { name: 'Clock', icon: Clock, color: 'text-blue-500' },
  { name: 'AlertCircle', icon: AlertCircle, color: 'text-orange-500' },
  { name: 'CheckCircle', icon: CheckCircle, color: 'text-green-500' },
  { name: 'Target', icon: Target, color: 'text-purple-500' },
  { name: 'Flag', icon: Flag, color: 'text-red-500' },
  { name: 'Zap', icon: Zap, color: 'text-yellow-500' },
  { name: 'Star', icon: Star, color: 'text-amber-500' },
  { name: 'Calendar', icon: Calendar, color: 'text-indigo-500' },
  { name: 'TrendingUp', icon: TrendingUp, color: 'text-emerald-500' },
  { name: 'Award', icon: Award, color: 'text-pink-500' },
  { name: 'Briefcase', icon: Briefcase, color: 'text-cyan-500' },
  { name: 'Coffee', icon: Coffee, color: 'text-amber-600' },
  { name: 'Heart', icon: Heart, color: 'text-rose-500' },
  { name: 'Shield', icon: Shield, color: 'text-blue-600' },
  { name: 'Rocket', icon: Rocket, color: 'text-violet-500' },
  { name: 'Users', icon: Users, color: 'text-teal-500' },
  { name: 'Activity', icon: Activity, color: 'text-lime-500' },
  { name: 'Layers', icon: Layers, color: 'text-slate-500' },
  { name: 'Archive', icon: Archive, color: 'text-gray-500' },
];

// Default columns
export const DEFAULT_COLUMNS: KanbanColumn[] = [
  { id: 'todo', title: 'Queue', icon: 'Clock', color: 'text-blue-500', order: 0, isDefault: true },
  { id: 'completed', title: 'Done', icon: 'CheckCircle', color: 'text-green-500', order: 999, isDefault: true },
];

interface ColumnManagerProps {
  columns: KanbanColumn[];
  onColumnsChange: (columns: KanbanColumn[]) => void;
}

export function ColumnManager({ columns, onColumnsChange }: ColumnManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<string>('AlertCircle');
  const [selectedColor, setSelectedColor] = useState<string>('text-orange-500');
  const { user } = useAuth();

  const handleAddColumn = async () => {
    if (!newColumnTitle.trim()) return;
    
    // Warn user if they have many columns
    if (columns.length >= 5 && columns.length < 10) {
      if (!window.confirm('⚠️ You have several columns already. Adding more columns may make your board harder to navigate and organize. Continue?')) {
        return;
      }
    } else if (columns.length >= 10) {
      if (!window.confirm('⚠️ Warning: You have 10+ columns! This will make your board very wide and difficult to manage, especially on smaller screens. Are you sure you want to continue?')) {
        return;
      }
    }

    const newColumn: KanbanColumn = {
      id: `custom-${Date.now()}`,
      title: newColumnTitle.trim(),
      icon: selectedIcon,
      color: selectedColor,
      order: columns.length - 1, // Insert before "Done" column
      isDefault: false,
    };

    // Insert before the last column (Done)
    const updatedColumns = [
      ...columns.slice(0, -1),
      newColumn,
      columns[columns.length - 1],
    ].map((col, idx) => ({ ...col, order: idx }));

    onColumnsChange(updatedColumns);
    
    // Save to Firebase if user is logged in
    if (user) {
      try {
        await saveKanbanColumns(user.uid, updatedColumns);
      } catch (error) {
        console.error('Failed to save columns to Firebase:', error);
      }
    }
    
    setNewColumnTitle('');
    setSelectedIcon('AlertCircle');
    setSelectedColor('text-orange-500');
  };

  const handleDeleteColumn = async (columnId: string) => {
    const column = columns.find(c => c.id === columnId);
    if (column?.isDefault) return;
    
    if (columns.length <= 2) {
      alert('You must have at least 2 columns');
      return;
    }

    if (!window.confirm(`Delete "${column?.title}" column? Tasks will be moved to Queue.`)) return;

    const updatedColumns = columns
      .filter(c => c.id !== columnId)
      .map((col, idx) => ({ ...col, order: idx }));

    onColumnsChange(updatedColumns);
    
    // Save to Firebase if user is logged in
    if (user) {
      try {
        await saveKanbanColumns(user.uid, updatedColumns);
      } catch (error) {
        console.error('Failed to save columns to Firebase:', error);
      }
    }
    
    // Dispatch event to notify task components to move tasks from deleted column
    window.dispatchEvent(new CustomEvent('column-deleted', { 
      detail: { columnId } 
    }));
  };

  const getIconComponent = (iconName: string) => {
    const iconData = AVAILABLE_ICONS.find(i => i.name === iconName);
    return iconData ? iconData.icon : Clock;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300 hover:text-white"
        >
          <Settings className="h-4 w-4 mr-2" />
          Manage Columns
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-700">
          <DialogTitle className="text-white">Manage Kanban Columns</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-6 pb-4">
            {/* Current Columns */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-300">Current Columns</h3>
              {columns.map((column) => {
                const IconComponent = getIconComponent(column.icon);
                return (
                  <Card key={column.id} className="bg-gray-800/50 border-gray-700 p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <GripVertical className="h-4 w-4 text-gray-500" />
                        <IconComponent className={`h-5 w-5 ${column.color}`} />
                        <div>
                          <p className="text-sm font-medium text-white">{column.title}</p>
                          {column.isDefault && (
                            <p className="text-xs text-gray-500">Default column</p>
                          )}
                        </div>
                      </div>
                      {!column.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteColumn(column.id)}
                          className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Add New Column */}
            <div className="space-y-4 pt-4 border-t border-gray-700">
              <h3 className="text-sm font-semibold text-gray-300">Add New Column</h3>
              
              <div className="space-y-2">
                <Label htmlFor="columnTitle" className="text-gray-300">Column Title</Label>
                <Input
                  id="columnTitle"
                  value={newColumnTitle}
                  onChange={(e) => setNewColumnTitle(e.target.value)}
                  placeholder="e.g., In Review, Testing, Blocked"
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Select Icon</Label>
                <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
                  {AVAILABLE_ICONS.map(({ name, icon: Icon, color }) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => {
                        setSelectedIcon(name);
                        setSelectedColor(color);
                      }}
                      className={`h-12 w-12 flex items-center justify-center rounded-lg border-2 transition-all active:scale-95 ${
                        selectedIcon === name
                          ? 'border-primary bg-primary/10'
                          : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${color}`} />
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleAddColumn}
                disabled={!newColumnTitle.trim()}
                className="w-full bg-primary hover:bg-primary/90 text-white font-semibold h-12 text-base active:scale-95 transition-transform"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Column
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

