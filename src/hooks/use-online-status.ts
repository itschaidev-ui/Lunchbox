'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { updateUserHeartbeat, setUserOffline } from '@/lib/firebase-users';

const HEARTBEAT_INTERVAL = 30000; // 30 seconds

export function useOnlineStatus() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.uid) return;

    // Set user online immediately
    updateUserHeartbeat(user.uid);

    // Set up heartbeat interval
    const heartbeatInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        updateUserHeartbeat(user.uid);
      }
    }, HEARTBEAT_INTERVAL);

    // Handle visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateUserHeartbeat(user.uid);
      } else {
        setUserOffline(user.uid);
      }
    };

    // Handle page unload
    const handleBeforeUnload = () => {
      setUserOffline(user.uid);
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup
    return () => {
      clearInterval(heartbeatInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      setUserOffline(user.uid);
    };
  }, [user?.uid]);
}

