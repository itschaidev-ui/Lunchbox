'use client';

import { useEffect, useRef, useState } from 'react';

interface ScrollAnimationProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  animation?: 'fadeInUp' | 'slideInLeft' | 'slideInRight' | 'scaleIn';
  duration?: number;
}

export function ScrollAnimation({ 
  children, 
  className = '', 
  delay = 0, 
  animation = 'fadeInUp',
  duration = 1000 
}: ScrollAnimationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            setIsVisible(true);
          }, delay);
        }
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -100px 0px'
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [delay]);

  const getAnimationClass = () => {
    if (!isVisible) {
      switch (animation) {
        case 'fadeInUp':
          return 'opacity-0 translate-y-8 scale-95';
        case 'slideInLeft':
          return 'opacity-0 -translate-x-8 rotate-y-[-10deg]';
        case 'slideInRight':
          return 'opacity-0 translate-x-8 rotate-y-[10deg]';
        case 'scaleIn':
          return 'opacity-0 scale-75 rotate-[-5deg]';
        default:
          return 'opacity-0 translate-y-8';
      }
    }
    
    switch (animation) {
      case 'fadeInUp':
        return 'opacity-100 translate-y-0 scale-100';
      case 'slideInLeft':
        return 'opacity-100 translate-x-0 rotate-y-0';
      case 'slideInRight':
        return 'opacity-100 translate-x-0 rotate-y-0';
      case 'scaleIn':
        return 'opacity-100 scale-100 rotate-0';
      default:
        return 'opacity-100 translate-y-0';
    }
  };

  return (
    <div
      ref={ref}
      className={`transition-all duration-${duration} cubic-bezier(0.25, 0.46, 0.45, 0.94) ${getAnimationClass()} ${className}`}
      style={{
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      }}
    >
      {children}
    </div>
  );
}
