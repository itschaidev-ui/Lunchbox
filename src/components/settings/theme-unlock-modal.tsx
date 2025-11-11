import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Lock, ExternalLink, Coins, MessageSquare, CheckCircle2 } from 'lucide-react';
import type { ThemeDetails } from '@/lib/firebase-redemptions';

interface ThemeUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeDetails & {
    colors: {
      primary: string;
      secondary: string;
      accent: string;
    };
  };
}

export function ThemeUnlockModal({ isOpen, onClose, theme }: ThemeUnlockModalProps) {
  const DISCORD_INVITE = 'https://discord.gg/KfGSPbqA6b';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Unlock {theme.name} Theme
          </DialogTitle>
          <DialogDescription>
            This premium theme can be unlocked by redeeming it in our Discord server
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Theme Info */}
          <Card className="p-4 border-2" style={{ borderColor: `${theme.colors.primary}30` }}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-lg">{theme.name}</h3>
                <p className="text-sm text-muted-foreground">{theme.description}</p>
              </div>
              <Badge 
                className="text-sm px-2 py-1 flex items-center gap-1"
                style={{ 
                  backgroundColor: `${theme.colors.accent}20`,
                  color: theme.colors.accent
                }}
              >
                <Coins className="h-3 w-3" />
                {theme.cost}
              </Badge>
            </div>

            {/* Color Preview */}
            <div className="flex items-center gap-2 mt-3">
              <span className="text-xs text-muted-foreground">Colors:</span>
              <div className="flex gap-1.5">
                <div 
                  className="w-6 h-6 rounded-full border-2 border-border"
                  style={{ backgroundColor: theme.colors.primary }}
                  title="Primary"
                />
                <div 
                  className="w-6 h-6 rounded-full border-2 border-border"
                  style={{ backgroundColor: theme.colors.secondary }}
                  title="Secondary"
                />
                <div 
                  className="w-6 h-6 rounded-full border-2 border-border"
                  style={{ backgroundColor: theme.colors.accent }}
                  title="Accent"
                />
              </div>
            </div>
          </Card>

          {/* Instructions */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              How to Unlock
            </h4>

            <div className="space-y-2">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                  1
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Join our Discord server</p>
                  <p className="text-xs text-muted-foreground">Connect with the Lunchbox community</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                  2
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Link your account</p>
                  <p className="text-xs text-muted-foreground">Use <code className="px-1 py-0.5 bg-background rounded text-[10px]">/link</code> or <code className="px-1 py-0.5 bg-background rounded text-[10px]">/oauth</code> command</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                  3
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Earn credits</p>
                  <p className="text-xs text-muted-foreground">Complete tasks and routines to earn {theme.cost} credits</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                  4
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Redeem the theme</p>
                  <p className="text-xs text-muted-foreground">
                    Use <code className="px-1 py-0.5 bg-background rounded text-[10px]">/redeem reward:{theme.id}</code>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Auto-unlocks instantly!</p>
                  <p className="text-xs text-muted-foreground">Theme will be available immediately after redemption</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => window.open(DISCORD_INVITE, '_blank')}
              className="flex-1"
              style={{ backgroundColor: theme.colors.primary }}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Join Discord Server
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>

          {/* Footer Note */}
          <p className="text-xs text-center text-muted-foreground">
            Already redeemed? Refresh the page to see your unlocked themes
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

