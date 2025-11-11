'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useAuth } from './auth-context';
import { getUserPreferences, saveUserPreferences } from '@/lib/firebase-user-preferences';
import { loadSettingsFromLocalStorage, loadSettingsFromFirestore } from '@/lib/settings-serializer';

type Theme = 'original' | 'current' | 'light';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  applyColors: (primaryColor: string, secondaryColor: string, accentColor: string) => void;
  clearCustomColors: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('current');
  const { user } = useAuth();

  const hexToHSL = useCallback((hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  }, []);

  const clearCustomColors = useCallback(() => {
    const root = document.documentElement;
    
    // Remove all custom color overrides to let CSS theme classes take over
    root.style.removeProperty('--primary');
    root.style.removeProperty('--secondary');
    root.style.removeProperty('--accent');
    root.style.removeProperty('--ring');
    root.style.removeProperty('--background');
    root.style.removeProperty('--card');
    root.style.removeProperty('--popover');
    root.style.removeProperty('--border');
    root.style.removeProperty('--input');
    root.style.removeProperty('--muted');
    root.style.removeProperty('--muted-foreground');
    root.style.removeProperty('--foreground');
    root.style.removeProperty('--card-foreground');
    root.style.removeProperty('--popover-foreground');
    root.style.removeProperty('--color-primary');
    root.style.removeProperty('--color-secondary');
    root.style.removeProperty('--color-accent');
    
    console.log('🧹 Cleared custom colors - using default theme CSS');
  }, []);

  const applyColors = useCallback((primaryColor: string, secondaryColor: string, accentColor: string) => {
    const root = document.documentElement;
    
    // Apply as HSL (what the app uses)
    const primaryHSL = hexToHSL(primaryColor);
    const secondaryHSL = hexToHSL(secondaryColor);
    const accentHSL = hexToHSL(accentColor);
    
    // Extract hue values for creating harmonious backgrounds
    const primaryHue = primaryHSL.split(' ')[0];
    const secondaryHue = secondaryHSL.split(' ')[0];
    const accentHue = accentHSL.split(' ')[0];
    
    // Set the main theme colors
    root.style.setProperty('--primary', primaryHSL);
    root.style.setProperty('--secondary', secondaryHSL);
    root.style.setProperty('--accent', accentHSL);
    
    // Update ring/focus colors to match primary
    root.style.setProperty('--ring', primaryHSL);
    
    // Apply themed backgrounds (darker versions for contrast)
    root.style.setProperty('--background', `${primaryHue} 15% 8%`);
    root.style.setProperty('--card', `${primaryHue} 18% 12%`);
    root.style.setProperty('--popover', `${primaryHue} 18% 10%`);
    
    // Update border colors to match theme with subtle transparency
    root.style.setProperty('--border', `${accentHue} 30% 25%`);
    root.style.setProperty('--input', `${primaryHue} 20% 18%`);
    
    // Update muted/secondary backgrounds
    root.style.setProperty('--muted', `${secondaryHue} 15% 15%`);
    root.style.setProperty('--muted-foreground', `${secondaryHue} 20% 60%`);
    
    // Keep foreground text bright for readability
    root.style.setProperty('--foreground', '0 0% 98%');
    root.style.setProperty('--card-foreground', '0 0% 98%');
    root.style.setProperty('--popover-foreground', '0 0% 98%');
    
    // Also set as hex for direct usage
    root.style.setProperty('--color-primary', primaryColor);
    root.style.setProperty('--color-secondary', secondaryColor);
    root.style.setProperty('--color-accent', accentColor);
    
    console.log('✅ Applied custom theme:', { 
      primary: `${primaryColor} -> ${primaryHSL}`,
      secondary: `${secondaryColor} -> ${secondaryHSL}`,
      accent: `${accentColor} -> ${accentHSL}`,
      background: `${primaryHue} 15% 8%`
    });
  }, [hexToHSL]);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('lunchbox-theme') as Theme || 'current';
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  // Load theme from Firebase when user logs in
  useEffect(() => {
    if (!user) return;

    const loadThemeFromFirebase = async () => {
      try {
        const preferences = await getUserPreferences(user.uid);
        if (preferences?.theme) {
          console.log('✅ Loaded theme from Firebase:', preferences.theme);
          const firebaseTheme = preferences.theme === 'dark' ? 'current' : 
                               preferences.theme === 'light' ? 'light' : 
                               'original';
          setTheme(firebaseTheme);
          localStorage.setItem('lunchbox-theme', firebaseTheme);
          applyTheme(firebaseTheme);
        }
      } catch (error) {
        console.error('Failed to load theme from Firebase:', error);
      }
    };

    loadThemeFromFirebase();
  }, [user]);

  // Load and apply appearance colors globally
  useEffect(() => {
    const loadAndApplyColors = async () => {
      console.log('🎨 Loading appearance colors...');
      let settings = loadSettingsFromLocalStorage();
      
      if (settings?.appearance) {
        console.log('📦 Found settings in localStorage:', settings.appearance);
      } else {
        console.log('📦 No localStorage settings, checking Firebase...');
      }
      
      // Try Firebase if localStorage is empty and user is logged in
      if (!settings?.appearance && user) {
        settings = await loadSettingsFromFirestore(user.uid);
        if (settings?.appearance) {
          console.log('☁️ Found settings in Firebase:', settings.appearance);
        }
      }
      
      if (settings?.appearance) {
        const { primaryColor, secondaryColor, accentColor, colorScheme } = settings.appearance;
        
        // Only apply custom colors for premium themes
        const isPremiumTheme = colorScheme && !['original', 'dark', 'light'].includes(colorScheme);
        
        if (primaryColor && secondaryColor && accentColor && isPremiumTheme) {
          console.log('✨ Applying premium theme colors:', { primaryColor, secondaryColor, accentColor, colorScheme });
          // Small delay to ensure theme class is applied first
          setTimeout(() => {
            applyColors(primaryColor, secondaryColor, accentColor);
          }, 100);
        } else if (primaryColor && secondaryColor && accentColor && !isPremiumTheme) {
          console.log('🧹 Default theme detected, clearing custom colors');
          clearCustomColors();
        } else {
          console.log('❌ Missing some colors:', { primaryColor, secondaryColor, accentColor });
        }
      } else {
        console.log('❌ No appearance settings found');
      }
    };
    
    loadAndApplyColors();
  }, [user, theme, applyColors, clearCustomColors]); // Re-apply when theme changes

  const applyTheme = (newTheme: Theme) => {
    // Remove all theme classes
    document.documentElement.classList.remove('light-theme', 'original-theme', 'dark-theme');
    
    // Add the new theme class
    if (newTheme === 'light') {
      document.documentElement.classList.add('light-theme');
    } else if (newTheme === 'original') {
      document.documentElement.classList.add('original-theme');
    } else {
      document.documentElement.classList.add('dark-theme');
    }
    
    // Set data attribute for CSS targeting
    document.documentElement.setAttribute('data-theme', newTheme);
    
    // Debug logging
    console.log('Applied theme:', newTheme);
    console.log('Theme classes:', document.documentElement.classList.toString());
  };

  const handleSetTheme = async (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('lunchbox-theme', newTheme);
    applyTheme(newTheme);
    
    // Save to Firebase if user is logged in
    if (user) {
      try {
        const firebaseTheme = newTheme === 'current' ? 'dark' : newTheme;
        await saveUserPreferences(user.uid, { theme: firebaseTheme as 'light' | 'dark' | 'system' });
        console.log('✅ Theme saved to Firebase');
      } catch (error) {
        console.error('Failed to save theme to Firebase:', error);
      }
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme, applyColors, clearCustomColors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
