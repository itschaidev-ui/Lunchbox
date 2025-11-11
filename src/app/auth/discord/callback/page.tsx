'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Force dynamic rendering - this page requires client-side OAuth callback handling
export const dynamic = 'force-dynamic';

function DiscordCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing account link...');

  useEffect(() => {
    async function handleCallback() {
      try {
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        let stateParam = searchParams.get('state');

        console.log('Discord callback received:', { code: !!code, error, stateParam: stateParam?.substring(0, 50) });

        // Check for OAuth errors
        if (error) {
          setStatus('error');
          setMessage(`Discord OAuth error: ${error}`);
          return;
        }

        if (!code) {
          setStatus('error');
          setMessage('Missing authorization code from Discord');
          return;
        }

        // Step 1: Exchange code for access token
        setMessage('Exchanging authorization code...');
        // Get the redirect URI that was used (must match exactly what was sent to Discord)
        const redirectUri = `${window.location.origin}/auth/discord/callback`;
        const tokenResponse = await fetch('/api/auth/discord/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code, redirectUri }),
        });

        if (!tokenResponse.ok) {
          const errorData = await tokenResponse.json().catch(() => ({ error: 'Unknown error' }));
          console.error('Token exchange failed:', errorData);
          throw new Error(errorData.error || 'Failed to exchange code for token');
        }

        const tokenData = await tokenResponse.json();
        const { access_token } = tokenData;
        
        if (!access_token) {
          console.error('No access token in response:', tokenData);
          throw new Error('No access token received from Discord');
        }

        // Step 2: Get user info from Discord
        setMessage('Fetching Discord user info...');
        const userResponse = await fetch('https://discord.com/api/users/@me', {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        });

        if (!userResponse.ok) {
          const errorText = await userResponse.text();
          console.error('Discord user fetch failed:', userResponse.status, errorText);
          throw new Error(`Failed to fetch Discord user info: ${userResponse.status} ${errorText}`);
        }

        const discordUser = await userResponse.json();
        console.log('Discord user fetched:', { id: discordUser.id, username: discordUser.username });

        // Step 3: Determine if this is LOGIN or LINKING
        // Get user info from sessionStorage (primary method) or state parameter (backup)
        let userId: string | null = null;
        let email: string | null = null;
        
        // Debug: Check what's in sessionStorage
        console.log('All sessionStorage keys:', Object.keys(sessionStorage));
        console.log('sessionStorage.getItem("discord_link_userId"):', sessionStorage.getItem('discord_link_userId'));
        
        // First, try to get from sessionStorage (more reliable)
        userId = sessionStorage.getItem('discord_link_userId');
        email = sessionStorage.getItem('discord_link_email');
        
        // If not in sessionStorage, try to parse from state parameter (backup)
        if (!userId && stateParam) {
          try {
            // Discord may URL-encode the state parameter, so decode it first
            try {
              stateParam = decodeURIComponent(stateParam);
            } catch (e) {
              // Already decoded or not encoded
            }
            
            const state = JSON.parse(stateParam);
            userId = state.userId || null;
            email = state.email || null;
          } catch (e) {
            console.warn('Failed to parse state parameter:', e);
          }
        }

        // Last resort: Try localStorage (in case sessionStorage was cleared)
        if (!userId) {
          userId = localStorage.getItem('discord_link_userId');
          email = localStorage.getItem('discord_link_email');
        }

        // Clear storage after retrieving (cleanup)
        sessionStorage.removeItem('discord_link_userId');
        sessionStorage.removeItem('discord_link_email');
        sessionStorage.removeItem('discord_link_timestamp');
        localStorage.removeItem('discord_link_userId');
        localStorage.removeItem('discord_link_email');

        // If userId exists, this is LINKING (user already logged in)
        if (userId) {
          console.log('Linking Discord to existing account:', { userId: userId.substring(0, 20) });
          setMessage('Linking accounts...');
          
          const linkPayload = {
            discordId: discordUser.id,
            email: email || '',
            uid: userId,
            username: discordUser.global_name || discordUser.username || 'User',
            discordUser: discordUser,
            accessToken: access_token,
          };
          
          const linkResponse = await fetch('/api/auth/discord/link', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(linkPayload),
          });

          if (!linkResponse.ok) {
            const errorData = await linkResponse.json().catch(() => ({ error: 'Unknown error' }));
            console.error('Link failed:', errorData);
            throw new Error(errorData.error || `Failed to link accounts: ${linkResponse.status}`);
          }
          
          const linkResult = await linkResponse.json();
          console.log('Link successful:', linkResult);

          setStatus('success');
          setMessage('Your Discord account has been successfully linked!');

          // Redirect to settings after 2 seconds
          setTimeout(() => {
            // Close popup and refresh parent window
            if (window.opener) {
              window.opener.postMessage({ type: 'DISCORD_LINKED', success: true }, '*');
              window.close();
            } else {
              router.push('/settings');
            }
          }, 2000);
        } else {
          // No userId = LOGIN (create/authenticate user with Discord)
          console.log('Logging in with Discord (no existing user)');
          setMessage('Logging in with Discord...');
          
          // Create email and password for Discord user
          const email = discordUser.email || `${discordUser.id}@discord.local`;
          const tempPassword = `discord_${discordUser.id}`;
          const displayName = discordUser.global_name || discordUser.username;
          const photoURL = discordUser.avatar 
            ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png` 
            : undefined;

          let firebaseUser;
          
          try {
            // Try to create a new Firebase Auth user
            const userCredential = await createUserWithEmailAndPassword(auth, email, tempPassword);
            firebaseUser = userCredential.user;
            console.log('Created new Firebase Auth user:', firebaseUser.uid);
          } catch (error: any) {
            if (error.code === 'auth/email-already-in-use') {
              // User exists, try to sign them in
              try {
                const userCredential = await signInWithEmailAndPassword(auth, email, tempPassword);
                firebaseUser = userCredential.user;
                console.log('Signed in existing Firebase Auth user:', firebaseUser.uid);
              } catch (signInError: any) {
                // If sign in fails, create a new user with a different email
                const uniqueEmail = `${discordUser.id}_${Date.now()}@discord.local`;
                const userCredential = await createUserWithEmailAndPassword(auth, uniqueEmail, tempPassword);
                firebaseUser = userCredential.user;
                console.log('Created Firebase Auth user with unique email:', firebaseUser.uid);
              }
            } else {
              throw error;
            }
          }

          // Update the Firebase user profile with Discord info
          await updateProfile(firebaseUser, {
            displayName: displayName,
            photoURL: photoURL,
          });

          // Store user data in Firestore
          const userRef = doc(db, 'users', firebaseUser.uid);
          await setDoc(userRef, {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: displayName,
            photoURL: photoURL,
            // Discord-specific fields
            discordId: discordUser.id,
            discordUsername: discordUser.username,
            discordAvatar: discordUser.avatar,
            discordAccessToken: access_token,
            discordEnabled: true,
            reminderTimes: [1, 24], // Default: 1 hour and 24 hours before due
            timezone: 'UTC',
            createdAt: new Date().toISOString(),
            lastActive: new Date().toISOString()
          }, { merge: true });

          // Also create discord_links entry for consistency
          const linkRef = doc(db, 'discord_links', discordUser.id);
          await setDoc(linkRef, {
            discordId: discordUser.id,
            uid: firebaseUser.uid,
            email: firebaseUser.email || email,
            username: displayName,
            discordUsername: discordUser.username,
            discordAvatar: discordUser.avatar,
            linkedAt: new Date().toISOString(),
            linkMethod: 'discord_login',
            accessToken: access_token,
          }, { merge: true });

          console.log('Login successful:', { uid: firebaseUser.uid, email: firebaseUser.email });

          setStatus('success');
          setMessage('Successfully logged in with Discord!');

          // Redirect to home page after 2 seconds
          setTimeout(() => {
            router.push('/');
          }, 2000);
        }
      } catch (error: any) {
        console.error('Discord OAuth error:', error);
        setStatus('error');
        setMessage(error.message || 'Failed to link accounts. Please try again.');
      }
    }

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 max-w-md w-full shadow-2xl"
      >
        <div className="flex flex-col items-center text-center space-y-6">
          {status === 'loading' && (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Loader2 className="w-16 h-16 text-blue-500" />
              </motion.div>
              <h1 className="text-2xl font-bold text-white">
                {message.includes('Linking') ? 'Linking Account' : 'Logging In'}
              </h1>
              <p className="text-gray-400">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              >
                <CheckCircle className="w-16 h-16 text-green-500" />
              </motion.div>
              <h1 className="text-2xl font-bold text-white">Success!</h1>
              <p className="text-gray-300">{message}</p>
              <p className="text-sm text-gray-500">
                {message.includes('linked') ? 'Redirecting to settings...' : 'Redirecting to home...'}
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-16 h-16 text-red-500" />
              <h1 className="text-2xl font-bold text-white">Link Failed</h1>
              <p className="text-gray-300">{message}</p>
              <button
                onClick={() => router.push('/settings')}
                className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Back to Settings
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function DiscordCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 max-w-md w-full shadow-2xl"
        >
          <div className="flex flex-col items-center text-center space-y-6">
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
            <h1 className="text-2xl font-bold text-white">Loading...</h1>
            <p className="text-gray-400">Processing Discord authentication...</p>
          </div>
        </motion.div>
      </div>
    }>
      <DiscordCallbackContent />
    </Suspense>
  );
}
