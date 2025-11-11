'use client';

import { cn } from '@/lib/utils';

interface BadgeIndicatorProps {
  count: number;
  color?: 'destructive' | 'primary' | 'secondary' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function BadgeIndicator({ 
  count, 
  color = 'destructive', 
  size = 'md',
  className 
}: BadgeIndicatorProps) {
  if (count === 0) return null;

  const sizeClasses = {
    sm: 'h-4 w-4 text-xs',
    md: 'h-5 w-5 text-xs',
    lg: 'h-6 w-6 text-sm'
  };

  const colorClasses = {
    destructive: 'bg-destructive text-destructive-foreground',
    primary: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    accent: 'bg-accent text-accent-foreground'
  };

  return (
    <div 
      className={cn(
        'absolute -top-1 -right-1 rounded-full flex items-center justify-center animate-pulse shadow-sm',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
    >
      {count > 9 ? '9+' : count}
    </div>
  );
}
