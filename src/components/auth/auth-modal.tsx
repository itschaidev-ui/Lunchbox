'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginForm } from './login-form';
import { SignupForm } from './signup-form';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}

export function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [isSignupMode, setIsSignupMode] = useState(initialMode === 'signup');
  const [errorMessage, setErrorMessage] = useState('');
  const { user, loading } = useAuth();
  const router = useRouter();
  
  let searchParams;
  try {
    searchParams = useSearchParams();
  } catch (e) {
    // useSearchParams can fail during SSR, that's okay
    searchParams = null;
  }

  // Handle URL parameters
  useEffect(() => {
    if (!searchParams) return;
    const mode = searchParams.get('mode');
    if (mode === 'signup') {
      setIsSignupMode(true);
    } else if (mode === 'login') {
      setIsSignupMode(false);
    }
  }, [searchParams]);

  // Close modal when user is authenticated
  useEffect(() => {
    if (user && !loading) {
      onClose();
      // Don't redirect - let the user stay on the current page
    }
  }, [user, loading, onClose, router]);

  // Handle escape key and prevent body scroll
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      // Prevent body scroll and save current scroll position
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      // Restore scroll position
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
      
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="mobile-modal" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div className="relative z-10 w-full max-w-md max-h-[90vh] overflow-y-auto my-auto animate-slide-in-up">
        <Card className="mobile-modal-content bg-card/95 backdrop-blur-md border-border/50 shadow-2xl">
          <CardHeader className="text-center pb-4 mobile-padding">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold">
                  <span className="bg-gradient-to-r from-orange-300 via-pink-400 to-purple-500 bg-clip-text text-transparent animate-gradient-x">Lunchbox</span> <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-500 bg-clip-text text-transparent animate-gradient-x" style={{animationDelay: '0.5s'}}>AI</span>
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="mobile-button h-8 w-8 p-0 hover:bg-muted/50 hover-scale transition-buttery"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <CardTitle id="auth-modal-title" className="mobile-heading mb-2">
              {isSignupMode ? (
                <span>
                  Join <span className="bg-gradient-to-r from-orange-300 via-pink-400 to-purple-500 bg-clip-text text-transparent animate-gradient-x">Lunchbox</span> <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-500 bg-clip-text text-transparent animate-gradient-x" style={{animationDelay: '0.5s'}}>AI</span>
                </span>
              ) : (
                <span className="text-foreground">Welcome Back</span>
              )}
            </CardTitle>
            <CardDescription className="mobile-caption">
              {isSignupMode
                ? 'Create your account to get started with AI-powered productivity'
                : 'Sign in to access your AI-powered workspace'
              }
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 mobile-padding">
            {/* Error Message */}
            {errorMessage && (
              <Alert variant="destructive" className="mobile-fade-in">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            {/* Auth Forms */}
            {isSignupMode ? (
              <SignupForm 
                onSwitchToLogin={() => setIsSignupMode(false)}
              />
            ) : (
              <LoginForm 
                onSwitchToSignup={() => setIsSignupMode(true)}
              />
            )}

            {/* Toggle Button */}
            <div className="text-center pt-4 border-t border-border/50">
              <Button
                variant="ghost"
                onClick={() => setIsSignupMode(!isSignupMode)}
                className="mobile-button text-primary hover:text-primary/80 transition-buttery hover-scale"
              >
                {isSignupMode ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
