
'use client';

import { Sparkles, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useEffect, useState } from 'react';

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" {...props}>
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.902,36.631,44,30.833,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
);

export default function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);
  
  const handleSignIn = async () => {
    setIsSigningIn(true);
    await signInWithGoogle().catch(err => {
        console.error(err);
        // Don't re-enable the button immediately, let the user retry.
        setIsSigningIn(false);
    });
    // Don't set isSigningIn to false here, the page will redirect on success.
  }

  if (loading || user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full">
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md text-center">
            <Image src="https://cdn.discordapp.com/attachments/1063641662925701120/1254117395065012224/logo-lunchbox.png?ex=667856d9&is=66770559&hm=df33994358356b69b00713b1907727103f13f5a5e3f19385959959663f733e85&" alt="Lunchbox AI" width={150} height={40} className="mx-auto mb-8" />
            <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tight mb-4">
                Welcome Back
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
                Sign in to access your AI-powered workspace.
            </p>

            <Button size="lg" className="w-full" onClick={handleSignIn} disabled={isSigningIn}>
                {isSigningIn ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                    <GoogleIcon className="mr-2 h-5 w-5" />
                )}
                Sign in with Google
            </Button>

            <p className="text-xs text-muted-foreground mt-8">
                By signing in, you agree to our Terms of Service and Privacy Policy.
            </p>
        </div>
      </div>
      <div className="hidden lg:flex flex-1 bg-muted items-center justify-center p-8">
         <Sparkles className="h-64 w-64 text-primary/10" strokeWidth={1} />
      </div>
    </div>
  );
}
