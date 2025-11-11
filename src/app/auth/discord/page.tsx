'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// Force dynamic rendering - this page requires client-side OAuth flow
export const dynamic = 'force-dynamic';

function DiscordAuthContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Get user info from URL parameters (passed from parent window)
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');

    console.log('Discord auth page loaded:', { userId: userId?.substring(0, 20), email: email?.substring(0, 20) });

    if (!userId) {
      alert('Please log in first before linking Discord');
      window.close();
      return;
    }

    // Store in this popup's sessionStorage AND localStorage before redirecting to Discord
    // This ensures we have it when Discord redirects back (localStorage as backup)
    sessionStorage.setItem('discord_link_userId', userId);
    sessionStorage.setItem('discord_link_email', email || '');
    sessionStorage.setItem('discord_link_timestamp', Date.now().toString());
    
    // Also store in localStorage as backup (in case sessionStorage is cleared)
    localStorage.setItem('discord_link_userId', userId);
    localStorage.setItem('discord_link_email', email || '');
    localStorage.setItem('discord_link_timestamp', Date.now().toString());
    
    console.log('Stored user info:', {
      sessionStorage: {
        userId: sessionStorage.getItem('discord_link_userId')?.substring(0, 20),
        email: sessionStorage.getItem('discord_link_email')?.substring(0, 20)
      },
      localStorage: {
        userId: localStorage.getItem('discord_link_userId')?.substring(0, 20),
        email: localStorage.getItem('discord_link_email')?.substring(0, 20)
      }
    });

    // Discord OAuth Client ID from environment variable
    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || '1426983253666955324';
    const redirectUri = `${window.location.origin}/auth/discord/callback`;

    // Construct Discord OAuth URL
    const discordOAuthUrl = new URL('https://discord.com/api/oauth2/authorize');
    discordOAuthUrl.searchParams.set('client_id', clientId);
    discordOAuthUrl.searchParams.set('redirect_uri', redirectUri);
    discordOAuthUrl.searchParams.set('response_type', 'code');
    discordOAuthUrl.searchParams.set('scope', 'identify email');
    
    // Also set state parameter (backup, in case Discord returns it)
    const state = JSON.stringify({ userId, email, timestamp: Date.now() });
    discordOAuthUrl.searchParams.set('state', state);

    console.log('Stored in sessionStorage and redirecting to Discord OAuth:', {
      clientId,
      redirectUri,
      stateLength: state.length,
      storedUserId: sessionStorage.getItem('discord_link_userId')?.substring(0, 20)
    });

    // Redirect to Discord OAuth
    window.location.href = discordOAuthUrl.toString();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        <p className="text-white text-lg">Redirecting to Discord...</p>
      </div>
    </div>
  );
}

export default function DiscordAuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    }>
      <DiscordAuthContent />
    </Suspense>
  );
}

