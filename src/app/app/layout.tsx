
"use client"

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Loader2, AlertCircle, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, error, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  // Handle unauthorized staff access
  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full border-destructive/20 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive mb-2">
              <AlertCircle size={24} />
              <CardTitle>Access Restricted</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {error}
            </p>
            <div className="mt-4 p-3 bg-muted rounded text-[10px] font-mono break-all">
              User ID: {user.uid}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full gap-2" onClick={() => signOut()}>
              <LogOut size={16} /> Sign Out
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="mx-auto max-w-7xl space-y-8">
          {children}
        </div>
      </main>
    </div>
  );
}
