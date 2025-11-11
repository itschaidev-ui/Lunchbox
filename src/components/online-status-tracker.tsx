'use client';

import { useOnlineStatus } from '@/hooks/use-online-status';

export function OnlineStatusTracker() {
  useOnlineStatus();
  return null;
}

