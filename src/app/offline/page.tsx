'use client';

import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OfflinePage() {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="p-6 bg-gray-800 rounded-full">
            <WifiOff className="h-16 w-16 text-gray-400" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">You're Offline</h1>
          <p className="text-gray-400">
            It looks like you've lost your internet connection. Don't worry, your tasks are safe!
          </p>
        </div>

        <div className="space-y-4">
          <Button 
            onClick={handleRefresh}
            className="w-full"
            size="lg"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          
          <p className="text-sm text-gray-500">
            Once you're back online, everything will sync automatically.
          </p>
        </div>
      </div>
    </div>
  );
}

