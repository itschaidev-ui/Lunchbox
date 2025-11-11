
'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import type { Task } from '@/lib/types';
import { trackEvent, setTag } from '@/lib/clarity';
import { useAuth } from '@/context/auth-context';
import { 
  saveTask as saveTaskToFirebase, 
  updateTask as updateTaskInFirebase, 
  deleteTask as deleteTaskFromFirebase,
  subscribeToUserTasks,
  fetchUserTasks
} from '@/lib/firebase-tasks';
// Removed old reminders system imports
// Notification scheduling moved to server-side API calls

type TaskContextType = {
    tasks: Task[];
    loading: boolean;
    addTask: (task: Omit<Task, 'id' | 'completed'>) => void;
    addMultipleTasks: (tasks: Omit<Task, 'id' | 'completed'>[]) => void;
    toggleTask: (id: string) => void;
    deleteTask: (id: string) => void;
    editTask: (id: string, updatedTask: Partial<Omit<Task, 'id' | 'completed'>>) => void;
    fetchTasks: () => Promise<void>;
};

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: ReactNode }) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    // Track tasks that are being updated optimistically to prevent listener from overwriting
    const pendingUpdatesRef = useRef<Map<string, { completed: boolean; timestamp: number }>>(new Map());

    const addTask = async (task: Omit<Task, 'id' | 'completed'>) => {
        if (!user || !user.email) {
            console.log('No user or email, cannot create task');
            throw new Error('User not authenticated');
        }
        
        try {
            console.log('🔍 Creating task in Firebase:', task);
            console.log('🔍 Task attachments:', task.attachments);
            const taskWithCompleted = { ...task, completed: false };
            console.log('🔍 Task with completed flag:', JSON.stringify(taskWithCompleted, null, 2));
            const taskId = await saveTaskToFirebase(taskWithCompleted, user.uid, user.email);
            console.log('✅ Task saved to Firebase with ID:', taskId);
            
            // Track task creation
            trackEvent('task_created');
            setTag('total_tasks', (tasks.length + 1).toString());
            
        // Schedule notifications for the task with new simple system
        if (task.dueDate && user) {
            try {
                await fetch('/api/simple-notifications/schedule', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        taskId,
                        userId: user.uid,
                        userEmail: user.email,
                        userName: user.displayName || 'User',
                        taskTitle: task.text,
                        dueDate: task.dueDate
                    })
                });
                console.log('✅ Simple notifications scheduled for task');
                
                // IMMEDIATELY check for due notifications
                await fetch('/api/simple-notifications/process', {
                    method: 'POST'
                });
                console.log('✅ Immediate notification check completed');
            } catch (notificationError) {
                console.log('Simple notification scheduling failed (non-critical):', notificationError);
            }
        }
            
            return taskId;
        } catch (error) {
            console.error('Error saving task:', error);
            throw error; // Re-throw the error so it can be caught by the caller
        }
    };
    
    const addMultipleTasks = async (newTasks: Omit<Task, 'id' | 'completed'>[]) => {
        if (!user || !user.email) {
            console.log('No user or email, cannot add tasks');
            return;
        }
        
        console.log('Adding multiple tasks:', newTasks);
        try {
            const tasksToAdd: Task[] = [];
            for (const task of newTasks) {
                const taskWithCompleted = { ...task, completed: false };
                console.log('Saving task to Firebase:', taskWithCompleted);
                const taskId = await saveTaskToFirebase(taskWithCompleted, user.uid, user.email);
                console.log('Task saved with ID:', taskId);
                tasksToAdd.push({
                    id: taskId,
                    ...taskWithCompleted,
                });
            }
            console.log('All tasks saved to Firebase, waiting for real-time subscription to update UI');
            // Don't manually update state - let the Firebase subscription handle it
            // setTasks(prev => [...tasksToAdd, ...prev]);
            console.log('Tasks will be updated via Firebase subscription');
        } catch (error) {
            console.error('Error saving multiple tasks:', error);
        }
    };

    const toggleTask = async (id: string) => {
        const task = tasks.find(t => t.id === id);
        if (!task) return;
        
        // Store the new completed state
        const newCompletedState = !task.completed;
        
        // Track this as a pending update to prevent listener from overwriting
        pendingUpdatesRef.current.set(id, {
            completed: newCompletedState,
            timestamp: Date.now(),
        });
        
        // Optimistic update - update state immediately
        setTasks(prev => {
            const updatedTasks = prev.map(t =>
                t.id === id ? { ...t, completed: newCompletedState } : t
            );
            
            // Track task completion
            const completedTasks = updatedTasks.filter(t => t.completed).length;
            trackEvent('task_toggled');
            setTag('completed_tasks', completedTasks.toString());
            setTag('completion_rate', ((completedTasks / updatedTasks.length) * 100).toFixed(1));
            
            return updatedTasks;
        });
        
        try {
            // Update Firebase
            await updateTaskInFirebase(id, { completed: newCompletedState });
            
            // Clear pending update after successful Firebase update (with delay to allow listener to process)
            setTimeout(() => {
                pendingUpdatesRef.current.delete(id);
            }, 5000); // 5 seconds delay to allow Firebase listener to process
            
            // Award credits immediately after task completion (with small delay to ensure Firestore update completes)
            if (newCompletedState && user) {
                // Small delay to ensure the task's completed state is saved to Firestore first
                setTimeout(async () => {
                    // Award randomized credits (10-20) once per task completion
                    // Try server-side API first, fallback to client-side if Admin SDK not available
                    try {
                        const res = await fetch('/api/credits/award-on-complete', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ taskId: id, userId: user.uid }),
                        });
                        const data = await res.json().catch(() => null);
                        if (res.ok && data?.success) {
                            console.log(`✨ Awarded ${data.amount} credits for completing task ${id}`);
                            // Refresh credits context
                            try {
                                window.dispatchEvent(new CustomEvent('credits-updated'));
                            } catch (e) {
                                // Ignore
                            }
                        } else if (data?.alreadyAwarded) {
                            console.log(`ℹ️ Credits already awarded for task ${id} (amount ${data.amount})`);
                        } else if (data?.skipped) {
                            // Admin SDK not available, try client-side fallback
                            console.log('⚠️ Server-side credit award unavailable, trying client-side...');
                            try {
                                const { awardTaskCompletionCredits } = await import('@/lib/firebase-credits');
                                const clientResult = await awardTaskCompletionCredits(user.uid, id);
                                if (clientResult.success && clientResult.amount) {
                                    console.log(`✨ Awarded ${clientResult.amount} credits via client-side (task ${id})`);
                                    window.dispatchEvent(new CustomEvent('credits-updated'));
                                } else if (clientResult.alreadyAwarded) {
                                    console.log(`ℹ️ Credits already awarded for task ${id}`);
                                } else {
                                    console.warn('⚠️ Client-side credit award failed:', clientResult.error);
                                }
                            } catch (clientError) {
                                console.warn('⚠️ Client-side credit award error:', clientError);
                            }
                        } else {
                            console.log('Credit award skipped, trying client-side fallback:', data?.error || res.status);
                            // Try client-side fallback if server-side failed
                            try {
                                const { awardTaskCompletionCredits } = await import('@/lib/firebase-credits');
                                const clientResult = await awardTaskCompletionCredits(user.uid, id);
                                if (clientResult.success && clientResult.amount) {
                                    console.log(`✨ Awarded ${clientResult.amount} credits via client-side fallback (task ${id})`);
                                    window.dispatchEvent(new CustomEvent('credits-updated'));
                                } else if (clientResult.alreadyAwarded) {
                                    console.log(`ℹ️ Credits already awarded for task ${id}`);
                                }
                            } catch (clientError) {
                                console.warn('⚠️ Client-side credit award also failed:', clientError);
                            }
                        }
                    } catch (creditsError) {
                        console.log('Credit award request failed, trying client-side fallback:', creditsError);
                        // Try client-side fallback
                        try {
                            const { awardTaskCompletionCredits } = await import('@/lib/firebase-credits');
                            const clientResult = await awardTaskCompletionCredits(user.uid, id);
                            if (clientResult.success && clientResult.amount) {
                                console.log(`✨ Awarded ${clientResult.amount} credits via client-side fallback (task ${id})`);
                                window.dispatchEvent(new CustomEvent('credits-updated'));
                            } else if (clientResult.alreadyAwarded) {
                                console.log(`ℹ️ Credits already awarded for task ${id}`);
                            }
                        } catch (clientError) {
                            console.warn('⚠️ Client-side credit award also failed:', clientError);
                        }
                    }
                    
                    // Check achievements when task is completed
                    try {
                        await fetch('/api/achievements/check', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ userId: user.uid }),
                        });
                        console.log('✅ Achievement check triggered');
                    } catch (achievementError) {
                        console.log('Achievement check failed (non-critical):', achievementError);
                    }
                }, 500); // 500ms delay to ensure Firestore update completes
            }
            
            // Add cooldown delay before sending notifications (2 seconds)
            // This allows the task state to fully propagate before notifications are sent
            setTimeout(async () => {
                // Check for due notifications when task is completed
                try {
                    await fetch('/api/simple-notifications/process', {
                        method: 'POST'
                    });
                    console.log('✅ Notification check completed after task completion (with cooldown)');
                } catch (notificationError) {
                    console.log('Notification check failed (non-critical):', notificationError);
                }
                
                // Trigger Discord notification if task was just completed (not uncompleted)
                if (newCompletedState) {
                    try {
                        await fetch('/api/discord/notify-task-completed', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ taskId: id }),
                        });
                        console.log('✅ Discord notification triggered for task completion (with cooldown)');
                    } catch (discordError) {
                        console.log('Discord notification failed (non-critical):', discordError);
                    }
                }
                
                // Trigger completion email notification (works without Admin SDK)
                if (user) {
                    try {
                        await fetch('/api/tasks/complete-email', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ 
                                taskId: id, 
                                userId: user.uid,
                                completed: newCompletedState 
                            }),
                        });
                        console.log('✅ Completion email triggered (with cooldown)');
                    } catch (emailError) {
                        console.log('Completion email failed (non-critical):', emailError);
                    }
                }
            }, 2000); // 2 second cooldown before sending notifications
        } catch (error) {
            console.error('Error toggling task:', error);
            // Revert optimistic update on error
            pendingUpdatesRef.current.delete(id);
            setTasks(prev => {
                return prev.map(t =>
                    t.id === id ? { ...t, completed: task.completed } : t
                );
            });
        }
    };

    const deleteTask = async (id: string) => {
        try {
            await deleteTaskFromFirebase(id);
            setTasks(prev => prev.filter(task => task.id !== id));
            
            // Cancel notifications for deleted task with new simple system
            try {
                await fetch('/api/simple-notifications/cancel', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ taskId: id })
                });
                console.log('✅ Simple notifications cancelled for deleted task');
            } catch (notificationError) {
                console.log('Simple notification cancellation failed (non-critical):', notificationError);
            }
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    };

    const editTask = async (id: string, updatedTask: Partial<Omit<Task, 'id' | 'completed'>>) => {
        try {
            await updateTaskInFirebase(id, updatedTask);
            setTasks(prev => 
                prev.map(task => 
                    task.id === id ? { ...task, ...updatedTask } : task
                )
            );
            
            // Update notifications if due date changed with new simple system
            if (updatedTask.dueDate && user) {
                try {
                    const oldTask = tasks.find(t => t.id === id);
                    if (oldTask) {
                        const dueDateChanged = oldTask.dueDate !== updatedTask.dueDate;
                        
                        if (dueDateChanged) {
                            // Only schedule; idempotent server logic prevents duplicates
                            await fetch('/api/simple-notifications/schedule', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    taskId: id,
                                    userId: user.uid,
                                    userEmail: user.email,
                                    userName: user.displayName || 'User',
                                    taskTitle: updatedTask.text || oldTask.text,
                                    dueDate: updatedTask.dueDate
                                })
                            });
                            console.log('✅ Simple notification update completed');
                            
                            // IMMEDIATELY check for due notifications
                            await fetch('/api/simple-notifications/process', {
                                method: 'POST'
                            });
                            console.log('✅ Immediate notification check completed after update');
                        }
                    }
                } catch (updateError) {
                    console.log('Simple notification update failed (non-critical):', updateError);
                }
            }
        } catch (error) {
            console.error('Error editing task:', error);
        }
    };

    const fetchTasks = async () => {
        if (!user) {
            console.log('No user, cannot fetch tasks');
            return;
        }
        console.log('Manually fetching tasks for user:', user.uid);
        setLoading(true);
        try {
            const userTasks = await fetchUserTasks(user.uid);
            console.log('Manually fetched tasks:', userTasks);
            setTasks(userTasks);
        } catch (error) {
            console.error('Error manually fetching tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    // Subscribe to user tasks when user logs in
    useEffect(() => {
        if (!user || !user.uid) {
            console.log('No user or no user.uid, clearing tasks');
            setTasks([]);
            setLoading(false);
            return;
        }

        // Add a small delay to ensure authentication is fully established
        const timeoutId = setTimeout(() => {
            console.log('Setting up task subscription for user:', user.uid, 'email:', user.email);
            console.log('User object:', user);
            setLoading(true);
        
        const unsubscribe = subscribeToUserTasks(user.uid, (userTasks) => {
            console.log('Received tasks from Firebase:', userTasks);
            
            // Merge Firebase tasks with pending optimistic updates
            setTasks(prevTasks => {
                // If there are pending updates, preserve them
                const hasPendingUpdates = pendingUpdatesRef.current.size > 0;
                
                if (!hasPendingUpdates) {
                    // No pending updates, use Firebase tasks directly
                    setLoading(false);
                    return userTasks;
                }
                
                // Merge Firebase tasks with pending updates
                const mergedTasks = userTasks.map(firebaseTask => {
                    const pendingUpdate = pendingUpdatesRef.current.get(firebaseTask.id);
                    
                    // If there's a pending update for this task, preserve it
                    if (pendingUpdate) {
                        // Only preserve if the update is recent (within 8 seconds)
                        const age = Date.now() - pendingUpdate.timestamp;
                        if (age < 8000) {
                            return {
                                ...firebaseTask,
                                completed: pendingUpdate.completed, // Preserve optimistic update
                            };
                        } else {
                            // Pending update is old, clear it and use Firebase value
                            pendingUpdatesRef.current.delete(firebaseTask.id);
                        }
                    }
                    
                    return firebaseTask;
                });
                
                setLoading(false);
                return mergedTasks;
            });
        }, (error) => {
            console.error('Error in task subscription:', error);
            setLoading(false);
            
            // Fallback: try to fetch tasks manually
            console.log('Attempting manual fetch as fallback...');
            fetchTasks().catch(fetchError => {
                console.error('Manual fetch also failed:', fetchError);
            });
        });

            return () => {
                console.log('Unsubscribing from tasks for user:', user.uid);
                unsubscribe();
            };
        }, 500); // 500ms delay

        return () => {
            clearTimeout(timeoutId);
        };
    }, [user]);

    return (
        <TaskContext.Provider value={{ tasks, loading, addTask, addMultipleTasks, toggleTask, deleteTask, editTask, fetchTasks }}>
            {children}
        </TaskContext.Provider>
    );
}

export function useTasks() {
    const context = useContext(TaskContext);
    if (context === undefined) {
        throw new Error('useTasks must be used within a TaskProvider');
    }
    return context;
}
