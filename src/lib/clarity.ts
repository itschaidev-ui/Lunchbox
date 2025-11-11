import Clarity from '@microsoft/clarity';

// Initialize Clarity with your project ID
// Replace 'yourProjectId' with your actual Clarity project ID
const CLARITY_PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID || 'yourProjectId';

export const initializeClarity = () => {
  // Clarity is now loaded via script tag, so we don't need to initialize it
  // The script tag handles initialization automatically
  console.log('Clarity script loaded via script tag');
  
  // Check if Clarity is available after a delay
  setTimeout(() => {
    if (typeof window !== 'undefined' && window.clarity) {
      console.log('Clarity is available and ready');
    } else {
      console.warn('Clarity may be blocked by ad blocker or not loaded yet');
      // Try to load Clarity manually as fallback
      loadClarityFallback();
    }
  }, 2000);
};

const loadClarityFallback = () => {
  if (typeof window === 'undefined') return;
  
  try {
    // Create a new script element
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = 'https://www.clarity.ms/tag/tnongks79d';
    
    // Add error handling
    script.onerror = () => {
      console.warn('Clarity fallback loading failed - likely blocked by ad blocker');
    };
    
    script.onload = () => {
      console.log('Clarity loaded via fallback method');
    };
    
    // Append to head
    document.head.appendChild(script);
  } catch (error) {
    console.warn('Failed to load Clarity fallback:', error);
  }
};

export const trackUser = (userId: string, sessionId?: string, pageId?: string, friendlyName?: string) => {
  if (typeof window !== 'undefined' && window.clarity && typeof window.clarity.identify === 'function') {
    try {
      window.clarity.identify(userId, sessionId, pageId, friendlyName);
    } catch (error) {
      console.warn('Clarity identify failed:', error);
    }
  } else {
    // Retry after a short delay if Clarity isn't ready yet
    setTimeout(() => {
      if (typeof window !== 'undefined' && window.clarity && typeof window.clarity.identify === 'function') {
        try {
          window.clarity.identify(userId, sessionId, pageId, friendlyName);
        } catch (error) {
          console.warn('Clarity identify failed on retry:', error);
        }
      }
    }, 1000);
  }
};

export const setTag = (key: string, value: string | string[]) => {
  if (typeof window !== 'undefined' && window.clarity && typeof window.clarity.setTag === 'function') {
    try {
      window.clarity.setTag(key, value);
    } catch (error) {
      console.warn('Clarity setTag failed:', error);
    }
  }
};

export const trackEvent = (eventName: string) => {
  if (typeof window !== 'undefined' && window.clarity && typeof window.clarity.event === 'function') {
    try {
      window.clarity.event(eventName);
    } catch (error) {
      console.warn('Clarity event failed:', error);
    }
  }
};

export const setConsent = (consent: boolean = true) => {
  if (typeof window !== 'undefined' && window.clarity && typeof window.clarity.consent === 'function') {
    try {
      window.clarity.consent(consent);
    } catch (error) {
      console.warn('Clarity consent failed:', error);
    }
  }
};

export const upgradeSession = (reason: string) => {
  if (typeof window !== 'undefined' && window.clarity && typeof window.clarity.upgrade === 'function') {
    try {
      window.clarity.upgrade(reason);
    } catch (error) {
      console.warn('Clarity upgrade failed:', error);
    }
  }
};

// Backwards alphabet encoding utility
export const encodeBackwards = (text: string): string => {
  if (!text || typeof text !== 'string') {
    return 'unknown@example.com';
  }
  
  return text
    .split('')
    .map(char => {
      if (char >= 'A' && char <= 'Z') {
        return String.fromCharCode(90 - (char.charCodeAt(0) - 65));
      } else if (char >= 'a' && char <= 'z') {
        return String.fromCharCode(122 - (char.charCodeAt(0) - 97));
      }
      return char;
    })
    .join('');
};

export const decodeBackwards = (text: string): string => {
  return text
    .split('')
    .map(char => {
      if (char >= 'A' && char <= 'Z') {
        return String.fromCharCode(90 - (char.charCodeAt(0) - 65));
      } else if (char >= 'a' && char <= 'z') {
        return String.fromCharCode(122 - (char.charCodeAt(0) - 97));
      }
      return char;
    })
    .join('');
};
