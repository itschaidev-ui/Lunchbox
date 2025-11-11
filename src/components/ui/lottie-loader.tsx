'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface LottieLoaderProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function LottieLoader({ className = '', size = 'md' }: LottieLoaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [useFallback, setUseFallback] = useState(false);
  const animationRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Set a timeout to use fallback if animation doesn't load quickly
    timeoutRef.current = setTimeout(() => {
      if (!useFallback && animationRef.current === null) {
        console.warn('Lottie animation timeout, using fallback spinner');
        setUseFallback(true);
      }
    }, 2000); // 2 second timeout

    const loadLottie = async () => {
      if (!containerRef.current || useFallback) return;

      try {
        // Load Lottie library dynamically
        const lottie = await import('lottie-web');
        
        // Try to load animation with error handling for CORS
        try {
          const animation = lottie.default.loadAnimation({
            container: containerRef.current,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            path: 'https://lottie.host/embed/71a51ac1-39ad-4f95-b928-9b5949c35149/h9XOr4hadV.lottie',
            rendererSettings: {
              preserveAspectRatio: 'xMidYMid meet'
            }
          });

          animationRef.current = animation;

          // Clear timeout if animation loads successfully
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }

          // Listen for errors
          animation.addEventListener('data_failed', () => {
            console.warn('Lottie animation failed to load, using fallback spinner');
            setUseFallback(true);
            if (animationRef.current) {
              animationRef.current.destroy();
              animationRef.current = null;
            }
          });

          // Also listen for DOMLoaded to ensure it actually loaded
          animation.addEventListener('DOMLoaded', () => {
            // Animation loaded successfully
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
          });
        } catch (loadError) {
          // CORS or loading error - use fallback
          console.warn('Lottie animation load error, using fallback');
          setUseFallback(true);
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
        }
      } catch (error) {
        // Library import error - use fallback
        console.warn('Failed to load Lottie library, using fallback');
        setUseFallback(true);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      }
    };

    loadLottie();

    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (animationRef.current) {
        animationRef.current.destroy();
        animationRef.current = null;
      }
    };
  }, [useFallback]);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  // Always show fallback spinner if useFallback is true, or if container is empty
  return (
    <div 
      ref={containerRef}
      className={`${sizeClasses[size]} ${className} flex items-center justify-center`}
      aria-label="Loading animation"
    >
      {useFallback && (
        <Loader2 className={`${iconSizes[size]} animate-spin text-primary`} />
      )}
    </div>
  );
}
