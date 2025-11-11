'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Palette, 
  User, 
  Bell, 
  Shield, 
  Sparkles, 
  Moon, 
  Sun, 
  Monitor,
  Settings,
  Download,
  Wand2,
  Zap,
  MessageSquare,
  Link2,
  Trophy,
} from 'lucide-react';
import { FloatingSaveButton } from '@/components/ui/floating-save-button';
import { useTheme } from '@/context/theme-context';
import { useNavbarSettings } from '@/context/navbar-settings-context';
import { toast } from '@/hooks/use-toast';
import { DiscordLinkSection } from '@/components/settings/discord-link-section';
import { Input } from '@/components/ui/input';

type Theme = 'original' | 'current' | 'light';

function isValidEmail(email: string) {
  const e = email.trim().toLowerCase();
  return /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(e);
}

function EmailListManager() {
  const { user } = useAuth();
  const [emails, setEmails] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { db } = await import('@/lib/firebase');
      const { doc, getDoc } = await import('firebase/firestore');
      const ref = doc(db, 'user_settings', user.uid);
      const snap = await getDoc(ref);
      const data: any = snap.exists() ? snap.data() : {};
      const list = Array.isArray(data.taskCompletionEmails) ? data.taskCompletionEmails : [];
      setEmails(list);
    })();
  }, [user]);

  const save = async (list: string[]) => {
    if (!user) return;
    setSaving(true);
    try {
      const { db } = await import('@/lib/firebase');
      const { doc, setDoc } = await import('firebase/firestore');
      const ref = doc(db, 'user_settings', user.uid);
      await setDoc(ref, {
        userId: user.uid,
        taskCompletionEmails: list,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      toast({ title: 'Saved', description: 'Completion email list updated.' });
    } catch (err: any) {
      console.error('Save emails failed:', err?.message || err);
      toast({ title: 'Failed', description: 'Could not save emails.', variant: 'destructive' as any });
    } finally {
      setSaving(false);
    }
  };

  const addEmail = async () => {
    const e = input.trim().toLowerCase();
    setError(null);
    if (!e) return;
    if (!isValidEmail(e)) {
      setError('Please enter a valid email address (e.g., name@example.com).');
      return;
    }
    if (emails.includes(e)) {
      setError('That email is already on the list.');
      return;
    }
    const next = Array.from(new Set([...emails, e]));
    setEmails(next);
    setInput('');
    await save(next);
  };

  const removeEmail = async (e: string) => {
    const next = emails.filter(x => x !== e);
    setEmails(next);
    await save(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder="name@example.com"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1"
        />
        <Button onClick={addEmail} disabled={saving}>Add</Button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {emails.length === 0 ? (
        <p className="mobile-caption text-muted-foreground">No emails added yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {emails.map(e => (
            <Badge key={e} variant="secondary" className="flex items-center gap-2">
              {e}
              <button className="text-red-400 hover:text-red-300" onClick={() => removeEmail(e)}>×</button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { theme: selectedTheme, setTheme } = useTheme();
  const { settings, updateSettings, resetSettings } = useNavbarSettings();
  const [notifications, setNotifications] = useState(true);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [advancedAI, setAdvancedAI] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Load saved settings from localStorage
    const savedNotifications = localStorage.getItem('lunchbox-notifications') === 'true';
    const savedAdvancedAI = localStorage.getItem('lunchbox-advanced-ai') === 'true';
    setNotifications(savedNotifications);
    setAdvancedAI(savedAdvancedAI);
  }, []);

  const handleThemeChange = (theme: Theme) => {
    setTheme(theme);
    setHasUnsavedChanges(true);
  };

  const handleNotificationChange = (checked: boolean) => {
    setNotifications(checked);
    setHasUnsavedChanges(true);
  };

  const handleAdvancedAIChange = (checked: boolean) => {
    setAdvancedAI(checked);
    setHasUnsavedChanges(true);
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    
    // Save to localStorage
    localStorage.setItem('lunchbox-notifications', notifications.toString());
    localStorage.setItem('lunchbox-advanced-ai', advancedAI.toString());
    
    // Save to Firestore for server-side access
    try {
      const { db } = await import('@/lib/firebase');
      const { doc, setDoc } = await import('firebase/firestore');
      
      if (user) {
        const userRef = doc(db, 'users', user.uid || user.email || 'unknown');
        await setDoc(userRef, { 
          notificationsEnabled: notifications,
          advancedAIEnabled: advancedAI
        }, { merge: true });
        console.log('✅ Saved settings to Firestore');
      }
    } catch (error) {
      console.error('Error saving to Firestore:', error);
      // Continue anyway - localStorage saved successfully
    }
    
    setHasUnsavedChanges(false);
    setIsSaving(false);
    
    toast({
      title: "Settings saved",
      description: "Your preferences have been saved.",
    });
  };

  const handleExportData = () => {
    const userData = {
      theme: selectedTheme,
      notifications,
      settings,
      timestamp: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(userData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'lunchbox-settings.json';
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Data exported",
      description: "Your settings have been downloaded.",
    });
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const handleDeactivateAccount = () => {
    if (confirm('Are you sure you want to deactivate your account? This action cannot be undone.')) {
      toast({
        title: "Account deactivation",
        description: "Account deactivation feature coming soon.",
      });
    }
  };

  // Show public settings for unauthenticated users
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push('/')}
                  className="hover:bg-secondary"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Settings</h1>
                  <p className="text-muted-foreground">Customize your experience</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  Guest User
                </Badge>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="grid gap-6">
            {/* Sign In Prompt */}
            <Card className="border-primary/50 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Sign In Required</span>
                </CardTitle>
                <CardDescription>
                  Create an account to access personalized settings and save your preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Sign in to unlock personalized settings, save your preferences, and access advanced features.
                </p>
                <div className="flex gap-2">
                  <Button onClick={() => router.push('/')} className="flex-1">
                    <User className="h-4 w-4 mr-2" />
                    Sign In
                  </Button>
                  <Button variant="outline" onClick={() => router.push('/')} className="flex-1">
                    Continue as Guest
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Public Theme Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Palette className="h-5 w-5" />
                  <span>Theme & Appearance</span>
                </CardTitle>
                <CardDescription>
                  Choose your preferred theme and visual style
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Original Theme */}
                  <div 
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedTheme === 'original' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => handleThemeChange('original')}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <Moon className="h-5 w-5 text-primary" />
                      <span className="font-semibold">Original</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Classic dark theme with purple accents
                    </p>
                  </div>

                  {/* Current Theme */}
                  <div 
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedTheme === 'current' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => handleThemeChange('current')}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <Monitor className="h-5 w-5 text-primary" />
                      <span className="font-semibold">Current</span>
                      <Badge variant="secondary" className="text-xs">Recommended</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Modern theme with your custom palette
                    </p>
                  </div>

                  {/* Light Theme */}
                  <div 
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedTheme === 'light' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => handleThemeChange('light')}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <Sun className="h-5 w-5 text-primary" />
                      <span className="font-semibold">Light</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Clean light theme for daytime use
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Public Features Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5" />
                  <span>Premium Features</span>
                </CardTitle>
                <CardDescription>
                  Unlock advanced features by signing in
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="flex items-center space-x-3 p-3 border border-border rounded-lg">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Personalized Settings</p>
                      <p className="text-sm text-muted-foreground">Save your preferences across devices</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 border border-border rounded-lg">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Smart Notifications</p>
                      <p className="text-sm text-muted-foreground">Get notified about important tasks</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 border border-border rounded-lg">
                    <Wand2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">AI Customization</p>
                      <p className="text-sm text-muted-foreground">Let AI personalize your experience</p>
                    </div>
                  </div>
                </div>
                <Button onClick={() => router.push('/')} className="w-full">
                  <User className="h-4 w-4 mr-2" />
                  Sign In to Unlock Features
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
    </div>
  );
  }

  // Authenticated user settings
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/')}
                className="hover:bg-secondary"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Settings</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="space-y-6">
          {/* Profile Section */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Profile</h2>
            <Card className="mobile-card">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  {user?.photoURL ? (
                    <div className="relative w-12 h-12">
                      <Image 
                        src={user.photoURL} 
                        alt={user.displayName || 'Profile'} 
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full object-cover border-2 border-primary/20"
                        unoptimized
                      />
                      <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-0.5">
                        <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center border-2 border-primary/20">
                      <User className="h-6 w-6 text-white" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="mobile-subheading">{user?.displayName || 'User'}</h3>
                    <p className="mobile-caption">{user?.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {user?.providerData && user.providerData[0] && (
                        <Badge variant="secondary" className="text-xs">
                          {user.providerData[0].providerId === 'google.com' ? 'Google' : 
                           user.providerData[0].providerId === 'discord.com' ? 'Discord' : 
                           user.providerData[0].providerId === 'password' ? 'Email' : 'Account'}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Settings Sections */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Preferences</h2>
            <Card className="mobile-card">
              <CardContent className="p-0">
                <div className="space-y-1">
                  <div 
                    className="flex items-center justify-between hover:bg-muted/50 p-2 rounded-lg transition-colors cursor-pointer"
                    onClick={() => router.push('/settings/appearance')}
                  >
                    <div className="flex items-center space-x-3">
                      <Palette className="h-5 w-5 text-muted-foreground" />
                      <span className="mobile-body">Appearance</span>
                    </div>
                    <ArrowLeft className="h-4 w-4 rotate-180 text-muted-foreground" />
                  </div>
                  
                  <div 
                    className="flex items-center justify-between hover:bg-muted/50 p-2 rounded-lg transition-colors cursor-pointer"
                    onClick={() => router.push('/settings/language')}
                  >
                    <div className="flex items-center space-x-3">
                      <Settings className="h-5 w-5 text-muted-foreground" />
                      <span className="mobile-body">Language</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="mobile-caption">English</span>
                      <ArrowLeft className="h-4 w-4 rotate-180 text-muted-foreground" />
                    </div>
                  </div>

                  <div 
                    className="flex items-center justify-between hover:bg-muted/50 p-2 rounded-lg transition-colors cursor-pointer"
                    onClick={() => router.push('/settings/bottom-bar')}
                  >
                    <div className="flex items-center space-x-3">
                      <Sparkles className="h-5 w-5 text-muted-foreground" />
                      <span className="mobile-body">Bottom Bar</span>
                    </div>
                    <ArrowLeft className="h-4 w-4 rotate-180 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Notifications Section */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
            <Card className="mobile-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <span className="mobile-body">Text Alerts</span>
                      <p className="mobile-caption">Timer, overdue tasks, and other notifications</p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications}
                    onCheckedChange={handleNotificationChange}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Accessibility Section */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Accessibility</h2>
            <Card className="mobile-card">
              <CardContent className="p-6 space-y-4">
                <p className="mobile-caption text-muted-foreground">
                  Add emails to receive notifications when your tasks are completed or marked incomplete.
                </p>
                <EmailListManager />
              </CardContent>
            </Card>
          </div>

          {/* Achievements Section */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Achievements</h2>
            <Card className="mobile-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    <div>
                      <p className="font-medium">View Achievements</p>
                      <p className="text-sm text-muted-foreground">
                        Complete achievements to earn rewards!
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => router.push('/achievements')}
                    variant="outline"
                  >
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Connections Section */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Connections</h2>
            <DiscordLinkSection />
          </div>

          {/* Experimental Section */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              <h2 className="text-lg font-semibold text-foreground">Experimental</h2>
              <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                Beta
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Try out cutting-edge features that are still in development. These may change or be removed in future updates.
            </p>
            
            <Card className="mobile-card border-yellow-500/20 bg-yellow-500/5">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <MessageSquare className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <span className="mobile-body">Advanced AI Capabilities</span>
                        <p className="mobile-caption">Adds canvas, code, and plan modes into chat</p>
                      </div>
                    </div>
                    <Switch
                      checked={advancedAI}
                      onCheckedChange={handleAdvancedAIChange}
                    />
                  </div>
                  <div className="p-3 bg-background/50 rounded-lg border border-border/50">
                    <p className="text-xs text-muted-foreground">
                      <strong>What this does:</strong> When enabled, the AI assistant will automatically detect when you want to create visual content (canvas), write code, or make plans, and seamlessly integrate these capabilities into your regular chat conversations.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Floating Save Button */}
      <FloatingSaveButton 
        onSave={handleSaveSettings}
        hasChanges={hasUnsavedChanges}
        isLoading={isSaving}
      />
    </div>
  );
}