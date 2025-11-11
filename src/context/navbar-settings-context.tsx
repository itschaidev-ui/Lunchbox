'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface NavbarSettings {
  size: 'compact' | 'normal' | 'large';
  showBadges: boolean;
  showAISuggestions: boolean;
  hoverSensitivity: number; // 1-5 scale
  colorTheme: 'auto' | 'morning' | 'afternoon' | 'evening' | 'night' | 'custom';
  customColors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

interface NavbarSettingsContextType {
  settings: NavbarSettings;
  updateSettings: (newSettings: Partial<NavbarSettings>) => void;
  resetSettings: () => void;
}

const defaultSettings: NavbarSettings = {
  size: 'normal',
  showBadges: true,
  showAISuggestions: true,
  hoverSensitivity: 3,
  colorTheme: 'auto',
};

const NavbarSettingsContext = createContext<NavbarSettingsContextType | undefined>(undefined);

export function NavbarSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<NavbarSettings>(defaultSettings);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('navbar-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (error) {
        console.error('Failed to parse navbar settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('navbar-settings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings: Partial<NavbarSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('navbar-settings');
  };

  return (
    <NavbarSettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </NavbarSettingsContext.Provider>
  );
}

export function useNavbarSettings() {
  const context = useContext(NavbarSettingsContext);
  if (context === undefined) {
    throw new Error('useNavbarSettings must be used within a NavbarSettingsProvider');
  }
  return context;
}
