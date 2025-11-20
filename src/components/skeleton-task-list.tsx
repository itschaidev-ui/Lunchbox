'use client';

import { Skeleton } from './ui/skeleton';

export function SkeletonTaskList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex items-start gap-3 p-4 rounded-lg border border-gray-700/50 bg-gray-800/30"
        >
          <Skeleton className="h-5 w-5 rounded border-2" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      ))}
    </div>
  );
}

