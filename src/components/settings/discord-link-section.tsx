'use client';

import { Card } from '@/components/ui/card';
import { DiscordLinkButton } from '@/components/auth/discord-link-button';
import { MessageSquare, Gift, Shield } from 'lucide-react';

export function DiscordLinkSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Discord Integration</h2>
        <p className="text-gray-400">
          Link your Discord account to redeem rewards and access exclusive perks.
        </p>
      </div>

      <Card className="bg-gray-800/50 border-gray-700/50 p-6">
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              Link Your Account
            </h3>
            <DiscordLinkButton />
          </div>

          <div className="border-t border-gray-700/50 pt-6">
            <h3 className="text-lg font-semibold text-white mb-4">Benefits</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center shrink-0">
                  <Gift className="w-4 h-4 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Redeem Rewards</p>
                  <p className="text-xs text-gray-400">
                    Use your earned credits to unlock Discord roles and themes
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Exclusive Access</p>
                  <p className="text-xs text-gray-400">
                    Get access to exclusive channels and features
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Bot Commands</p>
                  <p className="text-xs text-gray-400">
                    Check your balance and redeem rewards directly in Discord
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-700/50 pt-6">
            <h3 className="text-lg font-semibold text-white mb-3">Available Commands</h3>
            <div className="bg-gray-900/50 rounded-lg p-4 space-y-2 font-mono text-sm">
              <div className="flex justify-between">
                <span className="text-blue-400">/credits</span>
                <span className="text-gray-500">Check your balance</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-400">/rewards</span>
                <span className="text-gray-500">Browse available rewards</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-400">/redeem</span>
                <span className="text-gray-500">Redeem a reward</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-400">/history</span>
                <span className="text-gray-500">View transaction history</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

