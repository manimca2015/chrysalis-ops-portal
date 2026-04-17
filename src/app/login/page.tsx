
"use client"

import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, AlertCircle, Database } from 'lucide-react';
import { firebaseConfig } from '@/firebase/config';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [configStatus, setConfigStatus] = useState<'loading' | 'connected' | 'missing'>('loading');
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (firebaseConfig.projectId && firebaseConfig.projectId !== 'mock-project-id') {
      setConfigStatus('connected');
    } else {
      setConfigStatus('missing');
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/app/dashboard');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.message || 'Invalid email or password.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-none shadow-xl">
        <CardHeader className="space-y-1">
          <div className="mb-4 flex flex-col items-center gap-2">
            <span className="text-3xl font-bold text-primary font-headline text-center">Chrysalis Portal</span>
            
            {configStatus === 'connected' ? (
              <Badge variant="outline" className="flex items-center gap-1 text-[10px] py-0 px-2 text-emerald-600 border-emerald-200 bg-emerald-50">
                <ShieldCheck size={10} />
                Connected: {firebaseConfig.projectId}
              </Badge>
            ) : configStatus === 'missing' ? (
              <Badge variant="destructive" className="flex items-center gap-1 text-[10px] py-0 px-2">
                <AlertCircle size={10} />
                Config Missing (.env)
              </Badge>
            ) : null}
          </div>
          <CardTitle className="text-2xl text-center">Staff Login</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access the management dashboard.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="staff@chrysalistours.sg" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
            {configStatus === 'missing' && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 flex items-start gap-2 text-destructive">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <p className="text-xs font-medium">
                  Firebase environment variables are not detected. Please check your .env file and restart the dev server.
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full" type="submit" disabled={loading || configStatus === 'missing'}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Database size={10} />
              <span>Using isolated mgmt_* collections</span>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
