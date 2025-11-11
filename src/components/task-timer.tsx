'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Play, Pause, Square, Clock, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskTimerProps {
  taskId: string;
  taskTitle: string;
  userEmail?: string;
  userName?: string;
  onTimerComplete?: (taskId: string, duration: number) => void;
}

export function TaskTimer({ taskId, taskTitle, userEmail, userName, onTimerComplete }: TaskTimerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [initialTime, setInitialTime] = useState(0);
  const [customTime, setCustomTime] = useState({ hours: 0, minutes: 5, seconds: 0 });
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Timer presets (in minutes)
  const presets = [
    { label: '30s', seconds: 30 },
    { label: '1m', seconds: 60 },
    { label: '5m', seconds: 300 },
    { label: '10m', seconds: 600 },
    { label: '15m', seconds: 900 },
    { label: '30m', seconds: 1800 },
    { label: '1h', seconds: 3600 },
    { label: '2h', seconds: 7200 }
  ];

  const sendTimerNotification = useCallback(async () => {
    if (!userEmail) return;
    
    try {
      console.log(`🔔 Timer completed for task: ${taskTitle}`);
      
      // Create a timer completion reminder
      const reminderData = {
        taskId: `timer-${taskId}`,
        userId: 'timer-user',
        userEmail: userEmail,
        userName: userName || 'User',
        remindAtTime: new Date().toISOString(),
        message: `⏰ Timer completed: ${taskTitle}`,
        sentStatus: false,
        createdAt: new Date().toISOString(),
        reminderType: 'timer_complete'
      };

      // Send notification via API
      await fetch('/api/send-timer-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reminderData)
      });

      console.log('✅ Timer notification sent');
    } catch (error) {
      console.error('❌ Failed to send timer notification:', error);
    }
  }, [taskId, taskTitle, userEmail, userName]);

  // Timer countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  // Timer completion effect
  useEffect(() => {
    if (timeLeft === 0 && isRunning && initialTime > 0) {
      setIsRunning(false);
      sendTimerNotification();
      onTimerComplete?.(taskId, initialTime);
    }
  }, [timeLeft, isRunning, initialTime, taskId, onTimerComplete, sendTimerNotification]);

  const startTimer = (totalSeconds: number) => {
    setInitialTime(totalSeconds);
    setTimeLeft(totalSeconds);
    setIsRunning(true);
    setShowCustomInput(false);
  };

  const startCustomTimer = () => {
    const totalSeconds = customTime.hours * 3600 + customTime.minutes * 60 + customTime.seconds;
    if (totalSeconds > 0) {
      startTimer(totalSeconds);
    }
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resumeTimer = () => {
    setIsRunning(true);
  };

  const stopTimer = () => {
    setIsRunning(false);
    setTimeLeft(0);
    setInitialTime(0);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    if (initialTime === 0) return 0;
    return ((initialTime - timeLeft) / initialTime) * 100;
  };

  return (
    <div className="p-4 space-y-4 min-w-[280px]">
      <div className="flex items-center gap-2 mb-3">
        <Timer className="h-4 w-4 text-blue-500" />
        <h3 className="font-medium text-sm">Timer for "{taskTitle}"</h3>
      </div>

      {/* Timer Display */}
      {timeLeft > 0 && (
        <div className="text-center space-y-2">
          <div className="text-2xl font-mono font-bold text-blue-500">
            {formatTime(timeLeft)}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
          <div className="flex gap-2 justify-center">
            {isRunning ? (
              <Button onClick={pauseTimer} size="sm" variant="outline">
                <Pause className="h-3 w-3 mr-1" />
                Pause
              </Button>
            ) : (
              <Button onClick={resumeTimer} size="sm" variant="outline">
                <Play className="h-3 w-3 mr-1" />
                Resume
              </Button>
            )}
            <Button onClick={stopTimer} size="sm" variant="outline">
              <Square className="h-3 w-3 mr-1" />
              Stop
            </Button>
          </div>
        </div>
      )}

      {/* Timer Presets */}
      {timeLeft === 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2">
            {presets.map((preset) => (
              <Button
                key={preset.label}
                onClick={() => startTimer(preset.seconds)}
                size="sm"
                variant="outline"
                className="text-xs"
              >
                {preset.label}
              </Button>
            ))}
          </div>

          {/* Custom Timer */}
          <div className="space-y-2">
            <Button
              onClick={() => setShowCustomInput(!showCustomInput)}
              size="sm"
              variant="ghost"
              className="w-full text-xs"
            >
              <Clock className="h-3 w-3 mr-1" />
              Custom Time
            </Button>
            
            {showCustomInput && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="custom-hours" className="text-xs">
                      Hours
                    </Label>
                    <Input
                      id="custom-hours"
                      type="number"
                      min="0"
                      max="23"
                      value={customTime.hours}
                      onChange={(e) => setCustomTime(prev => ({ ...prev, hours: parseInt(e.target.value) || 0 }))}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="custom-minutes" className="text-xs">
                      Minutes
                    </Label>
                    <Input
                      id="custom-minutes"
                      type="number"
                      min="0"
                      max="59"
                      value={customTime.minutes}
                      onChange={(e) => setCustomTime(prev => ({ ...prev, minutes: parseInt(e.target.value) || 0 }))}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="custom-seconds" className="text-xs">
                      Seconds
                    </Label>
                    <Input
                      id="custom-seconds"
                      type="number"
                      min="0"
                      max="59"
                      value={customTime.seconds}
                      onChange={(e) => setCustomTime(prev => ({ ...prev, seconds: parseInt(e.target.value) || 0 }))}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                <Button
                  onClick={startCustomTimer}
                  size="sm"
                  className="w-full"
                  disabled={customTime.hours === 0 && customTime.minutes === 0 && customTime.seconds === 0}
                >
                  Start Custom Timer ({formatTime(customTime.hours * 3600 + customTime.minutes * 60 + customTime.seconds)})
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Timer Status */}
      {timeLeft > 0 && (
        <div className="text-xs text-muted-foreground text-center">
          {isRunning ? (
            <span className="text-blue-500">⏰ Timer running...</span>
          ) : (
            <span className="text-orange-500">⏸️ Timer paused</span>
          )}
        </div>
      )}
    </div>
  );
}
