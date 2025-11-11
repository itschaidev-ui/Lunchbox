/**
 * Settings Serializer
 * Converts settings to/from compact string format with markers
 */

export interface AppearanceSettings {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  colorScheme?: string;
}

export interface LanguageSettings {
  code: string;
  name: string;
}

export interface AllSettings {
  appearance?: AppearanceSettings;
  language?: LanguageSettings;
  notifications?: boolean;
}

/**
 * Serialize settings to compact string format
 */
export function serializeSettings(settings: AllSettings): string {
  const parts: string[] = [];

  // Appearance settings
  if (settings.appearance) {
    parts.push('[APPEARANCE_O]');
    parts.push(`P:${settings.appearance.primaryColor}`);
    parts.push(`S:${settings.appearance.secondaryColor}`);
    parts.push(`A:${settings.appearance.accentColor}`);
    if (settings.appearance.colorScheme) {
      parts.push(`CS:${settings.appearance.colorScheme}`);
    }
    parts.push('[APPEARANCE_C]');
  }

  // Language settings
  if (settings.language) {
    parts.push('[LANG_O]');
    parts.push(`C:${settings.language.code}`);
    parts.push(`N:${settings.language.name}`);
    parts.push('[LANG_C]');
  }

  // Notifications
  if (settings.notifications !== undefined) {
    parts.push(settings.notifications ? '[NOTIF_ON]' : '[NOTIF_OFF]');
  }

  return parts.join('|');
}

/**
 * Deserialize compact string format to settings object
 */
export function deserializeSettings(settingsString: string): AllSettings {
  const settings: AllSettings = {};
  const parts = settingsString.split('|');

  let currentSection = '';
  let sectionData: any = {};

  for (const part of parts) {
    if (part.startsWith('[') && part.endsWith('_O]')) {
      // Opening marker
      currentSection = part;
      sectionData = {};
    } else if (part.startsWith('[') && part.endsWith('_C]')) {
      // Closing marker
      if (currentSection === '[APPEARANCE_O]') {
        settings.appearance = sectionData as AppearanceSettings;
      } else if (currentSection === '[LANG_O]') {
        settings.language = sectionData as LanguageSettings;
      }
      currentSection = '';
      sectionData = {};
    } else if (part === '[NOTIF_ON]') {
      settings.notifications = true;
    } else if (part === '[NOTIF_OFF]') {
      settings.notifications = false;
    } else if (currentSection === '[APPEARANCE_O]') {
      // Parse appearance settings
      const [key, value] = part.split(':');
      if (key === 'P') sectionData.primaryColor = value;
      else if (key === 'S') sectionData.secondaryColor = value;
      else if (key === 'A') sectionData.accentColor = value;
      else if (key === 'CS') sectionData.colorScheme = value;
    } else if (currentSection === '[LANG_O]') {
      // Parse language settings
      const [key, value] = part.split(':');
      if (key === 'C') sectionData.code = value;
      else if (key === 'N') sectionData.name = value;
    }
  }

  return settings;
}

/**
 * Save settings to Firestore
 */
export async function saveSettingsToFirestore(userId: string, settings: AllSettings): Promise<void> {
  try {
    const { db } = await import('@/lib/firebase');
    const { doc, setDoc } = await import('firebase/firestore');
    
    const serialized = serializeSettings(settings);
    const userRef = doc(db, 'users', userId);
    
    await setDoc(userRef, { 
      settings: serialized,
      settingsUpdatedAt: new Date().toISOString()
    }, { merge: true });
    
    console.log('✅ Settings saved to Firestore:', serialized.substring(0, 100));
  } catch (error) {
    console.error('Error saving settings to Firestore:', error);
    throw error;
  }
}

/**
 * Load settings from Firestore
 */
export async function loadSettingsFromFirestore(userId: string): Promise<AllSettings | null> {
  try {
    const { db } = await import('@/lib/firebase');
    const { doc, getDoc } = await import('firebase/firestore');
    
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      if (data.settings && typeof data.settings === 'string') {
        const deserialized = deserializeSettings(data.settings);
        console.log('✅ Settings loaded from Firestore');
        return deserialized;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error loading settings from Firestore:', error);
    return null;
  }
}

/**
 * Save settings to localStorage (for immediate client-side access)
 */
export function saveSettingsToLocalStorage(settings: AllSettings): void {
  try {
    const serialized = serializeSettings(settings);
    localStorage.setItem('lunchbox-settings', serialized);
    console.log('✅ Settings saved to localStorage');
  } catch (error) {
    console.error('Error saving settings to localStorage:', error);
  }
}

/**
 * Load settings from localStorage
 */
export function loadSettingsFromLocalStorage(): AllSettings | null {
  try {
    const settingsString = localStorage.getItem('lunchbox-settings');
    if (!settingsString) return null;
    
    const settings = deserializeSettings(settingsString);
    console.log('✅ Settings loaded from localStorage');
    return settings;
  } catch (error) {
    console.error('Error loading settings from localStorage:', error);
    return null;
  }
}

