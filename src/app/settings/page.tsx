
'use client';

import { Header } from '@/components/layout/header';

export default function SettingsPage() {
  
  const settingsContent = (
    <div className="flex flex-col bg-background h-full p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-headline font-bold text-foreground">
          Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Customize your experience.
        </p>
      </header>
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
       <div className="md:hidden flex flex-col w-full h-screen">
        <Header />
        <div className="flex-1 min-h-0">
          {settingsContent}
        </div>
      </div>
       <main className="flex-1 overflow-hidden hidden md:flex">
          {settingsContent}
       </main>
    </div>
  );
}
