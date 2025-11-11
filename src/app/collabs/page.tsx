'use client';

import { useEffect, useState } from 'react';
import { Users, Plus, Search, ArrowRight, Settings, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/auth-context';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { useRouter } from 'next/navigation';
import { NewCollabDialog } from '@/components/collabs/new-collab-dialog';
import { CollabCompanionChat } from '@/components/collabs/collab-companion-chat';
import { CollabTasks } from '@/components/collabs/collab-tasks';
import { InviteLinks } from '@/components/collabs/invite-links';
import { getUserCollaborations } from '@/lib/firebase-collaborations';
import type { Collaboration } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function CollabsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  const [collabs, setCollabs] = useState<Collaboration[]>([]);
  const [loadingCollabs, setLoadingCollabs] = useState(true);
  const [showNewCollabDialog, setShowNewCollabDialog] = useState(false);
  const [selectedCollabId, setSelectedCollabId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Wait for auth state to be determined before redirecting
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        setHasCheckedAuth(true);
        if (!user) {
          router.push('/');
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [user, loading, router]);

  // Load collaborations
  useEffect(() => {
    if (user?.uid && hasCheckedAuth) {
      loadCollaborations();
      
      // Check if there's a selected collab from invite acceptance
      if (typeof window !== 'undefined') {
        const savedCollabId = sessionStorage.getItem('selectedCollabId');
        if (savedCollabId) {
          setSelectedCollabId(savedCollabId);
          sessionStorage.removeItem('selectedCollabId');
        }
      }
    }
  }, [user?.uid, hasCheckedAuth]);

  const loadCollaborations = async () => {
    if (!user?.uid) return;
    try {
      setLoadingCollabs(true);
      const userCollabs = await getUserCollaborations(user.uid);
      setCollabs(userCollabs);
    } catch (error) {
      console.error('Error loading collaborations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load collaborations',
        variant: 'destructive',
      });
    } finally {
      setLoadingCollabs(false);
    }
  };

  // Show loading while checking auth or if auth is loading
  if (loading || !hasCheckedAuth) {
    return (
      <LoadingScreen 
        message="Loading Collabs..." 
        size="lg"
      />
    );
  }

  // If no user after auth check, return null (redirect is happening)
  if (!user) {
    return null;
  }

  // Filter collaborations by search query
  const filteredCollabs = collabs.filter(collab =>
    collab.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    collab.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedCollab = selectedCollabId 
    ? collabs.find(c => c.id === selectedCollabId)
    : null;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedCollabId ? (
          // Show collaboration details and tasks
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Header */}
              <div className="p-6 md:p-8 border-b border-gray-700/50 bg-gradient-to-r from-gray-900/50 to-gray-800/30">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedCollabId(null)}
                        className="hover:bg-gray-800"
                      >
                        ← Back
                      </Button>
                      <div className="h-6 w-px bg-gray-700"></div>
                      <h1 className="text-2xl font-bold font-headline tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        {selectedCollab?.name}
                      </h1>
                    </div>
                    {selectedCollab?.description && (
                      <p className="text-muted-foreground text-sm ml-12">
                        {selectedCollab.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              {/* Tasks and Invites */}
              <div className="flex-1 overflow-hidden">
                <Tabs defaultValue="tasks" className="h-full flex flex-col">
                  <div className="px-6 md:px-8 border-b border-gray-700/50">
                    <TabsList className="bg-transparent">
                      <TabsTrigger value="tasks" className="data-[state=active]:bg-gray-800">
                        Tasks
                      </TabsTrigger>
                      <TabsTrigger value="invites" className="data-[state=active]:bg-gray-800">
                        Invite Links
                      </TabsTrigger>
                    </TabsList>
                  </div>
                  <TabsContent value="tasks" className="flex-1 overflow-hidden m-0">
                    <CollabTasks collabId={selectedCollabId} />
                  </TabsContent>
                  <TabsContent value="invites" className="flex-1 overflow-y-auto p-6 md:p-8 m-0">
                    <InviteLinks collabId={selectedCollabId} />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
            {/* Companion Chat Sidebar */}
            {selectedCollab && selectedCollab.companion?.enabled && (
              <div className="w-96 border-l border-gray-700">
                <CollabCompanionChat collabId={selectedCollab.id} />
              </div>
            )}
          </div>
        ) : (
          // Show collaborations list
          <div className="p-4 md:p-8 space-y-6 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold font-headline tracking-tight flex items-center gap-3">
                <Users className="h-8 w-8 text-indigo-400" />
                Collabs
              </h1>
              <p className="text-muted-foreground">
                Collaborate with others on tasks and projects
              </p>
            </div>
            <Button 
              onClick={() => setShowNewCollabDialog(true)}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Collab
            </Button>
          </div>

          {/* Search Bar */}
          <Card className="p-4 bg-gray-800/50 border-gray-700">
            <div className="flex items-center gap-3">
              <Search className="h-5 w-5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search collaborations..."
                className="bg-gray-900/50 border-gray-700 focus:border-indigo-500"
              />
            </div>
          </Card>

          {/* Collaborations List */}
          {loadingCollabs ? (
            <div className="flex items-center justify-center py-12">
              <LoadingScreen message="Loading collaborations..." size="md" />
            </div>
          ) : filteredCollabs.length === 0 ? (
            <Card className="p-12 bg-gray-800/30 border-gray-700 border-dashed">
              <div className="text-center space-y-4">
                <Users className="h-12 w-12 text-muted-foreground mx-auto" />
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">
                    {searchQuery ? 'No matches found' : 'No Collaborations Yet'}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    {searchQuery 
                      ? 'Try a different search term'
                      : 'Start collaborating by creating a new collab or joining an existing one.'}
                  </p>
                </div>
                {!searchQuery && (
                  <Button 
                    onClick={() => setShowNewCollabDialog(true)}
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Collab
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredCollabs.map((collab) => (
                <Card
                  key={collab.id}
                  className="group p-6 bg-gradient-to-br from-gray-800/50 to-gray-900/30 border border-gray-700/50 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-200 cursor-pointer"
                  onClick={() => setSelectedCollabId(collab.id)}
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg mb-1 group-hover:text-indigo-400 transition-colors">
                          {collab.name}
                        </h3>
                        {collab.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {collab.description}
                          </p>
                        )}
                      </div>
                      {collab.companion?.enabled && (
                        <div className="relative shrink-0">
                          <div className="absolute inset-0 bg-indigo-500/20 blur-md rounded-full"></div>
                          <div className="relative p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                            <MessageSquare className="h-4 w-4 text-indigo-400" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-700/50">
                      <div className="flex items-center gap-2">
                        {collab.companion?.enabled ? (
                          <>
                            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
                            <span className="text-xs text-muted-foreground">AI Companion Active</span>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">No Companion</span>
                        )}
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
          </div>
        )}
      </div>

      {/* New Collab Dialog */}
      <NewCollabDialog
        open={showNewCollabDialog}
        onClose={() => setShowNewCollabDialog(false)}
        onSuccess={() => {
          loadCollaborations();
          setShowNewCollabDialog(false);
        }}
      />
    </div>
  );
}

