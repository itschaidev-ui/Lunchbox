
'use client';

import { ShieldCheck, User, Mail, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function AdminDashboardPage() {
  return (
    <div className="flex-1 flex flex-col p-8 bg-background overflow-y-auto">
      <header className="mb-8">
        <h1 className="text-4xl font-headline font-bold text-foreground flex items-center gap-3">
          <ShieldCheck className="h-10 w-10 text-primary" />
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          User management and application insights.
        </p>
      </header>

       <div className="mt-12 text-center text-muted-foreground">
            <p>User management is currently disabled as authentication is offline for maintenance.</p>
        </div>
    </div>
  );
}
