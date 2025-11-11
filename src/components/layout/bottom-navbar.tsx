'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import React, { useState, useEffect, memo } from 'react';
import { cn } from '@/lib/utils';
import { 
  Home, 
  CheckSquare, 
  Sparkles, 
  FileText, 
  Settings,
  Menu,
  X,
  Zap,
  Users,
  Aperture,
  ChevronUp,
  ChevronDown,
  Mic,
  MicOff,
  LogOut,
  Shield,
  MessageCircle,
  Lock
} from 'lucide-react';
import * as Icons from 'lucide-react';
import { useBreakpoint } from '@/hooks/use-media-query';
import { useNavbarAI } from '@/hooks/use-navbar-ai';
import { useNavbarSettings } from '@/context/navbar-settings-context';
import { BadgeIndicator } from '@/components/ui/badge-indicator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/auth-context';
import { getTimeBasedColors } from '@/lib/navbar-ai-suggestions';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserPreferences } from '@/lib/firebase-user-preferences';

const navItems = [
  {
    href: '/',
    icon: Home,
    label: 'Home',
  },
  {
    href: '/tasks',
    icon: CheckSquare,
    label: 'Tasks',
  },
  {
    href: '/assistant',
    icon: Sparkles,
    label: 'Assistant',
  },
  {
    href: '/docs',
    icon: FileText,
    label: 'Events',
  },
  {
    href: '/settings',
    icon: Settings,
    label: 'Settings',
  },
];

// Quick action items for the right side
const quickActions = [
  {
    icon: Users,
    label: 'People',
    action: () => console.log('People clicked'),
  },
  {
    icon: Aperture,
    label: 'Camera',
    action: () => console.log('Camera clicked'),
  },
];

