'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface Language {
  code: string;
  name: string;
  flag: string;
  native: string;
}

export const languages: Language[] = [
  { code: 'en', name: 'English', flag: '🇺🇸', native: 'English' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸', native: 'Español' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵', native: '日本語' },
];

interface LanguageContextType {
  language: Language;
  setLanguage: (languageCode: string) => void;
  getCurrentLanguage: () => Language;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(languages[0]); // Default to English

  useEffect(() => {
    // Load language from localStorage on mount
    const savedLanguageCode = localStorage.getItem('lunchbox-language') || 'en';
    const savedLanguage = languages.find(l => l.code === savedLanguageCode) || languages[0];
    setLanguageState(savedLanguage);
    applyLanguage(savedLanguage);
  }, []);

  const applyLanguage = (newLanguage: Language) => {
    // Set HTML lang attribute
    document.documentElement.setAttribute('lang', newLanguage.code);
    
    // Set data attribute for CSS targeting
    document.documentElement.setAttribute('data-language', newLanguage.code);
    
    // Debug logging
    console.log('Applied language:', newLanguage.code, newLanguage.name);
  };

  const handleSetLanguage = (languageCode: string) => {
    const newLanguage = languages.find(l => l.code === languageCode);
    if (newLanguage) {
      setLanguageState(newLanguage);
      localStorage.setItem('lunchbox-language', languageCode);
      applyLanguage(newLanguage);
    }
  };

  const getCurrentLanguage = () => language;

  return (
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage: handleSetLanguage, 
      getCurrentLanguage 
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
