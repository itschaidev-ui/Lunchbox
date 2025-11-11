'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Activity, 
  TrendingUp,
  Eye,
  Shield,
  ArrowLeft,
  Trash2
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { useTasks } from '@/context/task-context';
import { encodeBackwards, decodeBackwards } from '@/lib/clarity';
import { getAllTasks } from '@/lib/firebase-tasks';
import { getAllUsers } from '@/lib/firebase-users';
import { doc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface UserActivity {
  id: string;
  email: string;
  encodedEmail: string;
  lastActive: Date;
  sessionDuration: number; // in minutes
  tasksCreated: number;
  tasksCompleted: number;
  totalTasks: number;
  completionRate: number;
  isOnline: boolean;
  tasks: Array<{
    id: string;
    text: string;
    completed: boolean;
    dueDate?: string;
    description?: string;
  }>;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { tasks } = useTasks();
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  // Check if user is admin - only these emails have access
  const isAdmin = user?.email === 'itschaidev@gmail.com' || user?.email === 'lunchboxai.official@gmail.com';

  useEffect(() => {
    if (!isAdmin) return;

    const loadUserActivities = async (showLoading = true) => {
      if (showLoading) {
        setIsLoading(true);
      }
      
      try {
        // Get all users and all tasks from Firebase
        const [allUsers, allTasks] = await Promise.all([
          getAllUsers(),
          getAllTasks()
        ]);
        
        console.log('All users from Firebase:', allUsers);
        console.log('All tasks from Firebase:', allTasks);
        console.log('Number of users found:', allUsers.length);
        console.log('Number of tasks found:', allTasks.length);
        
        // Group tasks by user
        const userTaskMap = new Map<string, typeof allTasks>();
        allTasks.forEach(task => {
          if (!userTaskMap.has(task.userId)) {
            userTaskMap.set(task.userId, []);
          }
          userTaskMap.get(task.userId)!.push(task);
        });

        console.log('User task map:', userTaskMap);

        // Create user activities from all users (deduplicate by uid)
        const activities: UserActivity[] = [];
        const seenUids = new Set<string>();
        
        for (const firebaseUser of allUsers) {
          // Skip duplicates
          if (seenUids.has(firebaseUser.uid)) {
            console.log(`Skipping duplicate user: ${firebaseUser.uid}`);
            continue;
          }
          seenUids.add(firebaseUser.uid);
          
          const userTasks = userTaskMap.get(firebaseUser.uid) || [];
          const completedTasks = userTasks.filter(t => t.completed).length;
          
          // Get display name - for Discord users, extract username from email
          let displayEmail = firebaseUser.email;
          if (firebaseUser.displayName) {
            displayEmail = firebaseUser.displayName;
          } else if (firebaseUser.email.includes('@discord.local')) {
            // Extract Discord username from the email format: ID_timestamp@discord.local
            const discordId = firebaseUser.email.split('_')[0];
            displayEmail = `Discord User ${discordId}`;
          }
          
          // Check if user is actually online based on heartbeat (within last 60 seconds)
          const isOnline = firebaseUser.isOnline && firebaseUser.lastHeartbeat 
            ? (new Date().getTime() - new Date(firebaseUser.lastHeartbeat).getTime()) < 60000
            : false;
          
          // Calculate session duration based on last heartbeat
          const sessionDuration = firebaseUser.lastHeartbeat && firebaseUser.lastActive
            ? Math.floor((new Date(firebaseUser.lastHeartbeat).getTime() - new Date(firebaseUser.lastActive).getTime()) / 60000)
            : 0;
          
          activities.push({
            id: firebaseUser.uid,
            email: displayEmail,
            encodedEmail: encodeBackwards(firebaseUser.email),
            lastActive: firebaseUser.lastActive ? new Date(firebaseUser.lastActive) : new Date(),
            sessionDuration: Math.max(0, sessionDuration),
            tasksCreated: userTasks.length,
            tasksCompleted: completedTasks,
            totalTasks: userTasks.length,
            completionRate: userTasks.length > 0 ? (completedTasks / userTasks.length) * 100 : 0,
            isOnline: isOnline,
            tasks: userTasks.map(t => ({
              id: t.id,
              text: t.text,
              completed: t.completed,
              dueDate: t.dueDate,
              description: t.description
            }))
          });
        }

        console.log('Activities created:', activities);
        setUserActivities(activities);
      } catch (error) {
        console.error('Error loading user activities:', error);
        
        // Fallback: show current user even if there's an error
        if (user) {
          setUserActivities([{
            id: user.uid,
            email: user.email || 'unknown@example.com',
            encodedEmail: encodeBackwards(user.email || 'unknown@example.com'),
            lastActive: new Date(),
            sessionDuration: 0,
            tasksCreated: 0,
            tasksCompleted: 0,
            totalTasks: 0,
            completionRate: 0,
            isOnline: true,
            tasks: []
          }]);
        } else {
          setUserActivities([]);
        }
      } finally {
        if (showLoading) {
          setIsLoading(false);
        }
      }
    };

    // Initial load
    loadUserActivities(true);
    
    // Refresh every 10 seconds to update online status
    const refreshInterval = setInterval(() => {
      loadUserActivities(false);
    }, 10000);

    return () => clearInterval(refreshInterval);
  }, [isAdmin, user, tasks]);

  const handleDeleteUsers = async () => {
    if (selectedUsers.size === 0) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedUsers.size} user(s)? This will also delete all their tasks and cannot be undone.`
    );
    
    if (!confirmed) return;
    
    setIsDeleting(true);
    
    try {
      for (const userId of selectedUsers) {
        // Delete user document
        await deleteDoc(doc(db, 'users', userId));
        
        // Delete all tasks for this user
        const tasksQuery = query(
          collection(db, 'tasks'),
          where('userId', '==', userId)
        );
        const tasksSnapshot = await getDocs(tasksQuery);
        
        for (const taskDoc of tasksSnapshot.docs) {
          await deleteDoc(doc(db, 'tasks', taskDoc.id));
        }
        
        console.log(`Deleted user ${userId} and their tasks`);
      }
      
      // Reload user activities
      setUserActivities(prev => prev.filter(u => !selectedUsers.has(u.id)));
      setSelectedUsers(new Set());
      
      alert(`Successfully deleted ${selectedUsers.size} user(s) and their tasks.`);
    } catch (error) {
      console.error('Error deleting users:', error);
      alert('Failed to delete some users. Check console for details.');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
    }
  };

  const filteredUsers = userActivities.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.encodedEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalUsers = userActivities.length;
  const onlineUsers = userActivities.filter(u => u.isOnline).length;
  const totalTasksCreated = userActivities.reduce((sum, u) => sum + u.tasksCreated, 0);
  const totalTasksCompleted = userActivities.reduce((sum, u) => sum + u.tasksCompleted, 0);
  const averageCompletionRate = userActivities.length > 0 
    ? userActivities.reduce((sum, u) => sum + u.completionRate, 0) / userActivities.length 
    : 0;

  if (!isAdmin) {
    return (
      <div className="flex h-screen bg-background">
        <div className="flex-1 flex items-center justify-center">
          <Card className="w-96">
            <CardHeader className="text-center">
              <Shield className="h-12 w-12 mx-auto mb-4 text-destructive" />
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>
                You don't have permission to access the admin dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button asChild>
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      <div className="flex flex-col">
        {/* Header */}
        <header className="p-4 md:p-6 border-b border-gray-800 shrink-0 flex items-center justify-between sticky top-0 bg-gray-950/80 backdrop-blur-lg z-10">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Admin Dashboard
                </h1>
                <p className="text-xs md:text-sm text-gray-400">User Activity & Analytics</p>
              </div>
            </div>
          </div>
          <Button asChild variant="outline" size="sm" className="ml-2 shrink-0 border-gray-700 hover:bg-gray-800">
            <Link href="/">
              <ArrowLeft className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Back</span>
            </Link>
          </Button>
        </header>

        {/* Stats Overview */}
        <div className="p-4 md:p-6 border-b border-gray-800">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
            <Card className="bg-gray-800/50 border-gray-700 hover:border-purple-500/50 transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs md:text-sm font-medium text-gray-300">Total Users</CardTitle>
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Users className="h-4 w-4 text-blue-400" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl md:text-3xl font-bold text-white">{totalUsers}</div>
                <p className="text-xs text-gray-400 mt-1">
                  <span className="text-green-400">{onlineUsers}</span> online now
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700 hover:border-purple-500/50 transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs md:text-sm font-medium text-gray-300">Tasks Created</CardTitle>
                <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Activity className="h-4 w-4 text-purple-400" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl md:text-3xl font-bold text-white">{totalTasksCreated}</div>
                <p className="text-xs text-gray-400 mt-1">
                  All time
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700 hover:border-purple-500/50 transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs md:text-sm font-medium text-gray-300">Completed</CardTitle>
                <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl md:text-3xl font-bold text-white">{totalTasksCompleted}</div>
                <p className="text-xs text-gray-400 mt-1">
                  <span className="text-green-400">{totalTasksCreated > 0 ? ((totalTasksCompleted / totalTasksCreated) * 100).toFixed(1) : 0}%</span> rate
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700 hover:border-purple-500/50 transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs md:text-sm font-medium text-gray-300">Pending</CardTitle>
                <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
                  <XCircle className="h-4 w-4 text-orange-400" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl md:text-3xl font-bold text-white">{totalTasksCreated - totalTasksCompleted}</div>
                <p className="text-xs text-gray-400 mt-1">
                  Not completed
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700 hover:border-purple-500/50 transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs md:text-sm font-medium text-gray-300">Avg. Rate</CardTitle>
                <div className="w-8 h-8 bg-pink-500/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-pink-400" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl md:text-3xl font-bold text-white">{averageCompletionRate.toFixed(1)}%</div>
                <p className="text-xs text-gray-400 mt-1">
                  Per user
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-3 md:p-6">
          <Tabs defaultValue="users" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-10">
              <TabsTrigger value="users" className="text-xs md:text-sm">Users</TabsTrigger>
              <TabsTrigger value="tasks" className="text-xs md:text-sm">Tasks</TabsTrigger>
              <TabsTrigger value="analytics" className="text-xs md:text-sm">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="mt-4 md:mt-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4 md:mb-6">
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:max-w-sm text-sm bg-gray-800 border-gray-700 text-white"
                />
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="border-gray-700 text-gray-300">
                    {filteredUsers.length} users
                  </Badge>
                  {selectedUsers.size > 0 && (
                    <>
                      <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/50">
                        {selectedUsers.size} selected
                      </Badge>
                      <Button
                        onClick={handleDeleteUsers}
                        disabled={isDeleting}
                        size="sm"
                        variant="destructive"
                        className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {isDeleting ? 'Deleting...' : 'Delete Selected'}
                      </Button>
                    </>
                  )}
                  <Button
                    onClick={toggleSelectAll}
                    size="sm"
                    variant="outline"
                    className="border-gray-700 hover:bg-gray-800 text-gray-300"
                  >
                    {selectedUsers.size === filteredUsers.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
              </div>

              <div className="space-y-3 md:space-y-4 max-h-[60vh] md:max-h-[70vh] overflow-y-auto pr-1 md:pr-2">
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading user data...</p>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No users found</p>
                  </div>
                ) : (
                  filteredUsers.map((userActivity) => (
                    <Card 
                      key={userActivity.id} 
                      className={`hover:shadow-md transition-all bg-gray-800/50 border-gray-700 ${
                        selectedUsers.has(userActivity.id) ? 'ring-2 ring-purple-500' : ''
                      }`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={selectedUsers.has(userActivity.id)}
                            onChange={() => toggleUserSelection(userActivity.id)}
                            className="mt-1 h-5 w-5 rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-purple-500 cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-sm md:text-lg truncate text-white">
                                  {userActivity.email}
                                </CardTitle>
                                <CardDescription className="text-xs truncate text-gray-400">
                                  Encoded: {userActivity.encodedEmail}
                                </CardDescription>
                              </div>
                              <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                                <Badge variant={userActivity.isOnline ? "default" : "secondary"} className="text-xs bg-green-500/20 text-green-300 border-green-500/50">
                                  {userActivity.isOnline ? "Online" : "Offline"}
                                </Badge>
                                <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                                  {userActivity.completionRate.toFixed(1)}%
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3 md:h-4 md:w-4 text-blue-400" />
                            <div>
                              <p className="text-xs md:text-sm font-medium text-white">{userActivity.sessionDuration}min</p>
                              <p className="text-xs text-gray-400">Session</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Activity className="h-3 w-3 md:h-4 md:w-4 text-purple-400" />
                            <div>
                              <p className="text-xs md:text-sm font-medium text-white">{userActivity.tasksCreated}</p>
                              <p className="text-xs text-gray-400">Created</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 md:h-4 md:w-4 text-green-400" />
                            <div>
                              <p className="text-xs md:text-sm font-medium text-white">{userActivity.tasksCompleted}</p>
                              <p className="text-xs text-gray-400">Completed</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Eye className="h-3 w-3 md:h-4 md:w-4 text-pink-400" />
                            <div>
                              <p className="text-xs md:text-sm font-medium text-white">
                                {new Date(userActivity.lastActive).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-gray-400">Last active</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="tasks" className="mt-4 md:mt-6">
              <div className="space-y-3 md:space-y-4 max-h-[60vh] md:max-h-[70vh] overflow-y-auto pr-1 md:pr-2">
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading tasks...</p>
                  </div>
                ) : (
                  userActivities.map((userActivity) => (
                    <Card key={userActivity.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <CardTitle className="text-sm md:text-lg">
                              {userActivity.email}
                            </CardTitle>
                            <CardDescription className="text-xs">
                              {userActivity.tasks.length} tasks
                            </CardDescription>
                          </div>
                          <Badge variant={userActivity.isOnline ? "default" : "secondary"} className="text-xs self-start sm:self-auto">
                            {userActivity.isOnline ? "Online" : "Offline"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {userActivity.tasks.length === 0 ? (
                          <p className="text-muted-foreground text-center py-4 text-sm">No tasks</p>
                        ) : (
                          <div className="space-y-2">
                            {userActivity.tasks.map((task) => (
                              <div
                                key={task.id}
                                className={`flex flex-col sm:flex-row sm:items-center justify-between p-2 md:p-3 rounded-lg border gap-2 ${
                                  task.completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                                }`}
                              >
                                <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                                  <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full flex-shrink-0 ${
                                    task.completed ? 'bg-green-500' : 'bg-gray-300'
                                  }`} />
                                  <div className="min-w-0 flex-1">
                                    <p className={`text-xs md:text-sm font-medium truncate ${
                                      task.completed ? 'line-through text-gray-500' : 'text-gray-900'
                                    }`}>
                                      {task.text}
                                    </p>
                                    {task.description && (
                                      <p className="text-xs text-gray-500 mt-1 truncate">{task.description}</p>
                                    )}
                                    {task.dueDate && (
                                      <p className="text-xs text-blue-500 mt-1">
                                        Due: {new Date(task.dueDate).toLocaleDateString()}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <Badge variant={task.completed ? "default" : "secondary"} className="text-xs self-start sm:self-auto">
                                  {task.completed ? "Done" : "Pending"}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="mt-4 md:mt-6">
              <div className="text-center py-8 md:py-12">
                <TrendingUp className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-4 md:mb-6 text-muted-foreground" />
                <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Analytics Dashboard</h3>
                <p className="text-sm md:text-base text-muted-foreground max-w-md mx-auto px-4">
                  Detailed analytics and insights will be available here. This will include user behavior patterns, 
                  task completion trends, and performance metrics.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
