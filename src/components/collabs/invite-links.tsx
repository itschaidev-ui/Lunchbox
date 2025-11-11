'use client';

import { useState, useEffect } from 'react';
import { Copy, Plus, Trash2, X, Check, ExternalLink, Calendar, Users as UsersIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { createInviteLink, getCollabInvites, revokeInviteLink, deleteInviteLink, getRoleByName } from '@/lib/firebase-collaborations';
import type { CollabInvite } from '@/lib/types';
import { useAuth } from '@/context/auth-context';

interface InviteLinksProps {
  collabId: string;
}

export function InviteLinks({ collabId }: InviteLinksProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [invites, setInvites] = useState<CollabInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [expiresIn, setExpiresIn] = useState<string>('7'); // days
  const [maxUses, setMaxUses] = useState<string>('');
  const [creating, setCreating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (collabId) {
      loadInvites();
    }
  }, [collabId]);

  const loadInvites = async () => {
    try {
      setLoading(true);
      const collabInvites = await getCollabInvites(collabId);
      setInvites(collabInvites);
    } catch (error) {
      console.error('Error loading invites:', error);
      toast({
        title: 'Error',
        description: 'Failed to load invite links',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvite = async () => {
    if (!user?.uid) return;

    try {
      setCreating(true);
      
      // Get default role (Member)
      const memberRole = await getRoleByName(collabId, 'Member');
      if (!memberRole) {
        toast({
          title: 'Error',
          description: 'Default role not found',
          variant: 'destructive',
        });
        return;
      }

      // Calculate expiration date
      let expiresAt: string | undefined;
      if (expiresIn && expiresIn.trim() !== '' && parseInt(expiresIn) > 0) {
        const date = new Date();
        date.setDate(date.getDate() + parseInt(expiresIn));
        expiresAt = date.toISOString();
      } else {
        expiresAt = undefined; // No expiration
      }

      // Parse max uses
      let maxUsesValue: number | undefined;
      if (maxUses && maxUses.trim() !== '' && parseInt(maxUses) > 0) {
        maxUsesValue = parseInt(maxUses);
      } else {
        maxUsesValue = undefined; // Unlimited uses
      }

      // Create invite
      const code = await createInviteLink(
        collabId,
        user.uid,
        memberRole.id,
        expiresAt,
        maxUsesValue
      );

      toast({
        title: 'Success!',
        description: 'Invite link created',
      });

      // Reset form
      setExpiresIn('7');
      setMaxUses('');
      setShowCreateDialog(false);

      // Reload invites
      await loadInvites();
    } catch (error: any) {
      console.error('Error creating invite:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create invite link',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleCopyLink = (code: string) => {
    const inviteUrl = `${window.location.origin}/collabs/invite/${code}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedCode(code);
    toast({
      title: 'Copied!',
      description: 'Invite link copied to clipboard',
    });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleRevoke = async (inviteId: string) => {
    try {
      await revokeInviteLink(inviteId);
      toast({
        title: 'Success!',
        description: 'Invite link revoked',
      });
      await loadInvites();
    } catch (error) {
      console.error('Error revoking invite:', error);
      toast({
        title: 'Error',
        description: 'Failed to revoke invite link',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (inviteId: string) => {
    if (!confirm('Are you sure you want to delete this invite link?')) return;

    try {
      await deleteInviteLink(inviteId);
      toast({
        title: 'Success!',
        description: 'Invite link deleted',
      });
      await loadInvites();
    } catch (error) {
      console.error('Error deleting invite:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete invite link',
        variant: 'destructive',
      });
    }
  };

  const getInviteUrl = (code: string) => {
    return `${typeof window !== 'undefined' ? window.location.origin : ''}/collabs/invite/${code}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Invite Links</h3>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Invite
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-800 border-gray-700">
            <DialogHeader>
              <DialogTitle>Create Invite Link</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="expires">Expires in (days)</Label>
                <Input
                  id="expires"
                  type="number"
                  min="1"
                  value={expiresIn}
                  onChange={(e) => setExpiresIn(e.target.value)}
                  placeholder="7"
                  className="bg-gray-900 border-gray-700"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty for no expiration
                </p>
              </div>
              <div>
                <Label htmlFor="maxUses">Max Uses</Label>
                <Input
                  id="maxUses"
                  type="number"
                  min="1"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                  placeholder="Unlimited"
                  className="bg-gray-900 border-gray-700"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty for unlimited uses
                </p>
              </div>
              <Button
                onClick={handleCreateInvite}
                disabled={creating}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
              >
                {creating ? 'Creating...' : 'Create Invite'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading invites...
        </div>
      ) : invites.length === 0 ? (
        <Card className="p-8 bg-gray-800/30 border-gray-700 border-dashed">
          <div className="text-center space-y-2">
            <ExternalLink className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">
              No invite links yet. Create one to invite others!
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {invites.map((invite) => {
            const inviteUrl = getInviteUrl(invite.code);
            const isExpired = invite.expiresAt && new Date(invite.expiresAt) < new Date();
            const isMaxedOut = invite.maxUses && invite.uses >= invite.maxUses;
            const isActive = invite.isActive && !isExpired && !isMaxedOut;

            return (
              <Card
                key={invite.id}
                className={`p-4 bg-gray-800/50 border-gray-700 ${
                  !isActive ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono bg-gray-900 px-2 py-1 rounded text-indigo-400">
                        {invite.code}
                      </code>
                      {!isActive && (
                        <span className="text-xs text-red-400">
                          {!invite.isActive ? 'Revoked' : isExpired ? 'Expired' : 'Max Uses Reached'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {invite.expiresAt && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(invite.expiresAt).toLocaleDateString()}
                        </div>
                      )}
                      {invite.maxUses && (
                        <div className="flex items-center gap-1">
                          <UsersIcon className="h-3 w-3" />
                          {invite.uses} / {invite.maxUses}
                        </div>
                      )}
                      {!invite.maxUses && (
                        <div className="flex items-center gap-1">
                          <UsersIcon className="h-3 w-3" />
                          {invite.uses} uses
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopyLink(invite.code)}
                      className="h-8 w-8 p-0"
                    >
                      {copiedCode === invite.code ? (
                        <Check className="h-4 w-4 text-green-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    {isActive ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRevoke(invite.id)}
                        className="h-8 w-8 p-0 text-yellow-400 hover:text-yellow-300"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(invite.id)}
                        className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

