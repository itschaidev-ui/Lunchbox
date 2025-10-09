
'use client';

import Link from 'next/link';
import { FileText, Settings, CheckSquare, Sparkles } from 'lucide-react';
import { LeftSidebar } from '@/components/layout/left-sidebar';
import { TaskFeed } from '@/components/dashboard/task-feed';
import { UserNav } from '@/components/layout/user-nav';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const menuItems = [
  {
    href: '/tasks',
    icon: CheckSquare,
    title: 'Tasks',
    description: 'Manage your to-do list.',
  },
  {
    href: '/assistant',
    icon: Sparkles,
    title: 'AI Assistant',
    description: 'Chat with your AI assistant.',
  },
  {
    href: '/docs',
    icon: FileText,
    title: 'Lunchbox Challenge',
    description: 'View event details.',
  },
  {
    href: '/settings',
    icon: Settings,
    title: 'Settings',
    description: 'Customize your experience.',
  },
];

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="flex h-screen bg-background">
      <LeftSidebar 
        tools={[]} 
        storageUsed={0}
        onToolSelect={() => {}}
        onDeleteTool={() => {}}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b flex items-center justify-between px-8">
            <div></div>
            <UserNav />
        </header>
        <div className="flex-1 flex flex-col p-8 overflow-y-auto">
            <header className="mb-8">
              <h1 className="text-4xl font-headline font-bold text-foreground">
                Welcome, {user?.displayName || 'User'}
              </h1>
              <p className="text-muted-foreground mt-2">
                Let's see who can manage their tasks — and their gameplay — like a pro with Lunchbox AI!
              </p>
            </header>

            <div className="mb-8">
              <TaskFeed />
            </div>

            <div className="mb-8">
              <h2 className="text-lg font-headline font-semibold text-muted-foreground mb-4">
                Get Started
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {menuItems.map((item) => (
                  <Link href={item.href} key={item.title}>
                    <div className="block p-6 bg-card border border-border rounded-lg hover:bg-card/80 transition-colors h-full">
                      <div className="flex items-center gap-4 mb-2">
                        <item.icon className="h-6 w-6 text-primary" />
                        <h3 className="text-lg font-headline font-semibold text-foreground">
                          {item.title}
                        </h3>
                      </div>
                      <p className="text-muted-foreground">{item.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
        </div>
      </div>
    </main>
  );
}
