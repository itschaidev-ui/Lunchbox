'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Clock, Bell, Globe } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import {
  getRoutineSettings,
  updateResetTime,
  updateNotificationTime,
  type RoutineSettings,
} from '@/lib/firebase-routine-settings';

interface RoutineSettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function RoutineSettingsDialog({ open, onClose }: RoutineSettingsDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<RoutineSettings | null>(null);
  const [resetTime, setResetTime] = useState('00:00');
  const [notificationTime, setNotificationTime] = useState('07:00');

  useEffect(() => {
    if (open && user?.uid) {
      loadSettings();
    }
  }, [open, user?.uid]);

  const loadSettings = async () => {
    if (!user?.uid) return;
    
    try {
      setLoading(true);
      const userSettings = await getRoutineSettings(user.uid);
      setSettings(userSettings);
      setResetTime(userSettings.resetTime);
      setNotificationTime(userSettings.notificationTime);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.uid) return;

    try {
      setSaving(true);
      
      // Update reset time
      await updateResetTime(user.uid, resetTime);
      
      // Update notification time
      await updateNotificationTime(user.uid, notificationTime);
      
      alert(`✅ Settings Saved!\n\nReset Time: ${resetTime}\nNotification Time: ${notificationTime}\n\nNote: For testing, use the "Reset All" button to manually reset your routines.`);
      onClose();
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('❌ Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-gray-900 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Clock className="h-5 w-5 text-blue-400" />
            Routine Settings
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Customize when your routines reset and when you get notified
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Reset Time */}
            <div className="space-y-2">
              <Label htmlFor="resetTime" className="flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4 text-blue-400" />
                Reset Time
              </Label>
              <Input
                id="resetTime"
                type="time"
                value={resetTime}
                onChange={(e) => setResetTime(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
              <p className="text-xs text-gray-400">
                Daily time when routine completions reset (default: 00:00 midnight)
              </p>
            </div>

            {/* Notification Time */}
            <div className="space-y-2">
              <Label htmlFor="notificationTime" className="flex items-center gap-2 text-sm font-medium">
                <Bell className="h-4 w-4 text-yellow-400" />
                Notification Time
              </Label>
              <Input
                id="notificationTime"
                type="time"
                value={notificationTime}
                onChange={(e) => setNotificationTime(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
              <p className="text-xs text-gray-400">
                Daily reminder time for routine tasks (default: 07:00 AM)
              </p>
            </div>

            {/* Timezone Info */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Globe className="h-4 w-4 text-green-400" />
                Your Timezone
              </Label>
              <div className="bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-300">
                {settings?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone}
              </div>
              <p className="text-xs text-gray-400">
                Detected automatically from your browser
              </p>
            </div>

            {/* Testing Note */}
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
              <p className="text-xs text-orange-300 font-medium mb-1">
                🧪 Testing Mode
              </p>
              <p className="text-xs text-gray-400">
                For immediate testing, use the <strong>"Reset All"</strong> button to manually reset your routines without waiting for the scheduled time.
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saving}
            className="border-gray-600 hover:bg-gray-800"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || loading}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

