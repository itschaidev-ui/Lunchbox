'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { LoadingScreen } from '@/components/ui/loading-screen';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // Redirect to main page since we're using modal authentication
  useEffect(() => {
    if (!loading) {
      router.push('/');
    }
  }, [loading, router]);

  if (loading) {
    return (
      <LoadingScreen 
        message="Redirecting to Lunchbox AI..." 
        size="lg"
      />
    );
  }

  return (
    <LoadingScreen 
      message="Redirecting to Lunchbox AI..." 
      size="lg"
    />
  );
}