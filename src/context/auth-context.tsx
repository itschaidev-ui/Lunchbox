
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User, GoogleAuthProvider, signInWithPopup, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, sendEmailVerification, sendPasswordResetEmail, OAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createOrUpdateUser } from '@/lib/firebase-users';
import { Loader2 } from 'lucide-react';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithDiscord: () => Promise<void>;
  signUpWithEmail: (email: string, password: string, username: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  sendEmailVerification: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false); // Start with false to bypass loading

  useEffect(() => {
    let isMounted = true;
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!isMounted) return;
      
      setUser(user);
      setLoading(false);
      
      // Create or update user profile when they sign in
      if (user) {
        try {
          await createOrUpdateUser(user);
        } catch (error) {
          console.error('Error creating/updating user:', error);
          // Don't block the UI if user creation fails
        }
      }
    });

    // Set a timeout to stop loading if auth state doesn't resolve
    const timeout = setTimeout(() => {
      if (isMounted) {
        setLoading(false);
      }
    }, 3000); // 3 second timeout

    return () => {
      isMounted = false;
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    // No router.push here. onAuthStateChanged will handle UI updates.
    await signInWithPopup(auth, provider);
  };

  const signInWithDiscord = async () => {
    // Check if we're in the browser
    if (typeof window === 'undefined') return;
    
    // Discord OAuth for USER authentication
    const discordClientId = '1426983253666955324';
    const redirectUri = `${window.location.origin}/auth/discord/callback`;
    
    // Scopes for user authentication
    const scopes = [
      'identify',           // Basic user info
      'email'              // User's email
    ].join(' ');
    
    // User authentication URL
    const discordAuthUrl = `https://discord.com/oauth2/authorize?client_id=${discordClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}`;
    
    window.location.href = discordAuthUrl;
  };

  const signUpWithEmail = async (email: string, password: string, username: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update the user's display name
      await updateProfile(user, {
        displayName: username
      });
      
      // Send email verification
      await sendEmailVerification(user);
      
      // The onAuthStateChanged listener will handle the rest
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // The onAuthStateChanged listener will handle the rest
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const sendEmailVerification = async () => {
    if (!user) throw new Error('No user logged in');
    try {
      await sendEmailVerification(user);
    } catch (error) {
      console.error('Error sending email verification:', error);
      throw error;
    }
  };

  const sendPasswordReset = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Error sending password reset:', error);
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
    // The onAuthStateChanged listener will set user to null,
    // and the protected routes will handle the redirect.
  };

  const value = { user, loading, signInWithGoogle, signInWithDiscord, signUpWithEmail, signInWithEmail, sendEmailVerification, sendPasswordReset, logout };
  
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
