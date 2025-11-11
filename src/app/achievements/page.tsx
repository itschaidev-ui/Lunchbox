'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  Trophy, 
  Lock, 
  CheckCircle2,
  Target,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { getAchievementProgress, checkAndUnlockAchievements, ALL_ACHIEVEMENTS } from '@/lib/firebase-achievements';
import { useCredits } from '@/context/credits-context';

const CATEGORY_COLORS: Record<string, string> = {
  tasks: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  routines: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  streak: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  special: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
};

const CATEGORY_ICONS: Record<string, string> = {
  tasks: '📋',
  routines: '🔄',
  streak: '🔥',
  special: '⭐',
};

export default function AchievementsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { refreshCredits } = useCredits();
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [progress, setProgress] = useState<{
    achievements: Array<{
      id: string;
      name: string;
      description: string;
      icon: string;
      requirement: number;
      category: 'tasks' | 'routines' | 'streak' | 'special';
      unlocked: boolean;
      progress: number;
      maxProgress: number;
    }>;
    totalUnlocked: number;
    totalAchievements: number;
    allCompleted: boolean;
  } | null>(null);

  useEffect(() => {
    if (user?.uid) {
      loadAchievements();
    } else {
      router.push('/login');
    }
  }, [user?.uid]);

  const loadAchievements = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      const achievementProgress = await getAchievementProgress(user.uid);
      setProgress(achievementProgress);
    } catch (error: any) {
      console.error('Error loading achievements:', error);
      
      // Check if it's a Firestore index error
      const isIndexError = error?.code === 'failed-precondition' || 
                          error?.message?.includes('index') ||
                          error?.message?.includes('requires an index');
      
      toast({
        title: 'Error Loading Achievements',
        description: isIndexError 
          ? 'Firestore index required. Please check the console for the index creation link.'
          : 'Failed to load achievements. Please try again.',
        variant: 'destructive',
      });
      
      // Still set progress to empty state so page doesn't break
      setProgress({
        achievements: ALL_ACHIEVEMENTS.map(ach => ({
          ...ach,
          unlocked: false,
          progress: 0,
          maxProgress: ach.requirement,
        })),
        totalUnlocked: 0,
        totalAchievements: ALL_ACHIEVEMENTS.length,
        allCompleted: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckAchievements = async () => {
    if (!user?.uid) return;

    try {
      setChecking(true);
      const result = await checkAndUnlockAchievements(user.uid);
      
      if (result.newlyUnlocked.length > 0) {
        toast({
          title: '🎉 Achievement Unlocked!',
          description: `You unlocked ${result.newlyUnlocked.length} new achievement(s)!`,
        });
      }

      if (result.allCompleted) {
        toast({
          title: '🏆 All Achievements Completed!',
          description: 'You earned 500 credits for completing all achievements!',
        });
        // Refresh credits to show the new balance
        await refreshCredits();
      }

      // Reload achievements to show updated progress
      await loadAchievements();
    } catch (error) {
      console.error('Error checking achievements:', error);
      toast({
        title: 'Error',
        description: 'Failed to check achievements. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setChecking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  if (!progress) {
    return null;
  }

  const completionPercentage = Math.round((progress.totalUnlocked / progress.totalAchievements) * 100);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="mobile-button"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
              <Trophy className="h-8 w-8 text-yellow-500" />
              Achievements
            </h1>
            <p className="text-muted-foreground mt-1">
              Complete achievements to earn rewards!
            </p>
          </div>
          <Button
            onClick={handleCheckAchievements}
            disabled={checking}
            className="mobile-button"
          >
            {checking ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Check Progress
              </>
            )}
          </Button>
        </div>

        {/* Progress Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Overall Progress</CardTitle>
            <CardDescription>
              {progress.totalUnlocked} of {progress.totalAchievements} achievements unlocked
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Completion</span>
                <span className="text-sm font-bold">{completionPercentage}%</span>
              </div>
              <Progress value={completionPercentage} className="h-3" />
              {progress.allCompleted && (
                <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <Sparkles className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="font-semibold text-yellow-500">All Achievements Completed!</p>
                    <p className="text-sm text-muted-foreground">
                      You earned 500 credits for completing all achievements! 🎉
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Achievements by Category */}
        {['tasks', 'routines', 'streak', 'special'].map((category) => {
          const categoryAchievements = progress.achievements.filter(
            (a) => a.category === category
          );

          if (categoryAchievements.length === 0) return null;

          return (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>{CATEGORY_ICONS[category]}</span>
                  {category.charAt(0).toUpperCase() + category.slice(1)} Achievements
                </CardTitle>
                <CardDescription>
                  {categoryAchievements.filter((a) => a.unlocked).length} of{' '}
                  {categoryAchievements.length} unlocked
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryAchievements.map((achievement) => (
                    <Card
                      key={achievement.id}
                      className={`relative overflow-hidden ${
                        achievement.unlocked
                          ? 'border-green-500/50 bg-green-500/5'
                          : 'border-muted bg-muted/30'
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="text-4xl">{achievement.icon}</div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 className="font-semibold text-sm flex items-center gap-2">
                                  {achievement.name}
                                  {achievement.unlocked && (
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  )}
                                  {!achievement.unlocked && (
                                    <Lock className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </h3>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {achievement.description}
                                </p>
                              </div>
                            </div>
                            {!achievement.unlocked && (
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">Progress</span>
                                  <span className="font-medium">
                                    {achievement.progress} / {achievement.maxProgress}
                                  </span>
                                </div>
                                <Progress
                                  value={(achievement.progress / achievement.maxProgress) * 100}
                                  className="h-2"
                                />
                              </div>
                            )}
                            {achievement.unlocked && (
                              <Badge
                                variant="outline"
                                className="bg-green-500/10 text-green-500 border-green-500/20"
                              >
                                Unlocked
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              How Achievements Work
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              • Achievements are automatically checked when you complete tasks, routines, or maintain streaks
            </p>
            <p>
              • Click "Check Progress" to manually check for newly unlocked achievements
            </p>
            <p>
              • Complete all achievements to earn <strong className="text-foreground">500 credits</strong>!
            </p>
            <p>
              • Your progress is saved automatically
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

