'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import DiscordIcon from './discord-icon';

interface LoginFormProps {
  onSwitchToSignup: () => void;
}

const GoogleIcon = () => (
  <svg
    className="w-4 h-4"
    viewBox="0 0 24 24"
  >
    <path
      fill="currentColor"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="currentColor"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="currentColor"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="currentColor"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

export function LoginForm({ onSwitchToSignup }: LoginFormProps) {
  const { signInWithGoogle, signInWithDiscord, signInWithEmail, sendPasswordReset } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isDiscordLoading, setIsDiscordLoading] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [error, setError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.email.trim() || !formData.password) {
      setError('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    try {
      await signInWithEmail(formData.email, formData.password);
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.code === 'auth/user-not-found') {
        setError('No account found with this email. Please sign up first.');
      } else if (error.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.');
      } else if (error.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.');
      } else {
        setError('An error occurred during login. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError('');
    try {
      await signInWithGoogle();
    } catch (error: any) {
      console.error('Google login error:', error);
      setError('An error occurred during Google sign-in. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleDiscordLogin = async () => {
    setIsDiscordLoading(true);
    setError('');
    try {
      await signInWithDiscord();
    } catch (error: any) {
      console.error('Discord login error:', error);
      setError('An error occurred during Discord sign-in. Please try again.');
    } finally {
      setIsDiscordLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!formData.email.trim()) {
      setError('Please enter your email address first');
      return;
    }

    setIsResettingPassword(true);
    setError('');
    setResetSuccess(false);

    try {
      await sendPasswordReset(formData.email);
      setResetSuccess(true);
    } catch (error: any) {
      console.error('Password reset error:', error);
      if (error.code === 'auth/user-not-found') {
        setError('No account found with this email address');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Too many requests. Please wait a moment before trying again.');
      } else {
        setError('Failed to send password reset email. Please try again.');
      }
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive" className="mobile-fade-in">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

        {resetSuccess && (
          <Alert className="mobile-fade-in">
            <AlertDescription>
              Password reset email sent! Please check your inbox and follow the instructions.
            </AlertDescription>
          </Alert>
        )}

        <Button
          type="button"
          variant="outline"
          className="mobile-button w-full bg-secondary/20 hover:bg-secondary/30 border-border text-foreground hover:text-foreground transition-buttery hover-lift hover-glow"
          onClick={handleGoogleLogin}
          disabled={isGoogleLoading || isDiscordLoading || isLoading}
        >
          {isGoogleLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <GoogleIcon />
          )}
          <span className="ml-2">
            {isGoogleLoading ? 'Signing in...' : 'Continue with Google'}
          </span>
        </Button>

        <Button
          type="button"
          variant="outline"
          className="mobile-button w-full bg-secondary/20 hover:bg-secondary/30 border-border text-foreground hover:text-foreground transition-buttery hover-lift hover-glow"
          onClick={handleDiscordLogin}
          disabled={isGoogleLoading || isDiscordLoading || isLoading}
        >
          {isDiscordLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <DiscordIcon className="mr-2 h-4 w-4" />
          )}
          <span className="ml-2">
            {isDiscordLoading ? 'Signing in...' : 'Continue with Discord'}
          </span>
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              Or continue with email
            </span>
          </div>
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground font-medium">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={isLoading || isGoogleLoading || isDiscordLoading}
              required
              className="mobile-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground font-medium">Password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange}
                disabled={isLoading || isGoogleLoading || isDiscordLoading}
                required
                className="mobile-input pr-12"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading || isGoogleLoading || isDiscordLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="text-right">
            <Button
              type="button"
              variant="link"
              className="p-0 h-auto text-sm text-primary hover:text-primary/80"
              onClick={handlePasswordReset}
              disabled={isResettingPassword || isLoading || isGoogleLoading || isDiscordLoading}
            >
              {isResettingPassword ? 'Sending...' : 'Forgot password?'}
            </Button>
          </div>

          <Button
            type="submit"
            className="mobile-button w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground font-semibold transition-buttery hover-lift hover-glow shadow-lg hover:shadow-xl"
            disabled={isLoading || isGoogleLoading || isDiscordLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>
    </div>
  );
}
