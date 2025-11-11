import { CheckSquare, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ThemePreviewProps {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  name: string;
}

export function ThemePreview({ colors, name }: ThemePreviewProps) {
  return (
    <div className="w-full rounded-lg border border-border bg-background overflow-hidden">
      {/* Mini Navbar */}
      <div 
        className="px-4 py-3 border-b flex items-center justify-between"
        style={{ 
          background: `linear-gradient(to right, ${colors.primary}15, ${colors.secondary}15)`,
          borderColor: `${colors.primary}30`
        }}
      >
        <div className="flex items-center gap-2">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: colors.primary }}
          >
            <CheckSquare className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-foreground">{name} Preview</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            className="text-xs"
            style={{ 
              backgroundColor: `${colors.accent}20`,
              color: colors.accent,
              borderColor: `${colors.accent}40`
            }}
          >
            Theme Demo
          </Badge>
        </div>
      </div>

      {/* Mini Task Header */}
      <div className="px-4 py-3 bg-card/50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Tasks</h3>
          <Button 
            size="sm" 
            className="h-7 text-xs text-white"
            style={{ backgroundColor: colors.primary }}
          >
            <Plus className="h-3 w-3 mr-1" />
            New Task
          </Button>
        </div>

        {/* Mini Search Bar */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tasks..."
            disabled
            className="w-full pl-7 pr-3 py-1.5 text-xs rounded-md border bg-background text-foreground"
            style={{ borderColor: `${colors.primary}30` }}
          />
        </div>
      </div>

      {/* Mini Task List */}
      <div className="px-4 py-3 space-y-2">
        {/* Task Item 1 */}
        <div 
          className="flex items-center gap-3 p-2.5 rounded-lg border"
          style={{ 
            borderColor: `${colors.primary}20`,
            backgroundColor: `${colors.primary}05`
          }}
        >
          <div 
            className="w-4 h-4 rounded border-2 flex-shrink-0"
            style={{ borderColor: colors.primary }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground">Complete project wireframes</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge 
                className="text-[10px] px-1.5 py-0"
                style={{ 
                  backgroundColor: `${colors.accent}20`,
                  color: colors.accent
                }}
              >
                Work
              </Badge>
              <span className="text-[10px] text-muted-foreground">Due today</span>
            </div>
          </div>
        </div>

        {/* Task Item 2 */}
        <div 
          className="flex items-center gap-3 p-2.5 rounded-lg border opacity-60"
          style={{ 
            borderColor: `${colors.secondary}20`,
            backgroundColor: `${colors.secondary}05`
          }}
        >
          <div 
            className="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0"
            style={{ 
              borderColor: colors.secondary,
              backgroundColor: colors.secondary
            }}
          >
            <CheckSquare className="h-3 w-3 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground line-through">Review client feedback</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge 
                className="text-[10px] px-1.5 py-0"
                style={{ 
                  backgroundColor: `${colors.primary}20`,
                  color: colors.primary
                }}
              >
                Urgent
              </Badge>
            </div>
          </div>
        </div>

        {/* Task Item 3 */}
        <div 
          className="flex items-center gap-3 p-2.5 rounded-lg border"
          style={{ 
            borderColor: `${colors.accent}20`,
            backgroundColor: `${colors.accent}05`
          }}
        >
          <div 
            className="w-4 h-4 rounded border-2 flex-shrink-0"
            style={{ borderColor: colors.accent }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground">Update documentation</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge 
                className="text-[10px] px-1.5 py-0"
                style={{ 
                  backgroundColor: `${colors.secondary}20`,
                  color: colors.secondary
                }}
              >
                Personal
              </Badge>
              <span className="text-[10px] text-muted-foreground">Tomorrow</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mini Footer Stats */}
      <div 
        className="px-4 py-2 border-t bg-card/30"
        style={{ borderColor: `${colors.primary}20` }}
      >
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>3 tasks</span>
          <span>1 completed</span>
          <span style={{ color: colors.accent }}>2 active</span>
        </div>
      </div>
    </div>
  );
}

