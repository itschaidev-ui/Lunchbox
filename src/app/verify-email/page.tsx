'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Loader2, Mail, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingScreen } from '@/components/ui/loading-screen';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const { user, loading, sendEmailVerification } = useAuth();
  const router = useRouter();
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleResendVerification = async () => {
    if (!user) return;
    
    setIsResending(true);
    setResendError('');
    setResendSuccess(false);
    
    try {
      await sendEmailVerification();
      setResendSuccess(true);
    } catch (error: any) {
      console.error('Error resending verification:', error);
      if (error.code === 'auth/too-many-requests') {
        setResendError('Too many requests. Please wait a moment before trying again.');
      } else {
        setResendError('Failed to send verification email. Please try again.');
      }
    } finally {
      setIsResending(false);
    }
  };

  if (loading) {
    return (
      <LoadingScreen 
        message="Loading verification..." 
        size="lg"
      />
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen w-full">
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 bg-background">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <Image 
              src="/images/lunchbox-ai-logo.png" 
              alt="Lunchbox AI" 
              width={150} 
              height={40} 
              className="mx-auto mb-6 object-contain" 
            />
            <h1 className="text-3xl md:text-4xl font-bold font-headline tracking-tight">
              Verify Your Email
            </h1>
            <p className="text-muted-foreground mt-2">
              We've sent a verification link to your email address
            </p>
          </div>
          
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>Check Your Email</CardTitle>
              <CardDescription>
                We sent a verification link to <strong>{user.email}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Click the link in the email to verify your account and start using Lunchbox AI.
                </p>
                <p className="text-xs text-muted-foreground">
                  Don't see the email? Check your spam folder.
                </p>
              </div>

              {resendSuccess && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Verification email sent successfully! Please check your inbox.
                  </AlertDescription>
                </Alert>
              )}

              {resendError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{resendError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Button
                  onClick={handleResendVerification}
                  disabled={isResending}
                  variant="outline"
                  className="w-full"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Resend Verification Email'
                  )}
                </Button>

                <Button asChild variant="ghost" className="w-full">
                  <Link href="/login">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Login
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="text-center text-xs text-muted-foreground">
            <p>
              After verifying your email, you'll be able to access all features of Lunchbox AI.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
