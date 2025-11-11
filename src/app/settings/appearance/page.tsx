'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Palette, Monitor, Brush, Lock, Sparkles } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { saveSettingsToFirestore, saveSettingsToLocalStorage, loadSettingsFromFirestore, loadSettingsFromLocalStorage } from '@/lib/settings-serializer';
import { subscribeToThemeChanges, PREMIUM_THEMES } from '@/lib/firebase-redemptions';
import { ThemePreview } from '@/components/settings/theme-preview';
import { ThemeUnlockModal } from '@/components/settings/theme-unlock-modal';

interface ColorScheme {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  isPremium: boolean;
  cost?: number;
  description?: string;
}

export default function AppearanceSettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme, setTheme, applyColors, clearCustomColors } = useTheme();
  const [primaryColor, setPrimaryColor] = useState('#8b5cf6');
  const [secondaryColor, setSecondaryColor] = useState('#ec4899');
  const [accentColor, setAccentColor] = useState('#3b82f6');
  const [colorScheme, setColorScheme] = useState<string | undefined>();
  const [ownedThemes, setOwnedThemes] = useState<string[]>([]);
  const [selectedLockedTheme, setSelectedLockedTheme] = useState<ColorScheme | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Define all color schemes (free + premium)
  const colorSchemes: ColorScheme[] = [
    // FREE THEMES
    {
      id: 'original',
      name: 'Original',
      primary: '#8b5cf6',
      secondary: '#ec4899',
      accent: '#3b82f6',
      isPremium: false,
      description: 'Classic dark theme with purple accents'
    },
    {
      id: 'dark',
      name: 'Dark',
      primary: '#1f2937',
      secondary: '#374151',
      accent: '#6366f1',
      isPremium: false,
      description: 'Dark gray theme with subtle accents'
    },
    {
      id: 'light',
      name: 'Light',
      primary: '#3b82f6',
      secondary: '#06b6d4',
      accent: '#8b5cf6',
      isPremium: false,
      description: 'Clean light theme for daytime use'
    },
    // PREMIUM THEMES
    {
      id: 'dark-premium',
      name: 'Better Dark',
      primary: '#2563EB',
      secondary: '#7C3AED',
      accent: '#DC2626',
      isPremium: true,
      cost: 1200,
      description: 'Premium dark theme with stunning blue and purple accents'
    },
    {
      id: 'neon-theme',
      name: 'Neon',
      primary: '#39FF14',
      secondary: '#FF10F0',
      accent: '#00F0FF',
      isPremium: true,
      cost: 2500,
      description: 'Vibrant cyberpunk neon theme with electric colors'
    },
    {
      id: 'ocean-theme',
      name: 'Ocean',
      primary: '#0EA5E9',
      secondary: '#06B6D4',
      accent: '#14B8A6',
      isPremium: true,
      cost: 4000,
      description: 'Calming ocean theme with deep blues and teals'
    },
  ];

  // Load saved settings
  useEffect(() => {
    const loadSettings = async () => {
      let settings = loadSettingsFromLocalStorage();
      
      if (user && !settings) {
        settings = await loadSettingsFromFirestore(user.uid);
      }
      
      if (settings?.appearance) {
        setPrimaryColor(settings.appearance.primaryColor || '#8b5cf6');
        setSecondaryColor(settings.appearance.secondaryColor || '#ec4899');
        setAccentColor(settings.appearance.accentColor || '#3b82f6');
        setColorScheme(settings.appearance.colorScheme);
      }
    };
    
    loadSettings();
  }, [user]);

  // Subscribe to real-time theme ownership changes
  useEffect(() => {
    if (!user) {
      setOwnedThemes([]);
      return;
    }

    console.log('Setting up theme ownership subscription for user:', user.uid);
    const unsubscribe = subscribeToThemeChanges(user.uid, (themes) => {
      console.log('Owned themes updated:', themes);
      setOwnedThemes(themes);
    });

    return () => unsubscribe();
  }, [user]);

  // Apply theme colors to CSS variables in real-time using global applyColors
  // Only apply for premium themes, default themes use CSS
  useEffect(() => {
    const isPremiumTheme = colorScheme && !['original', 'dark', 'light'].includes(colorScheme);
    
    if (isPremiumTheme) {
      applyColors(primaryColor, secondaryColor, accentColor);
    }
  }, [primaryColor, secondaryColor, accentColor, colorScheme, applyColors]);

  // Auto-save when colors change
  useEffect(() => {
    const autoSave = async () => {
      const appearance = {
        primaryColor,
        secondaryColor,
        accentColor,
        colorScheme
      };
      
      saveSettingsToLocalStorage({ appearance });
      
      if (user) {
        try {
          await saveSettingsToFirestore(user.uid, { appearance });
        } catch (error) {
          console.error('Error saving to Firestore:', error);
        }
      }
    };
    
    // Debounce auto-save
    const timer = setTimeout(() => {
      autoSave();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [primaryColor, secondaryColor, accentColor, colorScheme, user]);

  const handleReset = () => {
    setPrimaryColor('#8b5cf6');
    setSecondaryColor('#ec4899');
    setAccentColor('#3b82f6');
    toast({
      title: "Reset to default",
      description: "Appearance settings have been reset.",
    });
  };

  const handleThemeSelect = (scheme: ColorScheme) => {
    // Check if theme is locked
    if (scheme.isPremium && !ownedThemes.includes(scheme.id)) {
      setSelectedLockedTheme(scheme);
      return;
    }

    // Update state colors
    setPrimaryColor(scheme.primary);
    setSecondaryColor(scheme.secondary);
    setAccentColor(scheme.accent);
    setColorScheme(scheme.id);
    
    // For default themes (original, dark, light), clear custom colors
    // For premium themes, apply custom colors
    if (scheme.isPremium) {
      // Premium themes: apply custom colors
      applyColors(scheme.primary, scheme.secondary, scheme.accent);
      setTheme('current'); // All premium themes use dark base
    } else {
      // Default themes: clear custom colors and use CSS defaults
      clearCustomColors();
      
      if (scheme.id === 'original') {
        setTheme('original');
      } else if (scheme.id === 'light') {
        setTheme('light');
      } else if (scheme.id === 'dark') {
        setTheme('current');
      }
    }
    
    toast({
      title: `Applied ${scheme.name} theme`,
      description: "Theme changed successfully.",
    });
  };

  const isThemeLocked = (scheme: ColorScheme) => {
    return scheme.isPremium && !ownedThemes.includes(scheme.id);
  };

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
                onClick={() => router.push('/settings')}
                className="hover:bg-secondary"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Appearance</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="space-y-6">
          {/* Theme Selection */}
          <Card className="mobile-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Palette className="h-5 w-5" />
                <span>Color Themes</span>
              </CardTitle>
              <CardDescription>
                Choose from free themes or unlock premium themes in Discord
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {colorSchemes.map((scheme) => {
                  const locked = isThemeLocked(scheme);
                  const isSelected = colorScheme === scheme.id || 
                    (!colorScheme && scheme.id === 'original');

                  return (
                    <div
                      key={scheme.id}
                      className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-primary bg-primary/5 shadow-lg' 
                          : locked
                          ? 'border-border hover:border-border'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => handleThemeSelect(scheme)}
                    >
                      {/* Lock Overlay */}
                      {locked && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
                          <div className="text-center p-4">
                            <Lock className="h-8 w-8 mx-auto mb-2 text-white" />
                            <p className="text-white font-semibold mb-1">Locked</p>
                            <p className="text-xs text-gray-300 mb-2">Redeem in Discord</p>
                            <Badge className="bg-primary/80 text-white">
                              {scheme.cost} credits
                            </Badge>
                          </div>
                        </div>
                      )}

                      {/* Theme Content */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {scheme.isPremium ? (
                              <Sparkles className="h-4 w-4 text-yellow-500" />
                            ) : (
                              <Monitor className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className="font-semibold">{scheme.name}</span>
                          </div>
                          {scheme.isPremium && !locked && (
                            <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-500">
                              Owned
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <div 
                            className="w-6 h-6 rounded-full border-2 border-border"
                            style={{ backgroundColor: scheme.primary }}
                          />
                          <div 
                            className="w-6 h-6 rounded-full border-2 border-border"
                            style={{ backgroundColor: scheme.secondary }}
                          />
                          <div 
                            className="w-6 h-6 rounded-full border-2 border-border"
                            style={{ backgroundColor: scheme.accent }}
                          />
                        </div>

                        <p className="text-xs text-muted-foreground">
                          {scheme.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Theme Preview */}
          <Card className="mobile-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Monitor className="h-5 w-5" />
                    <span>Preview</span>
                  </CardTitle>
                  <CardDescription>
                    See how your theme looks in action
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  {showPreview ? 'Hide' : 'Show'} Preview
                </Button>
              </div>
            </CardHeader>
            {showPreview && (
              <CardContent>
                <ThemePreview
                  colors={{
                    primary: primaryColor,
                    secondary: secondaryColor,
                    accent: accentColor,
                  }}
                  name={colorSchemes.find(s => s.id === colorScheme)?.name || 'Current'}
                />
              </CardContent>
            )}
          </Card>

          {/* Custom Colors */}
          <Card className="mobile-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brush className="h-5 w-5" />
                <span>Custom Colors</span>
              </CardTitle>
              <CardDescription>
                Fine-tune individual colors to create your perfect palette
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="flex items-center gap-2 mb-2">
                  <div 
                    className="w-5 h-5 rounded border-2 border-border"
                    style={{ backgroundColor: primaryColor }}
                  />
                  <span>Primary Color</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-20 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 mb-2">
                  <div 
                    className="w-5 h-5 rounded border-2 border-border"
                    style={{ backgroundColor: secondaryColor }}
                  />
                  <span>Secondary Color</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-20 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 mb-2">
                  <div 
                    className="w-5 h-5 rounded border-2 border-border"
                    style={{ backgroundColor: accentColor }}
                  />
                  <span>Accent Color</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-20 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Auto-save indicator */}
          <div className="text-center text-sm text-muted-foreground">
            Changes are saved automatically
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleReset} className="flex-1 mobile-button">
              Reset to Default
            </Button>
          </div>
        </div>
      </div>

      {/* Theme Unlock Modal */}
      {selectedLockedTheme && (
        <ThemeUnlockModal
          isOpen={!!selectedLockedTheme}
          onClose={() => setSelectedLockedTheme(null)}
          theme={{
            ...selectedLockedTheme,
            id: selectedLockedTheme.id,
            name: selectedLockedTheme.name,
            description: selectedLockedTheme.description || '',
            cost: selectedLockedTheme.cost || 0,
            colors: {
              primary: selectedLockedTheme.primary,
              secondary: selectedLockedTheme.secondary,
              accent: selectedLockedTheme.accent,
            },
          }}
        />
      )}
    </div>
  );
}
