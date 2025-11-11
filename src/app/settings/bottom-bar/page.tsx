'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Palette, Sparkles, Zap, Check, Plus, Trash2, Edit, GripVertical, Upload, X, RotateCcw, Search, MessageCircle, CheckSquare, Mic, Home, Settings } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { getUserPreferences } from '@/lib/firebase-user-preferences';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import * as Icons from 'lucide-react';

type BottomBarVariant = 'default' | 'elegant' | 'unique' | 'cool' | 'custom' | 'animated';

interface CustomButton {
  id: string;
  label: string;
  icon: string; // Lucide icon name or 'custom'
  customIconUrl?: string; // For uploaded icons
  type: 'link' | 'action';
  path?: string;
  action?: string;
  position: 'left' | 'center' | 'right';
  order: number;
  showBadge?: boolean;
  badgeCount?: number;
  enabled: boolean;
  colors?: {
    background?: string;
    text?: string;
    hoverBackground?: string;
    hoverText?: string;
  };
}

const MAX_BUTTONS = 10;

const AVAILABLE_ACTIONS = [
  { value: 'new-task', label: 'New Task' },
  { value: 'toggle-assistant', label: 'Toggle Assistant' },
  { value: 'toggle-feedback', label: 'Toggle Feedback' },
  { value: 'open-routines', label: 'Open Routines' },
  { value: 'open-credits', label: 'Open Credits' },
  { value: 'open-collabs', label: 'Open Collabs' },
  { value: 'open-projects', label: 'Open Projects' },
];

const AVAILABLE_PATHS = [
  { value: '/', label: 'Home' },
  { value: '/tasks', label: 'Tasks' },
  { value: '/assistant', label: 'Assistant' },
  { value: '/collabs', label: 'Collaborations' },
  { value: '/projects', label: 'Projects' },
  { value: '/workspace', label: 'Workspace' },
  { value: '/docs', label: 'Events/Docs' },
  { value: '/settings', label: 'Settings' },
];

// Get all Lucide icons - computed function to ensure it's always fresh
const getLucideIcons = () => {
  return Object.keys(Icons).filter(
    (key) => 
      typeof (Icons as any)[key] === 'function' && 
      key !== 'createLucideIcon' && 
      key !== 'Icon' &&
      key !== 'default' &&
      !key.startsWith('_')
  );
};

