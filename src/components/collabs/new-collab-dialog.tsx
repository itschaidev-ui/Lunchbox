'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, X, UserPlus, Bot, Image as ImageIcon, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { createCollaboration, searchUsers } from '@/lib/firebase-collaborations';
import type { CollabCompanion } from '@/lib/types';

interface NewCollabDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface SelectedUser {
  userId: string;
  email: string;
  displayName?: string;
  discordUsername?: string;
}

export function NewCollabDialog({
  open,
  onClose,
  onSuccess,
}: NewCollabDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SelectedUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Companion settings
  const [enableCompanion, setEnableCompanion] = useState(true);
  const [companionPersonality, setCompanionPersonality] = useState('');
  const [companionName, setCompanionName] = useState('Collab Companion');
  const [companionIcon, setCompanionIcon] = useState('/images/lunchbox-ai-logo.png');

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setName('');
      setDescription('');
      setSearchQuery('');
      setSearchResults([]);
      setSelectedUsers([]);
      setEnableCompanion(true);
      setCompanionPersonality('');
      setCompanionName('Collab Companion');
      setCompanionIcon('/images/lunchbox-ai-logo.png');
    }
  }, [open]);

  // Search users with debounce
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchUsers(searchQuery);
        // Filter out already selected users
        const filtered = results.filter(
          r => !selectedUsers.some(su => su.userId === r.userId)
        );
        setSearchResults(filtered);
      } catch (error) {
        console.error('Error searching users:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedUsers]);

  const handleAddUser = (user: SelectedUser) => {
    if (!selectedUsers.some(u => u.userId === user.userId)) {
      setSelectedUsers([...selectedUsers, user]);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(u => u.userId !== userId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid || !name.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a collaboration name',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      // Create companion config if enabled
      const companion: CollabCompanion | undefined = enableCompanion
        ? {
            enabled: true,
            personality: companionPersonality.trim() || undefined,
            icon: companionIcon || '/images/lunchbox-ai-logo.png',
            name: companionName.trim() || 'Collab Companion',
          }
        : undefined;

      // Create collaboration
      const collabId = await createCollaboration(
        user.uid,
        name.trim(),
        description.trim() || undefined,
        companion
      );

      // Add selected members
      if (selectedUsers.length > 0) {
        // This will be handled by API route to send invitations
        await fetch('/api/collabs/invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            collabId,
            userIds: selectedUsers.map(u => u.userId),
          }),
        });
      }

      toast({
        title: 'Success!',
        description: 'Collaboration created successfully',
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error creating collaboration:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create collaboration',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-indigo-400" />
            Create New Collaboration
          </DialogTitle>
          <DialogDescription>
            Create a new collaboration space to work with others on tasks and projects
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Collaboration Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Marketing Team, Project Alpha"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this collaboration about?"
                rows={3}
                className="mt-1"
              />
            </div>
          </div>

          {/* Invite Members */}
          <div className="space-y-3">
            <Label>Invite Members</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Discord username or email..."
                className="pl-9"
              />
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <ScrollArea className="max-h-40 border rounded-md p-2">
                <div className="space-y-1">
                  {searchResults.map((user) => (
                    <button
                      key={user.userId}
                      type="button"
                      onClick={() => handleAddUser(user)}
                      className="w-full text-left p-2 rounded-md hover:bg-gray-800 transition-colors flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium">
                          {user.displayName || user.email}
                        </div>
                        {user.discordUsername && (
                          <div className="text-xs text-muted-foreground">
                            Discord: {user.discordUsername}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          {user.email}
                        </div>
                      </div>
                      <UserPlus className="h-4 w-4 text-indigo-400" />
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}

            {/* Selected Users */}
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map((user) => (
                  <Badge
                    key={user.userId}
                    variant="secondary"
                    className="flex items-center gap-1 px-2 py-1"
                  >
                    {user.displayName || user.email}
                    <button
                      type="button"
                      onClick={() => handleRemoveUser(user.userId)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Collab Companion Setup */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-indigo-400" />
                  Collab Companion (Recommended)
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  An AI assistant that can help with tasks and answer questions
                </p>
              </div>
              <input
                type="checkbox"
                checked={enableCompanion}
                onChange={(e) => setEnableCompanion(e.target.checked)}
                className="h-4 w-4 rounded border-gray-600"
              />
            </div>

            {enableCompanion && (
              <div className="space-y-3 pl-6 border-l-2 border-indigo-500/30">
                <div>
                  <Label htmlFor="companion-name">Companion Name</Label>
                  <Input
                    id="companion-name"
                    value={companionName}
                    onChange={(e) => setCompanionName(e.target.value)}
                    placeholder="Collab Companion"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="companion-personality">Personality Description</Label>
                  <Textarea
                    id="companion-personality"
                    value={companionPersonality}
                    onChange={(e) => setCompanionPersonality(e.target.value)}
                    placeholder="Describe how you want the companion to behave (e.g., 'Friendly and helpful', 'Professional and concise', 'Creative and inspiring')"
                    rows={3}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave empty for default personality
                  </p>
                </div>

                <div>
                  <Label htmlFor="companion-icon">Icon URL (Optional)</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      id="companion-icon"
                      value={companionIcon}
                      onChange={(e) => setCompanionIcon(e.target.value)}
                      placeholder="/images/lunchbox-ai-logo.png"
                    />
                    {companionIcon && (
                      <img
                        src={companionIcon}
                        alt="Companion icon"
                        className="h-8 w-8 rounded object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/lunchbox-ai-logo.png';
                        }}
                      />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Default: Lunchbox AI logo
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? 'Creating...' : 'Create Collaboration'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

