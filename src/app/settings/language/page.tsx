'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useLanguage, languages } from '@/context/language-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Globe, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { saveSettingsToFirestore, saveSettingsToLocalStorage, loadSettingsFromFirestore, loadSettingsFromLocalStorage } from '@/lib/settings-serializer';

export default function LanguageSettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [hasChanged, setHasChanged] = useState(false);

  // Load saved settings
  useEffect(() => {
    const loadSettings = async () => {
      let settings = loadSettingsFromLocalStorage();
      
      if (user && !settings) {
        settings = await loadSettingsFromFirestore(user.uid);
      }
      
      if (settings?.language) {
        setSelectedLanguage(settings.language.code || 'en');
      }
    };
    
    loadSettings();
  }, [user]);

  // Auto-save when language changes
  useEffect(() => {
    if (!hasChanged) return;
    
    const autoSave = async () => {
      const language = languages.find(l => l.code === selectedLanguage);
      if (!language) return;
      
      const languageSettings = {
        code: language.code,
        name: language.name
      };
      
      saveSettingsToLocalStorage({ language: languageSettings });
      
      if (user) {
        try {
          await saveSettingsToFirestore(user.uid, { language: languageSettings });
          toast({
            title: "Language updated",
            description: `Language set to ${language.name}. Changes will take effect after reload.`,
          });
        } catch (error) {
          console.error('Error saving to Firestore:', error);
        }
      }
    };
    
    // Debounce auto-save
    const timer = setTimeout(() => {
      autoSave();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [selectedLanguage, hasChanged, user]);

  const handleLanguageChange = (languageCode: string) => {
    setSelectedLanguage(languageCode);
    setHasChanged(true);
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
                <h1 className="text-2xl font-bold text-foreground">Language</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="space-y-6">
          {/* Current Language */}
          <Card className="mobile-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <span>Select Language</span>
              </CardTitle>
              <CardDescription>
                Choose your preferred language for the interface
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {languages.map((language) => (
                  <div
                    key={language.code}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-primary ${
                      selectedLanguage === language.code 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border'
                    }`}
                    onClick={() => handleLanguageChange(language.code)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{language.flag}</span>
                        <div>
                          <p className="font-medium">{language.name}</p>
                          <p className="text-sm text-muted-foreground">{language.native}</p>
                        </div>
                      </div>
                      {selectedLanguage === language.code && (
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">Current</Badge>
                          <Check className="h-5 w-5 text-primary" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>


          {/* Auto-save indicator */}
          <div className="text-center text-sm text-muted-foreground">
            Changes are saved automatically
          </div>
        </div>
      </div>
    </div>
  );
}

