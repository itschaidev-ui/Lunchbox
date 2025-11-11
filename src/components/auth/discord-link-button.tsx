'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Unlink, ExternalLink } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit, doc, getDoc } from 'firebase/firestore';

interface DiscordLinkData {
  discordId: string;
  username: string;
  email: string;
  linkedAt: Date;
  linkMethod: string;
}

export function DiscordLinkButton() {
  const { user } = useAuth();
  const [linkData, setLinkData] = useState<DiscordLinkData | null>(null);
  const [isDiscordUser, setIsDiscordUser] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkLinkStatus = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // First, check if user logged in with Discord (has discordId in user document)
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.discordId) {
          // User logged in with Discord - they're already using Discord
          setIsDiscordUser(true);
          setLinkData({
            discordId: userData.discordId,
            username: userData.discordUsername || userData.displayName || 'Discord User',
            email: userData.email || user.email || '',
            linkedAt: userData.createdAt || new Date(),
            linkMethod: 'discord_login', // Special marker for Discord login
          });
          setLoading(false);
          return;
        }
      }
      
      // If not a Discord login, check if user has linked Discord by querying discord_links collection
      const linkQuery = query(
        collection(db, 'discord_links'),
        where('uid', '==', user.uid),
        limit(1)
      );
      const linkSnapshot = await getDocs(linkQuery);
      
      if (!linkSnapshot.empty) {
        const linkDoc = linkSnapshot.docs[0];
        setLinkData(linkDoc.data() as DiscordLinkData);
        setIsDiscordUser(false);
      } else {
        setLinkData(null);
        setIsDiscordUser(false);
      }
    } catch (error) {
      console.error('Error checking Discord link status:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkLinkStatus();
  }, [checkLinkStatus]);

  // Listen for Discord link success message from popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'DISCORD_LINKED' && event.data?.success) {
        // Reload link status
        checkLinkStatus();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [checkLinkStatus]);

  const handleLink = () => {
    if (!user) {
      alert('Please log in first before linking Discord');
      return;
    }

    // Open OAuth link in new window with user info in URL
    // The popup will store this in its own sessionStorage before redirecting
    const width = 500;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    window.open(
      `/auth/discord?userId=${encodeURIComponent(user.uid)}&email=${encodeURIComponent(user.email || '')}`,
      'Discord OAuth',
      `width=${width},height=${height},left=${left},top=${top}`
    );
  };

  const handleUnlink = async () => {
    if (!linkData || !user) return;

    const confirmUnlink = window.confirm(
      'Are you sure you want to unlink your Discord account? You will lose access to Discord rewards.'
    );

    if (!confirmUnlink) return;

    try {
      // Call Firebase to unlink
      const response = await fetch('/api/discord/unlink', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          discordId: linkData.discordId,
        }),
      });

      if (response.ok) {
        setLinkData(null);
      }
    } catch (error) {
      console.error('Error unlinking Discord:', error);
      alert('Failed to unlink Discord account. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-400">
        <div className="w-4 h-4 border-2 border-gray-600 border-t-blue-500 rounded-full animate-spin" />
        <span className="text-sm">Checking link status...</span>
      </div>
    );
  }

  if (linkData) {
    // If user logged in with Discord, show different message (no unlink option)
    if (isDiscordUser) {
      return (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between p-4 bg-gray-800/50 border border-gray-700/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600/20 rounded-full flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{linkData.username}</p>
                <p className="text-xs text-gray-400">Logged in with Discord</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
              Connected
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground text-center px-2">
            You're already using Discord as your login method. No additional linking needed.
          </p>
        </div>
      );
    }
    
    // If user linked Discord to email account, show unlink option
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between p-4 bg-gray-800/50 border border-gray-700/50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600/20 rounded-full flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{linkData.username}</p>
              <p className="text-xs text-gray-400">Linked via {linkData.linkMethod}</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
            Connected
          </Badge>
        </div>
        <Button
          onClick={handleUnlink}
          variant="outline"
          className="w-full border-red-600/30 text-red-500 hover:bg-red-600/10"
        >
          <Unlink className="w-4 h-4 mr-2" />
          Unlink Discord
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={handleLink}
      className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white"
    >
      <MessageSquare className="w-4 h-4 mr-2" />
      Link Discord Account
      <ExternalLink className="w-3 h-3 ml-2" />
    </Button>
  );
}

