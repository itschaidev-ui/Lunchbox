'use client';

import { LottieLoader } from './lottie-loader';

interface LoadingScreenProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  children?: React.ReactNode;
}

export function LoadingScreen({ 
  message = 'Loading...', 
  size = 'lg',
  className = '',
  children
}: LoadingScreenProps) {
  return (
    <div className={`flex flex-col items-center justify-center min-h-screen bg-background ${className}`}>
      <div className="flex flex-col items-center space-y-4">
        <LottieLoader size={size} />
        <p className="text-muted-foreground text-sm font-medium animate-pulse">
          {message}
        </p>
        {children}
      </div>
    </div>
  );
}

export function LoadingSpinner({ 
  message, 
  size = 'md',
  className = '' 
}: LoadingScreenProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <div className="flex flex-col items-center space-y-3">
        <LottieLoader size={size} />
        {message && (
          <p className="text-muted-foreground text-sm font-medium animate-pulse">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