export default function BottomBarSettingsPage() {
  const router = useRouter();
  const [variant, setVariant] = useState<BottomBarVariant>('default');
  const [customColors, setCustomColors] = useState({
    background: '#1f2937',
    activeButton: '#374151',
    inactiveButton: '#6b7280',
    accent: '#8b5cf6',
  });
  const [customButtons, setCustomButtons] = useState<CustomButton[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingButton, setEditingButton] = useState<CustomButton | null>(null);
  const [iconSearch, setIconSearch] = useState('');
  const [buttonOrder, setButtonOrder] = useState<string[]>([]);
  const [animationVariant, setAnimationVariant] = useState<'none' | 'bounce' | 'pulse' | 'rotate' | 'scale'>('scale');
  const [unlockedAnimations, setUnlockedAnimations] = useState<string[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    const saved = localStorage.getItem('lunchbox-bottom-bar-variant');
    const savedColors = localStorage.getItem('lunchbox-bottom-bar-colors');
    const savedButtons = localStorage.getItem('lunchbox-bottom-bar-custom-buttons');
    const savedOrder = localStorage.getItem('lunchbox-bottom-bar-order');
    const savedAnimation = localStorage.getItem('lunchbox-bottom-bar-animation');
    if (saved) setVariant(saved as BottomBarVariant);
    if (savedColors) setCustomColors(JSON.parse(savedColors));
    if (savedButtons) setCustomButtons(JSON.parse(savedButtons));
    if (savedOrder) setButtonOrder(JSON.parse(savedOrder));
    if (savedAnimation) setAnimationVariant(savedAnimation as any);

    // Listen for button order changes
    const handleOrderChange = () => {
      const newOrder = localStorage.getItem('lunchbox-bottom-bar-order');
      if (newOrder) setButtonOrder(JSON.parse(newOrder));
    };
    window.addEventListener('bottom-bar-buttons-change', handleOrderChange);
    return () => window.removeEventListener('bottom-bar-buttons-change', handleOrderChange);
  }, []);

  // Load unlocked animations from Firestore (separate effect)
  useEffect(() => {
    if (!user?.uid) return;
    
    const loadAnimations = async () => {
      try {
        console.log(`[Settings] Loading animations for user: ${user.uid}`);
        const prefs = await getUserPreferences(user.uid);
        console.log(`[Settings] Preferences loaded:`, prefs);
        if (prefs?.unlockedAnimations) {
          console.log(`[Settings] Setting unlocked animations:`, prefs.unlockedAnimations);
          setUnlockedAnimations(prefs.unlockedAnimations);
        } else {
          console.log(`[Settings] No unlocked animations in preferences`);
          setUnlockedAnimations([]);
        }
      } catch (error) {
        console.error('[Settings] Error loading unlocked animations:', error);
      }
    };
    
    loadAnimations();
    
    // Refresh every 3 seconds to catch new unlocks
    const interval = setInterval(loadAnimations, 3000);
    return () => clearInterval(interval);
  }, [user?.uid]);

  const handleVariantChange = (newVariant: BottomBarVariant) => {
    setVariant(newVariant);
    localStorage.setItem('lunchbox-bottom-bar-variant', newVariant);
    window.dispatchEvent(new Event('bottom-bar-variant-change'));
  };

  const handleColorChange = (key: string, value: string) => {
    const newColors = { ...customColors, [key]: value };
    setCustomColors(newColors);
    localStorage.setItem('lunchbox-bottom-bar-colors', JSON.stringify(newColors));
    window.dispatchEvent(new Event('bottom-bar-variant-change'));
  };

  const handleAnimationChange = (newAnimation: 'none' | 'bounce' | 'pulse' | 'rotate' | 'scale') => {
    // Check if animation is unlocked (except 'scale' and 'none' which are default)
    if (newAnimation !== 'scale' && newAnimation !== 'none' && !unlockedAnimations.includes(newAnimation)) {
      alert(`This animation is locked! Redeem it through Discord:\n/redeem animation-${newAnimation}`);
      return;
    }
    
    setAnimationVariant(newAnimation);
    localStorage.setItem('lunchbox-bottom-bar-animation', newAnimation);
    window.dispatchEvent(new Event('bottom-bar-buttons-change'));
  };

  const saveCustomButtons = (buttons: CustomButton[]) => {
    setCustomButtons(buttons);
    localStorage.setItem('lunchbox-bottom-bar-custom-buttons', JSON.stringify(buttons));
    
    // Update button order to include new buttons
    const currentOrder = buttonOrder.length > 0 ? [...buttonOrder] : ['message', 'tasks', 'voice', 'profile', 'home'];
    const existingIds = new Set(currentOrder);
    const newButtonIds = buttons
      .filter(btn => !existingIds.has(btn.id))
      .map(btn => btn.id);
    
    if (newButtonIds.length > 0) {
      const updatedOrder = [...currentOrder, ...newButtonIds];
      setButtonOrder(updatedOrder);
      localStorage.setItem('lunchbox-bottom-bar-order', JSON.stringify(updatedOrder));
    }
    
    window.dispatchEvent(new Event('bottom-bar-buttons-change'));
  };

  const handleAddButton = () => {
    setEditingButton(null);
    setIsDialogOpen(true);
  };

  const handleEditButton = (button: CustomButton) => {
    setEditingButton(button);
    setIsDialogOpen(true);
  };

  const handleDeleteButton = (id: string) => {
    const newButtons = customButtons.filter(b => b.id !== id);
    saveCustomButtons(newButtons);
  };

  const handleResetButtons = () => {
    if (confirm('Are you sure you want to reset all custom buttons to default? This cannot be undone.')) {
      saveCustomButtons([]);
    }
  };

  const handleToggleButton = (id: string) => {
    const newButtons = customButtons.map(b => 
      b.id === id ? { ...b, enabled: !b.enabled } : b
    );
    saveCustomButtons(newButtons);
  };

  // Get all buttons (default + custom) for preview
  const getAllButtons = () => {
    const defaultButtons: Array<CustomButton & { isDefault: boolean }> = [
      { id: 'message', label: 'Message', icon: 'MessageCircle', type: 'link' as const, path: '/assistant', position: 'center' as const, order: 0, enabled: true, isDefault: true, showBadge: false },
      { id: 'tasks', label: 'Tasks', icon: 'CheckSquare', type: 'link' as const, path: '/tasks', position: 'center' as const, order: 1, enabled: true, isDefault: true, showBadge: false },
      { id: 'voice', label: 'Voice', icon: 'Mic', type: 'action' as const, action: 'voice', position: 'center' as const, order: 2, enabled: true, isDefault: true, showBadge: false },
      { id: 'profile', label: 'Profile', icon: 'Settings', type: 'link' as const, path: '/settings', position: 'center' as const, order: 3, enabled: true, isDefault: true, showBadge: false },
      { id: 'home', label: 'Home', icon: 'Home', type: 'link' as const, path: '/', position: 'center' as const, order: 4, enabled: true, isDefault: true, showBadge: false },
    ];

    // Create a map of all buttons
    const allButtonsMap = new Map<string, CustomButton & { isDefault?: boolean }>();
    defaultButtons.forEach(btn => allButtonsMap.set(btn.id, btn));
    customButtons.forEach(btn => allButtonsMap.set(btn.id, btn));

    // Get all button IDs (default + custom)
    const allButtonIds = new Set([
      ...defaultButtons.map(b => b.id),
      ...customButtons.map(b => b.id)
    ]);

    // If we have a saved order, use it but also include any new buttons not in the order
    if (buttonOrder.length > 0) {
      const orderedButtons = buttonOrder
        .map(id => allButtonsMap.get(id))
        .filter((btn): btn is CustomButton & { isDefault?: boolean } => btn !== undefined);
      
      // Add any buttons that aren't in the saved order (new custom buttons)
      const orderedIds = new Set(buttonOrder);
      const newButtons = Array.from(allButtonIds)
        .filter(id => !orderedIds.has(id))
        .map(id => allButtonsMap.get(id))
        .filter((btn): btn is CustomButton & { isDefault?: boolean } => btn !== undefined);
      
      return [...orderedButtons, ...newButtons];
    }

    // Default order: merge and sort by position and order
    const allButtons = [...defaultButtons, ...customButtons];
    return allButtons.sort((a, b) => {
      const positionOrder = { left: 0, center: 1, right: 2 };
      if (positionOrder[a.position] !== positionOrder[b.position]) {
        return positionOrder[a.position] - positionOrder[b.position];
      }
      return a.order - b.order;
    });
  };

  // Handle drag end for reordering
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const allButtons = getAllButtons();
    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;

    if (sourceIndex === destIndex) return;

    const reorderedButtons = Array.from(allButtons);
    const [removed] = reorderedButtons.splice(sourceIndex, 1);
    reorderedButtons.splice(destIndex, 0, removed);

    // Store the full button order (all button IDs in order)
    const newButtonOrder = reorderedButtons.map(btn => btn.id);
    localStorage.setItem('lunchbox-bottom-bar-order', JSON.stringify(newButtonOrder));
    setButtonOrder(newButtonOrder); // Update state immediately
    window.dispatchEvent(new Event('bottom-bar-buttons-change'));

    // Update custom buttons with new orders
    const updatedCustomButtons = reorderedButtons
      .filter(btn => !(btn as any).isDefault)
      .map((btn) => ({
        ...btn,
        order: newButtonOrder.indexOf(btn.id),
      }));

    saveCustomButtons(updatedCustomButtons);
  };

  const variants = [
    {
      id: 'default',
      name: 'Default',
      description: 'Clean minimalistic',
      icon: Palette,
      preview: 'bg-gray-900 border-gray-700',
    },
    {
      id: 'elegant',
      name: 'Elegant',
      description: 'Subtle gradients',
      icon: Sparkles,
      preview: 'bg-gradient-to-r from-gray-900 to-gray-800 border-gray-600',
    },
    {
      id: 'unique',
      name: 'Unique',
      description: 'Bold distinctive',
      icon: Zap,
      preview: 'bg-gradient-to-r from-purple-900 to-blue-900 border-purple-600',
    },
    {
      id: 'cool',
      name: 'Cool',
      description: 'Cyan accents',
      icon: Sparkles,
      preview: 'bg-gradient-to-r from-cyan-900 to-blue-900 border-cyan-600',
    },
    {
      id: 'animated',
      name: 'Animated',
      description: 'Motion effects',
      icon: Zap,
      preview: 'bg-gradient-to-r from-pink-900 to-purple-900 border-pink-600 animate-pulse',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/settings')}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-headline">Bottom Bar</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Customize navigation</p>
          </div>
        </div>

        {/* Variants Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {variants.map((v) => (
            <Card
              key={v.id}
              className={`relative p-3 sm:p-4 cursor-pointer transition-all border-2 hover:scale-[1.02] ${
                variant === v.id ? 'border-primary shadow-lg shadow-primary/20' : 'border-gray-700/50 hover:border-gray-600'
              }`}
              onClick={() => handleVariantChange(v.id as BottomBarVariant)}
            >
              {variant === v.id && (
                <div className="absolute top-2 right-2 h-5 w-5 bg-primary rounded-full flex items-center justify-center">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-primary/10 rounded-lg">
                    <v.icon className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold">{v.name}</h3>
                </div>
                <p className="text-xs text-muted-foreground">{v.description}</p>
                <div className={`h-10 sm:h-12 rounded-lg border-2 ${v.preview}`} />
              </div>
            </Card>
          ))}

          {/* Custom Colors Card */}
          <Card
            className={`relative p-3 sm:p-4 cursor-pointer transition-all border-2 hover:scale-[1.02] ${
              variant === 'custom' ? 'border-primary shadow-lg shadow-primary/20' : 'border-gray-700/50 hover:border-gray-600'
            }`}
            onClick={() => handleVariantChange('custom')}
          >
            {variant === 'custom' && (
              <div className="absolute top-2 right-2 h-5 w-5 bg-primary rounded-full flex items-center justify-center">
                <Check className="h-3 w-3 text-white" />
              </div>
            )}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 rounded-lg">
                  <Palette className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-sm font-semibold">Custom</h3>
              </div>
              <p className="text-xs text-muted-foreground">Your own style</p>
              <div className="h-10 sm:h-12 rounded-lg border-2 bg-gradient-to-r from-orange-900 to-red-900 border-orange-600" />
            </div>
          </Card>
        </div>

        {/* Custom Color Pickers */}
        {variant === 'custom' && (
          <Card className="p-4 sm:p-6 border-gray-700/50">
            <h3 className="text-sm font-semibold mb-4">Custom Colors</h3>
            <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
              {Object.entries(customColors).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <Label className="text-xs capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={value}
                      onChange={(e) => handleColorChange(key, e.target.value)}
                      className="w-12 h-9 p-1 cursor-pointer border-gray-700"
                    />
                    <Input
                      type="text"
                      value={value}
                      onChange={(e) => handleColorChange(key, e.target.value)}
                      className="flex-1 h-9 text-xs border-gray-700"
                      placeholder="#000000"
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Button Animation Selector */}
        <Card className="p-4 sm:p-6 border-gray-700/50">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold mb-1">Button Animations</h3>
              <p className="text-xs text-muted-foreground">
                Choose how buttons animate on hover and click. Premium animations (6,000-10,000 credits) can be redeemed through Discord.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  if (!user?.uid) return;
                  console.log('[Settings] Manual refresh triggered');
                  try {
                    const prefs = await getUserPreferences(user.uid);
                    console.log('[Settings] Manual refresh - preferences:', prefs);
                    if (prefs?.unlockedAnimations) {
                      setUnlockedAnimations(prefs.unlockedAnimations);
                      console.log('[Settings] Manual refresh - set animations:', prefs.unlockedAnimations);
                    } else {
                      setUnlockedAnimations([]);
                    }
                  } catch (error) {
                    console.error('[Settings] Manual refresh error:', error);
                  }
                }}
                className="h-8"
              >
                🔄 Refresh
              </Button>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      if (!user) return;
                      try {
                        const token = await user.getIdToken();
                        const response = await fetch('/api/test/unlock-animation', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                          },
                          body: JSON.stringify({ animationId: 'bounce' }),
                        });
                        const data = await response.json();
                        if (data.success) {
                          const prefs = await getUserPreferences(user.uid);
                          if (prefs?.unlockedAnimations) {
                            setUnlockedAnimations(prefs.unlockedAnimations);
                          }
                          alert(`✅ Unlocked bounce!`);
                        } else {
                          alert(`❌ Failed: ${data.error}`);
                        }
                      } catch (error: any) {
                        alert(`❌ Error: ${error.message || error}`);
                      }
                    }}
                    className="h-8 text-xs"
                    disabled={unlockedAnimations.includes('bounce')}
                  >
                    {unlockedAnimations.includes('bounce') ? '✅ Bounce' : '🔓 Unlock Bounce'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      if (!user) return;
                      try {
                        const token = await user.getIdToken();
                        const response = await fetch('/api/test/unlock-animation', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                          },
                          body: JSON.stringify({ animationId: 'pulse' }),
                        });
                        const data = await response.json();
                        if (data.success) {
                          const prefs = await getUserPreferences(user.uid);
                          if (prefs?.unlockedAnimations) {
                            setUnlockedAnimations(prefs.unlockedAnimations);
                          }
                          alert(`✅ Unlocked pulse!`);
                        } else {
                          alert(`❌ Failed: ${data.error}`);
                        }
                      } catch (error: any) {
                        alert(`❌ Error: ${error.message || error}`);
                      }
                    }}
                    className="h-8 text-xs"
                    disabled={unlockedAnimations.includes('pulse')}
                  >
                    {unlockedAnimations.includes('pulse') ? '✅ Pulse' : '🔓 Unlock Pulse'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      if (!user) return;
                      try {
                        const token = await user.getIdToken();
                        const response = await fetch('/api/test/unlock-animation', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                          },
                          body: JSON.stringify({ animationId: 'rotate' }),
                        });
                        const data = await response.json();
                        if (data.success) {
                          const prefs = await getUserPreferences(user.uid);
                          if (prefs?.unlockedAnimations) {
                            setUnlockedAnimations(prefs.unlockedAnimations);
                          }
                          alert(`✅ Unlocked rotate!`);
                        } else {
                          alert(`❌ Failed: ${data.error}`);
                        }
                      } catch (error: any) {
                        alert(`❌ Error: ${error.message || error}`);
                      }
                    }}
                    className="h-8 text-xs"
                    disabled={unlockedAnimations.includes('rotate')}
                  >
                    {unlockedAnimations.includes('rotate') ? '✅ Rotate' : '🔓 Unlock Rotate'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <div className="mb-2 text-xs text-muted-foreground">
            Current unlocked: {unlockedAnimations.length > 0 ? unlockedAnimations.join(', ') : 'None'}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { id: 'scale', name: 'Scale', description: 'Default - Scale & rotate', cost: 'Free', unlocked: true },
              { id: 'bounce', name: 'Bounce', description: 'Bounce on hover/click', cost: '6,000 credits', unlocked: unlockedAnimations.includes('bounce') },
              { id: 'pulse', name: 'Pulse', description: 'Pulsing glow effect', cost: '8,000 credits', unlocked: unlockedAnimations.includes('pulse') },
              { id: 'rotate', name: 'Rotate', description: 'Rotation on hover/click', cost: '10,000 credits', unlocked: unlockedAnimations.includes('rotate') },
              { id: 'none', name: 'None', description: 'No animation', cost: 'Free', unlocked: true },
            ].map((anim) => (
              <Card
                key={anim.id}
                className={`relative p-3 cursor-pointer transition-all border-2 ${
                  animationVariant === anim.id 
                    ? 'border-primary shadow-lg shadow-primary/20' 
                    : 'border-gray-700/50 hover:border-gray-600'
                } ${!anim.unlocked ? 'opacity-50' : ''}`}
                onClick={() => handleAnimationChange(anim.id as any)}
              >
                {animationVariant === anim.id && (
                  <div className="absolute top-2 right-2 h-5 w-5 bg-primary rounded-full flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
                {!anim.unlocked && (
                  <div className="absolute top-2 left-2">
                    <Badge variant="outline" className="text-[8px] px-1 py-0 h-4 bg-yellow-900/50 border-yellow-700 text-yellow-300">
                      Locked
                    </Badge>
                  </div>
                )}
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold">{anim.name}</h4>
                  <p className="text-xs text-muted-foreground">{anim.description}</p>
                  <p className="text-xs text-yellow-400">{anim.cost}</p>
                  {!anim.unlocked && anim.cost !== 'Free' && (
                    <p className="text-[10px] text-purple-300 mt-1">
                      Redeem via Discord: <code className="bg-gray-900 px-1 py-0.5 rounded text-[9px]">/redeem animation-{anim.id}</code>
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </Card>

        {/* Bottom Bar Preview */}
        <Card className="p-4 sm:p-6 border-gray-700/50">
          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-1">Bottom Bar Preview</h3>
            <p className="text-xs text-muted-foreground">
              Drag buttons to reorder them. Default buttons (Message, Tasks, Voice, Profile, Home) can also be reordered.
            </p>
          </div>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="bottom-bar-buttons" direction="horizontal">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="flex items-center justify-center gap-2 p-4 bg-gray-900/50 rounded-lg border border-gray-700/50 min-h-[80px] flex-wrap"
                >
                  {getAllButtons().map((button, index) => {
                    const IconComponent = button.icon === 'custom' 
                      ? null 
                      : ((Icons as any)[button.icon] || Icons.Circle);
                    
                    return (
                      <Draggable key={button.id} draggableId={button.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`relative flex items-center justify-center h-10 w-10 rounded-full border-2 transition-all cursor-move ${
                              snapshot.isDragging 
                                ? 'opacity-50 scale-95 border-primary z-50' 
                                : 'border-gray-700 hover:border-gray-600'
                            } ${
                              (button as any).isDefault 
                                ? 'bg-gray-800/50' 
                                : 'bg-gray-800'
                            }`}
                            style={provided.draggableProps.style}
                            title={button.label}
                          >
                            {button.icon === 'custom' && button.customIconUrl ? (
                              <img 
                                src={button.customIconUrl} 
                                alt={button.label} 
                                className="h-5 w-5 rounded object-contain"
                                onError={(e) => {
                                  // Fallback to default icon if image fails to load
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  if (target.parentElement) {
                                    const fallback = document.createElement('div');
                                    fallback.className = 'h-5 w-5 flex items-center justify-center';
                                    const CircleIcon = Icons.Circle;
                                    target.parentElement.appendChild(fallback);
                                  }
                                }}
                              />
                            ) : IconComponent ? (
                              <IconComponent className="h-5 w-5 text-gray-300" />
                            ) : (
                              <Icons.Circle className="h-5 w-5 text-gray-300" />
                            )}
                            {(button as any).isDefault && (
                              <Badge variant="outline" className="absolute -top-2 -right-2 text-[8px] px-1 py-0 h-4 bg-gray-900 border-gray-600">
                                Default
                              </Badge>
                            )}
                            {(button as CustomButton).showBadge && (button as CustomButton).badgeCount !== undefined && (button as CustomButton).badgeCount! > 0 && (
                              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                {(button as CustomButton).badgeCount! > 9 ? '9+' : (button as CustomButton).badgeCount}
                              </span>
                            )}
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </Card>

        {/* Custom Buttons Section */}
        <Card className="p-4 sm:p-6 border-gray-700/50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold">Custom Buttons</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Add, edit, or remove buttons from the bottom bar ({customButtons.length}/{MAX_BUTTONS})
              </p>
            </div>
            <div className="flex gap-2">
              {customButtons.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetButtons}
                  className="h-9"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleAddButton}
                disabled={customButtons.length >= MAX_BUTTONS}
                className="h-9"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Button
              </Button>
            </div>
          </div>

          {customButtons.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-700/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">No custom buttons yet</p>
              <p className="text-xs text-muted-foreground">Click "Add Button" to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {customButtons
                .sort((a, b) => {
                  const positionOrder = { left: 0, center: 1, right: 2 };
                  if (positionOrder[a.position] !== positionOrder[b.position]) {
                    return positionOrder[a.position] - positionOrder[b.position];
                  }
                  return a.order - b.order;
                })
                .map((button) => (
                  <div
                    key={button.id}
                    className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50"
                  >
                    <GripVertical className="h-4 w-4 text-gray-500 cursor-move" />
                    <div className="flex-1 flex items-center gap-3">
                      {button.icon === 'custom' && button.customIconUrl ? (
                        <img src={button.customIconUrl} alt={button.label} className="h-5 w-5" />
                      ) : (
                        <div className="h-5 w-5 flex items-center justify-center">
                          {React.createElement((Icons as any)[button.icon] || Icons.Circle, { className: 'h-5 w-5' })}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{button.label}</span>
                          <Badge variant="outline" className="text-xs">
                            {button.position}
                          </Badge>
                          {!button.enabled && (
                            <Badge variant="secondary" className="text-xs">Disabled</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {button.type === 'link' ? button.path : button.action}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={button.enabled}
                      onCheckedChange={() => handleToggleButton(button.id)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditButton(button)}
                      className="h-8 w-8"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteButton(button.id)}
                      className="h-8 w-8 text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
            </div>
          )}
        </Card>

        {/* Button Editor Dialog */}
        <ButtonEditorDialog
          isOpen={isDialogOpen}
          onClose={() => {
            setIsDialogOpen(false);
            setEditingButton(null);
            setIconSearch('');
          }}
          button={editingButton}
          onSave={(button) => {
            if (editingButton) {
              // Update existing button
              const newButtons = customButtons.map(b => 
                b.id === editingButton.id ? button : b
              );
              saveCustomButtons(newButtons);
            } else {
              // Add new button
              const newButtons = [...customButtons, button];
              saveCustomButtons(newButtons);
            }
            setIsDialogOpen(false);
            setEditingButton(null);
            setIconSearch('');
          }}
          existingButtons={customButtons}
        />
      </div>
    </div>
  );
}

// Button Editor Dialog Component
function ButtonEditorDialog({
  isOpen,
  onClose,
  button,
  onSave,
  existingButtons,
}: {
  isOpen: boolean;
  onClose: () => void;
  button: CustomButton | null;
  onSave: (button: CustomButton) => void;
  existingButtons: CustomButton[];
}) {
  const [label, setLabel] = useState('');
  const [icon, setIcon] = useState('Circle');
  const [iconType, setIconType] = useState<'lucide' | 'custom'>('lucide');
  const [customIconUrl, setCustomIconUrl] = useState('');
  const [type, setType] = useState<'link' | 'action'>('link');
  const [path, setPath] = useState('/');
  const [action, setAction] = useState('new-task');
  const [position, setPosition] = useState<'left' | 'center' | 'right'>('center');
  const [enabled, setEnabled] = useState(true);
  const [showBadge, setShowBadge] = useState(false);
  const [badgeCount, setBadgeCount] = useState(0);
  const [colors, setColors] = useState({
    background: '#374151',
    text: '#ffffff',
    hoverBackground: '#4b5563',
    hoverText: '#ffffff',
  });
  const [iconSearch, setIconSearch] = useState('');

  useEffect(() => {
    if (button) {
      setLabel(button.label);
      setIcon(button.icon);
      setIconType(button.icon === 'custom' ? 'custom' : 'lucide');
      setCustomIconUrl(button.customIconUrl || '');
      setType(button.type);
      setPath(button.path || '/');
      setAction(button.action || 'new-task');
      setPosition(button.position);
      setEnabled(button.enabled);
      setShowBadge(button.showBadge || false);
      setBadgeCount(button.badgeCount || 0);
      setColors({
        background: button.colors?.background || '#374151',
        text: button.colors?.text || '#ffffff',
        hoverBackground: button.colors?.hoverBackground || '#4b5563',
        hoverText: button.colors?.hoverText || '#ffffff',
      });
    } else {
      // Reset to defaults
      setLabel('');
      setIcon('Circle');
      setIconType('lucide');
      setCustomIconUrl('');
      setType('link');
      setPath('/');
      setAction('new-task');
      setPosition('center');
      setEnabled(true);
      setShowBadge(false);
      setBadgeCount(0);
      setColors({
        background: '#374151',
        text: '#ffffff',
        hoverBackground: '#4b5563',
        hoverText: '#ffffff',
      });
    }
    // Reset icon search when dialog opens
    setIconSearch('');
  }, [button, isOpen]);

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomIconUrl(reader.result as string);
        setIconType('custom');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!label.trim()) {
      alert('Please enter a label');
      return;
    }

    // Calculate order based on position
    const positionButtons = existingButtons.filter(b => b.position === position);
    const maxOrder = positionButtons.length > 0 
      ? Math.max(...positionButtons.map(b => b.order))
      : -1;

    const newButton: CustomButton = {
      id: button?.id || `btn-${Date.now()}`,
      label: label.trim(),
      icon: iconType === 'custom' ? 'custom' : icon,
      customIconUrl: iconType === 'custom' ? customIconUrl : undefined,
      type,
      path: type === 'link' ? path : undefined,
      action: type === 'action' ? action : undefined,
      position,
      order: button?.order ?? maxOrder + 1,
      enabled,
      showBadge,
      badgeCount: showBadge ? badgeCount : undefined,
      colors,
    };

    onSave(newButton);
  };

  // Filter icons based on search - this needs to be reactive
  const filteredIcons = React.useMemo(() => {
    const allIcons = getLucideIcons();
    const searchTerm = iconSearch.trim().toLowerCase();
    if (!searchTerm) {
      return allIcons.slice(0, 50);
    }
    const filtered = allIcons.filter(iconName => 
      iconName.toLowerCase().includes(searchTerm)
    );
    // Return up to 50 results, or all if less than 50
    return filtered.slice(0, 50);
  }, [iconSearch]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{button ? 'Edit Button' : 'Add Custom Button'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Label */}
          <div className="space-y-2">
            <Label>Label</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Button label"
            />
          </div>

          {/* Icon Type */}
          <div className="space-y-2">
            <Label>Icon Type</Label>
            <Select value={iconType} onValueChange={(v: 'lucide' | 'custom') => setIconType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lucide">Lucide Icon</SelectItem>
                <SelectItem value="custom">Upload Custom Icon</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Icon Selection */}
          {iconType === 'lucide' ? (
            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={iconSearch}
                  onChange={(e) => setIconSearch(e.target.value)}
                  placeholder="Search icons..."
                  className="pl-9"
                />
              </div>
              <div className="grid grid-cols-8 gap-2 max-h-48 overflow-y-auto p-2 border rounded-lg">
                {filteredIcons.length > 0 ? (
                  filteredIcons.map((iconName) => {
                    try {
                      const IconComponent = (Icons as any)[iconName];
                      if (!IconComponent) {
                        console.warn(`Icon "${iconName}" not found in Icons object`);
                        return null;
                      }
                      return (
                        <button
                          key={iconName}
                          onClick={() => setIcon(iconName)}
                          className={`p-2 rounded border transition-colors ${
                            icon === iconName
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'border-gray-700 hover:border-gray-600'
                          }`}
                          title={iconName}
                        >
                          <IconComponent className="h-4 w-4" />
                        </button>
                      );
                    } catch (error) {
                      console.error(`Error rendering icon "${iconName}":`, error);
                      return null;
                    }
                  })
                ) : (
                  <div className="col-span-8 text-center text-sm text-muted-foreground py-4">
                    No icons found matching "{iconSearch}"
                    <div className="text-xs mt-2 text-muted-foreground/70">
                      Try searching for: home, search, user, settings, etc.
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Upload Icon</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleIconUpload}
                className="cursor-pointer"
              />
              {customIconUrl && (
                <div className="mt-2">
                  <img src={customIconUrl} alt="Custom icon" className="h-10 w-10 rounded" />
                </div>
              )}
            </div>
          )}

          {/* Type */}
          <div className="space-y-2">
            <Label>Button Type</Label>
            <Select value={type} onValueChange={(v: 'link' | 'action') => setType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="link">Link to Page</SelectItem>
                <SelectItem value="action">Action</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Path or Action */}
          {type === 'link' ? (
            <div className="space-y-2">
              <Label>Path</Label>
              <Select value={path} onValueChange={setPath}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_PATHS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Action</Label>
              <Select value={action} onValueChange={setAction}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_ACTIONS.map((a) => (
                    <SelectItem key={a.value} value={a.value}>
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Position */}
          <div className="space-y-2">
            <Label>Position</Label>
            <Select value={position} onValueChange={(v: 'left' | 'center' | 'right') => setPosition(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="right">Right</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Colors */}
          <div className="space-y-4">
            <Label>Button Colors</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Background</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={colors.background}
                    onChange={(e) => setColors({ ...colors, background: e.target.value })}
                    className="w-12 h-9 p-1 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={colors.background}
                    onChange={(e) => setColors({ ...colors, background: e.target.value })}
                    className="flex-1 h-9 text-xs"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Text</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={colors.text}
                    onChange={(e) => setColors({ ...colors, text: e.target.value })}
                    className="w-12 h-9 p-1 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={colors.text}
                    onChange={(e) => setColors({ ...colors, text: e.target.value })}
                    className="flex-1 h-9 text-xs"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Hover Background</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={colors.hoverBackground}
                    onChange={(e) => setColors({ ...colors, hoverBackground: e.target.value })}
                    className="w-12 h-9 p-1 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={colors.hoverBackground}
                    onChange={(e) => setColors({ ...colors, hoverBackground: e.target.value })}
                    className="flex-1 h-9 text-xs"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Hover Text</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={colors.hoverText}
                    onChange={(e) => setColors({ ...colors, hoverText: e.target.value })}
                    className="w-12 h-9 p-1 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={colors.hoverText}
                    onChange={(e) => setColors({ ...colors, hoverText: e.target.value })}
                    className="flex-1 h-9 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Badge */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Badge</Label>
              <p className="text-xs text-muted-foreground">Display a badge with count</p>
            </div>
            <Switch checked={showBadge} onCheckedChange={setShowBadge} />
          </div>

          {showBadge && (
            <div className="space-y-2">
              <Label>Badge Count</Label>
              <Input
                type="number"
                value={badgeCount}
                onChange={(e) => setBadgeCount(parseInt(e.target.value) || 0)}
                min={0}
              />
            </div>
          )}

          {/* Enabled */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enabled</Label>
              <p className="text-xs text-muted-foreground">Button is active</p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {button ? 'Save Changes' : 'Add Button'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

