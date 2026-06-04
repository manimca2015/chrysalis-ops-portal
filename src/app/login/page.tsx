
"use client"

import { useState } from 'react';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Database, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Client-side sign in
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // 2. Get ID token
      const idToken = await user.getIdToken();

      // 3. Request custom claim & set session cookie
      const response = await fetch('/api/auth/set-mgmt-claim', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        await signOut(auth); // Sign out if claims/permissions fail
        throw new Error(data.error || 'Access denied. Please ensure system is initialized.');
      }

      // 4. Success - use hard redirect to ensure cookie is sent in next request
      toast({
        title: "Authenticated",
        description: "Redirecting to Chrysalis Ops Portal...",
      });
      
      // Force a full reload to the dashboard
      window.location.href = '/app/dashboard';
    } catch (error: any) {
      console.error('Login Error:', error);
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
      <div className="w-full max-w-md space-y-4">
        <Card className="border-none shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <div className="mb-4 flex flex-col items-center gap-2">
              <span className="text-3xl font-bold text-primary font-headline">Chrysalis Portal</span>
            </div>
            <CardTitle className="text-2xl">Staff Login</CardTitle>
            <CardDescription>
              Access strictly for Admin accounts with published status.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="admin@chrysalistours.sg" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
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
                  disabled={loading}
                  required 
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button className="w-full" type="submit" disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Authenticating...</> : "Sign In"}
              </Button>
              <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                <Database size={10} />
                <span>Isolated Management Portal</span>
              </div>
            </CardFooter>
          </form>
        </Card>
        
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="text-orange-500 mt-0.5 shrink-0" size={16} />
            <div className="space-y-1">
              <p className="text-xs font-bold text-orange-800">First time here?</p>
              <p className="text-[10px] text-orange-700 leading-relaxed">
                If you cannot log in, the system may not be initialized. Please visit the 
                <Link href="/admin/seed" className="font-bold underline ml-1">Setup Page</Link> to create the default Admin records.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
