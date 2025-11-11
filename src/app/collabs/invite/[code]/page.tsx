'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, XCircle, Users, Loader2 } from 'lucide-react';
import { acceptInviteLink, getInviteByCode } from '@/lib/firebase-collaborations';
import { useToast } from '@/hooks/use-toast';

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [inviteData, setInviteData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const code = params?.code as string;

  useEffect(() => {
    if (!code) {
      setError('Invalid invite code');
      setLoading(false);
      return;
    }

    loadInvite();
  }, [code]);

  const loadInvite = async () => {
    try {
      setLoading(true);
      const invite = await getInviteByCode(code);
      
      if (!invite || !invite.collaboration) {
        setError('Invalid or expired invite link');
        return;
      }
      
      setInviteData(invite);
    } catch (err: any) {
      console.error('Error loading invite:', err);
      setError('Failed to load invite link');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!user?.uid || !code) return;

    try {
      setAccepting(true);
      const result = await acceptInviteLink(code, user.uid);
      
      if (result.success && result.collabId) {
        toast({
          title: 'Success!',
          description: 'You have joined the collaboration',
        });
        
        // Redirect to the collaboration
        router.push(`/collabs`);
        // Set the selected collab in sessionStorage so it opens automatically
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('selectedCollabId', result.collabId);
        }
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to accept invite',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      console.error('Error accepting invite:', err);
      toast({
        title: 'Error',
        description: 'Failed to accept invite',
        variant: 'destructive',
      });
    } finally {
      setAccepting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <LoadingScreen 
        message={authLoading ? 'Loading...' : 'Loading invite...'} 
        size="lg" 
      />
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-4">
        <Card className="p-8 max-w-md w-full bg-gray-800/50 border-gray-700">
          <div className="text-center space-y-4">
            <XCircle className="h-12 w-12 text-red-400 mx-auto" />
            <h1 className="text-2xl font-bold">Login Required</h1>
            <p className="text-muted-foreground">
              Please log in to accept this invitation
            </p>
            <Button onClick={() => router.push('/login')}>
              Go to Login
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !inviteData) {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-4">
        <Card className="p-8 max-w-md w-full bg-gray-800/50 border-gray-700">
          <div className="text-center space-y-4">
            <XCircle className="h-12 w-12 text-red-400 mx-auto" />
            <h1 className="text-2xl font-bold">Invalid Invite</h1>
            <p className="text-muted-foreground">
              {error || 'This invite link is invalid or has expired'}
            </p>
            <Button onClick={() => router.push('/collabs')}>
              Go to Collabs
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const { collaboration } = inviteData;

  return (
    <div className="flex h-screen items-center justify-center bg-background p-4">
      <Card className="p-8 max-w-md w-full bg-gradient-to-br from-gray-800/50 to-gray-900/30 border-gray-700">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full"></div>
              <div className="relative p-4 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                <Users className="h-8 w-8 text-indigo-400" />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              You've been invited!
            </h1>
            <p className="text-muted-foreground">
              Join this collaboration
            </p>
          </div>

          <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 space-y-3">
            <div>
              <h2 className="font-semibold text-lg mb-1">{collaboration.name}</h2>
              {collaboration.description && (
                <p className="text-sm text-muted-foreground">
                  {collaboration.description}
                </p>
              )}
            </div>
            
            {inviteData.expiresAt && (
              <div className="text-xs text-muted-foreground">
                Expires: {new Date(inviteData.expiresAt).toLocaleDateString()}
              </div>
            )}
            
            {inviteData.maxUses && (
              <div className="text-xs text-muted-foreground">
                Uses: {inviteData.uses} / {inviteData.maxUses}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => router.push('/collabs')}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAccept}
              disabled={accepting}
              className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
            >
              {accepting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Joining...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Accept Invite
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