function BottomNavbarComponent() {
  const pathname = usePathname();
  const { isMobile, isCompact } = useBreakpoint();
  const { settings } = useNavbarSettings();
  const { suggestion, dueTasksCount, incompleteTasksCount, savedChatsCount } = useNavbarAI();
  const { user } = useAuth();
  
  const [isVisible, setIsVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeButton, setActiveButton] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [ripples, setRipples] = useState<{[key: string]: {x: number, y: number, id: string}}>({});
  const [expandedButton, setExpandedButton] = useState<string | null>(null);
  const [animationVariant, setAnimationVariant] = useState<'none' | 'bounce' | 'pulse' | 'rotate' | 'scale'>('scale');
  const [unlockedAnimations, setUnlockedAnimations] = useState<string[]>([]);
  const [variant, setVariant] = useState<string>('default');
  const [customColors, setCustomColors] = useState({
    background: '#1f2937',
    activeButton: '#374151',
    inactiveButton: '#6b7280',
    accent: '#8b5cf6',
  });
  const [customButtons, setCustomButtons] = useState<any[]>([]);
  const router = useRouter();

  // Get responsive sizes based on settings - optimized for Galaxy Z Fold 5
  const getButtonSizes = () => {
    const baseSize = settings.size === 'compact' ? 'h-6 w-6' : 
                    settings.size === 'large' ? 'h-9 w-9' : 'h-7 w-7';
    const largeSize = settings.size === 'compact' ? 'h-7 w-7' : 
                     settings.size === 'large' ? 'h-11 w-11' : 'h-9 w-9';
    // Message button gets special oval sizing - smaller for mobile
    const messageSize = settings.size === 'compact' ? 'h-7 w-10' : 
                       settings.size === 'large' ? 'h-11 w-14' : 'h-9 w-12';
    return { baseSize, largeSize, messageSize };
  };

  const { baseSize, largeSize, messageSize } = getButtonSizes();

  // Get time-based colors
  const timeColors = getTimeBasedColors();

  // Check if user is admin
  const isAdmin = user?.email === 'itschaidev@gmail.com';

  // Sign out function
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setShowProfileDropdown(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Load variant settings and custom buttons
  useEffect(() => {
    const savedVariant = localStorage.getItem('lunchbox-bottom-bar-variant') || 'default';
    const savedColors = localStorage.getItem('lunchbox-bottom-bar-colors');
    const savedButtons = localStorage.getItem('lunchbox-bottom-bar-custom-buttons');
    const savedAnimation = localStorage.getItem('lunchbox-bottom-bar-animation');
    setVariant(savedVariant);
    if (savedColors) setCustomColors(JSON.parse(savedColors));
    if (savedButtons) setCustomButtons(JSON.parse(savedButtons));
    if (savedAnimation) setAnimationVariant(savedAnimation as any);

    const handleVariantChange = () => {
      const newVariant = localStorage.getItem('lunchbox-bottom-bar-variant') || 'default';
      const newColors = localStorage.getItem('lunchbox-bottom-bar-colors');
      setVariant(newVariant);
      if (newColors) setCustomColors(JSON.parse(newColors));
    };

    const handleButtonsChange = () => {
      const newButtons = localStorage.getItem('lunchbox-bottom-bar-custom-buttons');
      if (newButtons) setCustomButtons(JSON.parse(newButtons));
    };

    window.addEventListener('bottom-bar-variant-change', handleVariantChange);
    window.addEventListener('bottom-bar-buttons-change', handleButtonsChange);
    return () => {
      window.removeEventListener('bottom-bar-variant-change', handleVariantChange);
      window.removeEventListener('bottom-bar-buttons-change', handleButtonsChange);
    };
  }, []);

  // Load unlocked animations from Firestore (separate effect)
  useEffect(() => {
    if (!user?.uid) return;
    
    const loadAnimations = async () => {
      try {
        const prefs = await getUserPreferences(user.uid);
        if (prefs?.unlockedAnimations) {
          setUnlockedAnimations(prefs.unlockedAnimations);
          console.log('Loaded unlocked animations:', prefs.unlockedAnimations);
        }
      } catch (error) {
        console.error('Error loading unlocked animations:', error);
      }
    };
    
    loadAnimations();
    
    // Refresh every 3 seconds to catch new unlocks
    const interval = setInterval(loadAnimations, 3000);
    return () => clearInterval(interval);
  }, [user?.uid]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showProfileDropdown) {
        const target = event.target as Element;
        if (!target.closest('.profile-dropdown-container')) {
          setShowProfileDropdown(false);
        }
      }
    };

    if (showProfileDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showProfileDropdown]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const sensitivity = settings.hoverSensitivity * 30; // Convert 1-5 to 30-150px

    const handleMouseMove = (e: MouseEvent) => {
      const windowHeight = window.innerHeight;
      const mouseY = e.clientY;
      const distanceFromBottom = windowHeight - mouseY;
      
      clearTimeout(timeoutId);
      
      if (distanceFromBottom <= sensitivity) {
        setIsVisible(true);
      } else if (!isHovering) {
        timeoutId = setTimeout(() => {
          setIsVisible(false);
        }, 200);
      }
    };

    const handleMouseLeave = () => {
      clearTimeout(timeoutId);
      setIsVisible(false);
      setIsHovering(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isHovering, settings.hoverSensitivity]);

  const handleVoiceToggle = () => {
    setIsListening(!isListening);
    // TODO: Implement voice recognition
  };

  // Ripple effect handler
  const handleRipple = (buttonId: string, event: React.MouseEvent) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const rippleId = `${buttonId}-${Date.now()}`;
    
    setRipples(prev => ({ ...prev, [rippleId]: { x, y, id: rippleId } }));
    
    setTimeout(() => {
      setRipples(prev => {
        const newRipples = { ...prev };
        delete newRipples[rippleId];
        return newRipples;
      });
    }, 600);
  };

  // Get animation classes based on variant - check if animation is unlocked
  const getAnimationClasses = (variant: 'none' | 'bounce' | 'pulse' | 'rotate' | 'scale') => {
    // Check if the animation is unlocked (except 'scale' and 'none' which are default)
    if (variant !== 'scale' && variant !== 'none' && !unlockedAnimations.includes(variant)) {
      // Fallback to default scale animation if not unlocked
      return 'hover:scale-105 active:scale-95 transition-all duration-200';
    }
    
    switch(variant) {
      case 'bounce':
        return 'hover:animate-bounce active:animate-bounce';
      case 'pulse':
        return 'hover:animate-pulse active:animate-pulse';
      case 'rotate':
        return 'hover:rotate-12 active:rotate-[-12deg] transition-transform duration-300';
      case 'scale':
        return 'hover:scale-110 hover:rotate-3 hover:shadow-lg active:scale-95 active:rotate-[-3deg] transition-all duration-300';
      default:
        return 'hover:scale-105 active:scale-95 transition-all duration-200';
    }
  };

  // Handle custom button actions
  const handleCustomAction = (action: string) => {
    switch (action) {
      case 'new-task':
        // Dispatch event to open new task form
        window.dispatchEvent(new CustomEvent('open-new-task-form'));
        break;
      case 'toggle-assistant':
        // Dispatch event to toggle assistant
        window.dispatchEvent(new CustomEvent('toggle-assistant'));
        break;
      case 'toggle-feedback':
        // Dispatch event to toggle feedback
        window.dispatchEvent(new CustomEvent('toggle-feedback'));
        break;
      case 'open-routines':
        router.push('/tasks/routines');
        break;
      case 'open-credits':
        // Dispatch event to open credits dialog
        window.dispatchEvent(new CustomEvent('open-credits-dialog'));
        break;
      case 'open-collabs':
        router.push('/collabs');
        break;
      case 'open-projects':
        router.push('/projects');
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  // Render custom button
  const renderCustomButton = (button: any) => {
    if (!button.enabled) return null;

    const IconComponent = button.icon === 'custom' 
      ? null 
      : ((Icons as any)[button.icon] || Icons.Circle);

    const isActive = button.type === 'link' && pathname === button.path;
    const buttonColors = button.colors || {};
    const isExpanded = expandedButton === button.id;

    const buttonElement = button.type === 'link' ? (
      <div 
        className={cn(
          "relative flex items-center gap-2 transition-all duration-300",
          isExpanded ? "px-3" : "px-0"
        )}
      >
        <div className="relative">
          <Link
            href={button.path || '/'}
            onClick={(e) => {
              setActiveButton(button.id);
              handleRipple(button.id, e);
              setExpandedButton(isExpanded ? null : button.id);
            }}
            className={cn(
              "rounded-full flex items-center justify-center overflow-hidden relative",
              "h-10 w-10",
              getAnimationClasses(animationVariant),
              isActive && "shadow-md"
            )}
            style={{
              backgroundColor: isActive 
                ? (buttonColors.background || customColors.activeButton)
                : 'transparent',
              color: isActive 
                ? (buttonColors.text || '#fff')
                : (buttonColors.text || customColors.inactiveButton),
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = buttonColors.hoverBackground || customColors.inactiveButton;
                e.currentTarget.style.color = buttonColors.hoverText || '#fff';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = buttonColors.text || customColors.inactiveButton;
              }
            }}
          >
            {button.icon === 'custom' && button.customIconUrl ? (
              <img src={button.customIconUrl} alt={button.label} className="h-5 w-5 rounded-full object-cover transition-transform duration-300" />
            ) : IconComponent ? (
              <IconComponent className="h-5 w-5 transition-transform duration-300" />
            ) : null}
            
            {/* Ripple Effect */}
            {Object.values(ripples).filter(r => r.id.startsWith(button.id)).map((ripple) => (
              <span
                key={ripple.id}
                className="absolute rounded-full bg-white/30 pointer-events-none animate-ping"
                style={{
                  left: ripple.x - 10,
                  top: ripple.y - 10,
                  width: 20,
                  height: 20,
                }}
              />
            ))}
          </Link>
          
          {button.showBadge && button.badgeCount !== undefined && button.badgeCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center z-10">
              {button.badgeCount > 9 ? '9+' : button.badgeCount}
            </span>
          )}
        </div>
        
        {/* Expandable Label */}
        {isExpanded && (
          <span className="text-sm font-medium text-white whitespace-nowrap animate-in slide-in-from-left-2 duration-300">
            {button.label}
          </span>
        )}
      </div>
    ) : (
      <div 
        className={cn(
          "relative flex items-center gap-2 transition-all duration-300",
          isExpanded ? "px-3" : "px-0"
        )}
      >
        <div className="relative">
          <button
            onClick={(e) => {
              handleCustomAction(button.action || '');
              handleRipple(button.id, e);
              setExpandedButton(isExpanded ? null : button.id);
            }}
            className={cn(
              "rounded-full flex items-center justify-center overflow-hidden relative",
              "h-10 w-10",
              getAnimationClasses(animationVariant)
            )}
            style={{
              backgroundColor: 'transparent',
              color: buttonColors.text || customColors.inactiveButton,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = buttonColors.hoverBackground || customColors.inactiveButton;
              e.currentTarget.style.color = buttonColors.hoverText || '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = buttonColors.text || customColors.inactiveButton;
            }}
            title={button.label}
          >
            {button.icon === 'custom' && button.customIconUrl ? (
              <img src={button.customIconUrl} alt={button.label} className="h-5 w-5 rounded-full object-cover transition-transform duration-300" />
            ) : IconComponent ? (
              <IconComponent className="h-5 w-5 transition-transform duration-300" />
            ) : null}
            
            {/* Ripple Effect */}
            {Object.values(ripples).filter(r => r.id.startsWith(button.id)).map((ripple) => (
              <span
                key={ripple.id}
                className="absolute rounded-full bg-white/30 pointer-events-none animate-ping"
                style={{
                  left: ripple.x - 10,
                  top: ripple.y - 10,
                  width: 20,
                  height: 20,
                }}
              />
            ))}
          </button>
          
          {button.showBadge && button.badgeCount !== undefined && button.badgeCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center z-10">
              {button.badgeCount > 9 ? '9+' : button.badgeCount}
            </span>
          )}
        </div>
        
        {/* Expandable Label */}
        {isExpanded && (
          <span className="text-sm font-medium text-white whitespace-nowrap animate-in slide-in-from-left-2 duration-300">
            {button.label}
          </span>
        )}
      </div>
    );

    return buttonElement;
  };

  // Get button order from localStorage
  const [buttonOrder, setButtonOrder] = useState<string[]>([]);

  useEffect(() => {
    const savedOrder = localStorage.getItem('lunchbox-bottom-bar-order');
    if (savedOrder) {
      setButtonOrder(JSON.parse(savedOrder));
    }

    const handleButtonsChange = () => {
      const newOrder = localStorage.getItem('lunchbox-bottom-bar-order');
      if (newOrder) {
        setButtonOrder(JSON.parse(newOrder));
      }
    };

    window.addEventListener('bottom-bar-buttons-change', handleButtonsChange);
    return () => window.removeEventListener('bottom-bar-buttons-change', handleButtonsChange);
  }, []);

  // Get all buttons in order (default + custom)
  const getAllButtonsInOrder = () => {
    const defaultButtons = [
      { id: 'message', icon: MessageCircle, path: '/assistant', isDefault: true },
      { id: 'tasks', icon: CheckSquare, path: '/tasks', isDefault: true },
      { id: 'voice', icon: Mic, action: 'voice', isDefault: true },
      { id: 'profile', icon: Settings, path: '/settings', isDefault: true },
      { id: 'home', icon: Home, path: '/', isDefault: true },
    ];

    // If we have a saved order, use it; otherwise use default order
    const orderedIds = buttonOrder.length > 0 ? buttonOrder : defaultButtons.map(b => b.id);
    
    // Create a map of all buttons
    const allButtonsMap = new Map();
    defaultButtons.forEach(btn => allButtonsMap.set(btn.id, btn));
    customButtons.forEach(btn => allButtonsMap.set(btn.id, btn));

    // Return buttons in the saved order
    return orderedIds
      .map(id => allButtonsMap.get(id))
      .filter(btn => btn && (btn.isDefault || btn.enabled));
  };

  // Get buttons by position
  const getButtonsByPosition = (position: 'left' | 'center' | 'right') => {
    return customButtons
      .filter(b => b.enabled && b.position === position)
      .sort((a, b) => {
        const orderA = buttonOrder.indexOf(a.id);
        const orderB = buttonOrder.indexOf(b.id);
        if (orderA === -1 && orderB === -1) return a.order - b.order;
        if (orderA === -1) return 1;
        if (orderB === -1) return -1;
        return orderA - orderB;
      });
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'elegant':
        return "bg-gradient-to-r from-gray-900/95 to-gray-800/95 border-gray-600/50";
      case 'unique':
        return "bg-gradient-to-r from-purple-900/95 to-blue-900/95 border-purple-600/50";
      case 'cool':
        return "bg-gradient-to-r from-cyan-900/95 to-blue-900/95 border-cyan-600/50";
      case 'animated':
        return "bg-gradient-to-r from-pink-900/95 to-purple-900/95 border-pink-600/50 animate-gradient-x";
      case 'custom':
        return `border-gray-700/30`;
      default:
        return "bg-gray-900/95 border-gray-700/30";
    }
  };

  return (
    <>
      {/* Bottom Navbar */}
      <div 
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out",
          "sm:bottom-4 sm:left-1/2 sm:right-auto sm:transform sm:-translate-x-1/2 sm:w-auto",
          isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
        )}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div 
          className={cn(
            "relative flex items-center justify-center gap-1 backdrop-blur-xl shadow-2xl transition-all duration-300 px-3 py-2.5",
            "rounded-t-3xl sm:rounded-full",
            "border-t sm:border",
            getVariantStyles(),
            variant === 'animated' && "animate-pulse-slow"
          )}
          style={variant === 'custom' ? { backgroundColor: customColors.background + 'f0' } : undefined}
        >
            {/* Render all buttons in order */}
            {getAllButtonsInOrder().map((btn: any) => {
              if (btn.isDefault) {
                // Render default buttons
                if (btn.id === 'message') {
                  return (
                    <div key={btn.id} className="relative">
                      <Link
                        href="/assistant"
                        onClick={(e) => {
                          setActiveButton("message");
                          handleRipple("message", e);
                        }}
                        className={cn(
                          "rounded-full flex items-center justify-center overflow-hidden relative",
                          "bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700",
                          "h-11 w-11",
                          getAnimationClasses(animationVariant),
                          pathname === "/assistant" && "shadow-md"
                        )}
                      >
                        <MessageCircle className="h-5 w-5 text-white transition-transform duration-300" />
                        
                        {/* Ripple Effect */}
                        {Object.values(ripples).filter(r => r.id.startsWith("message")).map((ripple) => (
                          <span
                            key={ripple.id}
                            className="absolute rounded-full bg-white/30 pointer-events-none animate-ping"
                            style={{
                              left: ripple.x - 10,
                              top: ripple.y - 10,
                              width: 20,
                              height: 20,
                            }}
                          />
                        ))}
                      </Link>
                      {settings.showBadges && savedChatsCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center z-10">
                          {savedChatsCount > 9 ? '9+' : savedChatsCount}
                        </span>
                      )}
                    </div>
                  );
                } else if (btn.id === 'tasks') {
                  return (
                    <div key={btn.id} className="relative">
                      <Link
                        href="/tasks"
                        onClick={(e) => {
                          setActiveButton("tasks");
                          handleRipple("tasks", e);
                        }}
                        className={cn(
                          "rounded-full flex items-center justify-center overflow-hidden relative",
                          "h-10 w-10",
                          getAnimationClasses(animationVariant),
                          variant !== 'custom' && (pathname === "/tasks" ? "bg-gray-700 text-white shadow-md" : "text-gray-400 hover:text-white hover:bg-gray-800")
                        )}
                        style={variant === 'custom' ? {
                          backgroundColor: pathname === "/tasks" ? customColors.activeButton : 'transparent',
                          color: pathname === "/tasks" ? '#fff' : customColors.inactiveButton
                        } : undefined}
                      >
                        <CheckSquare className="h-5 w-5 transition-transform duration-300" />
                        
                        {/* Ripple Effect */}
                        {Object.values(ripples).filter(r => r.id.startsWith("tasks")).map((ripple) => (
                          <span
                            key={ripple.id}
                            className="absolute rounded-full bg-white/30 pointer-events-none animate-ping"
                            style={{
                              left: ripple.x - 10,
                              top: ripple.y - 10,
                              width: 20,
                              height: 20,
                            }}
                          />
                        ))}
                      </Link>
                      {settings.showBadges && incompleteTasksCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center z-10">
                          {incompleteTasksCount > 9 ? '9+' : incompleteTasksCount}
                        </span>
                      )}
                    </div>
                  );
                } else if (btn.id === 'voice') {
                  return (
                    <div key={btn.id} className="relative">
                      <button
                        onClick={(e) => {
                          const allowedEmails = ['itschadev@gmail.com', 'lunchboxai.official@gmail.com'];
                          const userEmail = user?.email || '';
                          if (allowedEmails.includes(userEmail)) {
                            handleVoiceToggle();
                          }
                          handleRipple("voice", e);
                        }}
                        className={cn(
                          "rounded-full flex items-center justify-center overflow-hidden relative",
                          "h-10 w-10",
                          getAnimationClasses(animationVariant),
                          isListening ? "bg-green-500 text-white shadow-md" : "text-gray-400 hover:text-white hover:bg-gray-800"
                        )}
                        title={
                          !['itschadev@gmail.com', 'lunchboxai.official@gmail.com'].includes(user?.email || '')
                            ? "Voice commands are locked"
                            : isListening ? "Stop listening" : "Start voice command"
                        }
                      >
                        {!['itschadev@gmail.com', 'lunchboxai.official@gmail.com'].includes(user?.email || '') ? (
                          <>
                            <Mic className="h-5 w-5 opacity-50 transition-transform duration-300" />
                            <Lock className="h-3 w-3 absolute top-1 right-1" />
                          </>
                        ) : isListening ? (
                          <MicOff className="h-5 w-5 transition-transform duration-300" />
                        ) : (
                          <Mic className="h-5 w-5 transition-transform duration-300" />
                        )}
                        
                        {/* Ripple Effect */}
                        {Object.values(ripples).filter(r => r.id.startsWith("voice")).map((ripple) => (
                          <span
                            key={ripple.id}
                            className="absolute rounded-full bg-white/30 pointer-events-none animate-ping"
                            style={{
                              left: ripple.x - 10,
                              top: ripple.y - 10,
                              width: 20,
                              height: 20,
                            }}
                          />
                        ))}
                      </button>
                    </div>
                  );
                } else if (btn.id === 'profile') {
                  return (
                    <div key={btn.id} className="relative profile-dropdown-container">
                      {user ? (
                        <button
                          onClick={(e) => {
                            setShowProfileDropdown(!showProfileDropdown);
                            handleRipple("profile", e);
                          }}
                          className={cn(
                            "rounded-full flex items-center justify-center overflow-hidden relative ring-2",
                            "h-9 w-9",
                            getAnimationClasses(animationVariant),
                            showProfileDropdown ? "ring-white/50 shadow-md" : "ring-transparent hover:ring-gray-700"
                          )}
                        >
                          <Avatar className="h-full w-full">
                            <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
                            <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold">
                              {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                        </button>
                      ) : (
                        <Link
                          href="/settings"
                          onClick={(e) => {
                            setActiveButton("settings");
                            handleRipple("settings", e);
                          }}
                          className={cn(
                            "rounded-full flex items-center justify-center overflow-hidden relative",
                            "h-10 w-10",
                            getAnimationClasses(animationVariant),
                            pathname === "/settings" ? "bg-gray-700 text-white shadow-md" : "text-gray-400 hover:text-white hover:bg-gray-800"
                          )}
                        >
                          <Settings className="h-5 w-5 transition-transform duration-300" />
                          
                          {/* Ripple Effect */}
                          {Object.values(ripples).filter(r => r.id.startsWith("settings")).map((ripple) => (
                            <span
                              key={ripple.id}
                              className="absolute rounded-full bg-white/30 pointer-events-none animate-ping"
                              style={{
                                left: ripple.x - 10,
                                top: ripple.y - 10,
                                width: 20,
                                height: 20,
                              }}
                            />
                          ))}
                        </Link>
                      )}
                      
                      {/* Profile Dropdown Menu */}
                      {user && showProfileDropdown && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 bg-popover text-popover-foreground rounded-2xl shadow-2xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-300 border backdrop-blur-sm z-[60] min-w-[200px]">
                          <div className="flex flex-col items-center gap-3">
                            {/* Profile Info */}
                            <div className="flex flex-col items-center gap-2">
                              <Avatar className="h-16 w-16 ring-2 ring-white/20">
                                <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
                                <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xl font-semibold">
                                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="text-center">
                                <div className="font-semibold text-sm">
                                  {user.displayName || 'User'}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {user.email}
                                </div>
                              </div>
                            </div>
                            
                            {/* Menu Items */}
                            <div className="w-full border-t pt-3">
                              {isAdmin && (
                                <Link 
                                  href="/admin" 
                                  className="flex items-center gap-3 hover:bg-muted/50 transition-colors duration-200 p-3 rounded-lg w-full"
                                  onClick={() => setShowProfileDropdown(false)}
                                >
                                  <Shield className="h-4 w-4 text-blue-500" />
                                  <span className="text-sm">Admin Dashboard</span>
                                </Link>
                              )}
                              <Link 
                                href="/settings" 
                                className="flex items-center gap-3 hover:bg-muted/50 transition-colors duration-200 p-3 rounded-lg w-full"
                                onClick={() => setShowProfileDropdown(false)}
                              >
                                <Settings className="h-4 w-4" />
                                <span className="text-sm">Settings</span>
                              </Link>
                              <button
                                onClick={handleSignOut}
                                className="flex items-center gap-3 hover:bg-muted/50 transition-colors duration-200 p-3 rounded-lg w-full text-left"
                              >
                                <LogOut className="h-4 w-4 text-red-500" />
                                <span className="text-sm text-red-500">Sign Out</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                } else if (btn.id === 'home') {
                  return (
                    <div key={btn.id} className="relative">
                      <Link
                        href="/"
                        onClick={(e) => {
                          setActiveButton("home");
                          handleRipple("home", e);
                        }}
                        className={cn(
                          "rounded-full flex items-center justify-center overflow-hidden relative",
                          "h-10 w-10",
                          getAnimationClasses(animationVariant),
                          pathname === "/" ? "bg-gray-700 text-white shadow-md" : "text-gray-400 hover:text-white hover:bg-gray-800"
                        )}
                      >
                        <Home className="h-5 w-5 transition-transform duration-300" />
                        
                        {/* Ripple Effect */}
                        {Object.values(ripples).filter(r => r.id.startsWith("home")).map((ripple) => (
                          <span
                            key={ripple.id}
                            className="absolute rounded-full bg-white/30 pointer-events-none animate-ping"
                            style={{
                              left: ripple.x - 10,
                              top: ripple.y - 10,
                              width: 20,
                              height: 20,
                            }}
                          />
                        ))}
                      </Link>
                    </div>
                  );
                }
                return null;
              } else {
                // Render custom buttons
                return (
                  <React.Fragment key={btn.id}>
                    {renderCustomButton(btn)}
                  </React.Fragment>
                );
              }
            })}

        </div>
      </div>
    </>
  );
}

// Export memoized component for performance
export const BottomNavbar = memo(BottomNavbarComponent);
