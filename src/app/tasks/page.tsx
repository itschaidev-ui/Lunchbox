
'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { TaskHeader } from '@/components/layout/task-header';
import { TaskForm } from '@/components/task-form';
import { TaskItem } from '@/components/task-item';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, List, Search, ArrowLeft } from 'lucide-react';
import { useTasks } from '@/context/task-context';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaskCalendar } from '@/components/calendar/task-calendar';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function TasksPage() {
  const { tasks, toggleTask, deleteTask } = useTasks();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('recent');
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredTasks = tasks
    .filter(task => {
      if (filter === 'all') return true;
      if (filter === 'active') return !task.completed;
      if (filter === 'completed') return task.completed;
      if (filter === 'overdue') return task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;
      return true;
    })
    .filter(task => task.text.toLowerCase().includes(searchTerm.toLowerCase()));

  const sortedTasks = filteredTasks.sort((a, b) => {
    if (sort === 'recent') {
      return (b.dueDate ? new Date(b.dueDate).getTime() : 0) - (a.dueDate ? new Date(a.dueDate).getTime() : 0);
    }
    if (sort === 'oldest') {
      return (a.dueDate ? new Date(a.dueDate).getTime() : 0) - (b.dueDate ? new Date(b.dueDate).getTime() : 0);
    }
    return 0;
  });

  const stats = {
    total: tasks.length,
    done: tasks.filter(t => t.completed).length,
    overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && !t.completed).length,
  };
  
  const listView = (
      <>
        <div className="mt-4">
            <div className="flex items-center justify-between mb-6 shrink-0">
                <div className="bg-card p-1 rounded-lg border flex items-center gap-4">
                  <div className="relative shrink-0">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input 
                          placeholder="Search tasks..." 
                          className="pl-10 w-full"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                      />
                  </div>
                   <Select value={filter} onValueChange={setFilter}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Filter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={sort} onValueChange={setSort}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Sort" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recent">Recent</SelectItem>
                        <SelectItem value="oldest">Oldest</SelectItem>
                      </SelectContent>
                    </Select>
                </div>
            </div>
            {sortedTasks.length > 0 ? (
                <div className="flex flex-col">
                    <div className="bg-card p-4 rounded-t-lg border-x border-t flex items-center justify-between shrink-0">
                        <h2 className="font-semibold">All Tasks</h2>
                        <div className="text-sm text-muted-foreground">
                            {sortedTasks.length} of {tasks.length} tasks
                        </div>
                    </div>
                    <ScrollArea className="bg-card rounded-b-lg border-x border-b">
                        <div className="space-y-2 p-4">
                            {sortedTasks.map(task => (
                            <TaskItem
                                key={task.id}
                                task={task}
                                onToggle={toggleTask}
                                onDelete={deleteTask}
                            />
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            ) : (
                <div className="bg-card p-4 rounded-lg border">
                    <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
                        <p className="text-muted-foreground">No tasks match your criteria.</p>
                    </div>
                </div>
            )}
          </div>
      </>
  );

  const mainContent = (
    <div className="flex flex-col min-w-0 flex-1 h-full">
        <TaskHeader 
          stats={stats} 
          onNewTask={() => setIsFormOpen(true)}
          onToggleAssistant={() => {}}
        />
        <div className="flex-1 flex flex-col p-6 md:p-8 overflow-hidden">
          <AnimatePresence>
            {isFormOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <TaskForm onCancel={() => setIsFormOpen(false)} />
              </motion.div>
            )}
          </AnimatePresence>
          <Tabs defaultValue="list" className="flex-1 flex flex-col min-h-0">
            <div className="flex justify-between items-center">
              <TabsList>
                <TabsTrigger value="list">
                  <List className="h-4 w-4 mr-2" />
                  List
                </TabsTrigger>
                <TabsTrigger value="calendar">
                  <Calendar className="h-4 w-4 mr-2" />
                  Calendar
                </TabsTrigger>
              </TabsList>
              <Button asChild variant="outline" size="sm">
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Link>
              </Button>
            </div>
            <TabsContent value="list" className="flex-1 flex flex-col min-h-0">
                {listView}
            </TabsContent>
            <TabsContent value="calendar" className="flex-1 flex flex-col items-center justify-center p-4">
              <TaskCalendar tasks={tasks} toggleTask={toggleTask} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
  );

  return (
    <div className="flex h-screen bg-background">
      <div className="md:hidden flex flex-col w-full h-screen">
        <Header />
        <div className="flex-1 min-h-0">
          {mainContent}
        </div>
      </div>
      <main className="flex-1 overflow-hidden hidden md:flex">
       {mainContent}
      </main>
    </div>
  );
}
