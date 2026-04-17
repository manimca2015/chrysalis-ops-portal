"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { upsertStaffProfile } from '@/services/mgmt-service';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function SeedAdminPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const targetUid = 'O9vpTjrJXyX8G1dcZ5SwBnfCQ2l1';

  const handleSeed = async () => {
    setLoading(true);
    try {
      await upsertStaffProfile(targetUid, {
        email: 'admin@chrysalistours.sg',
        name: 'Chrysalis Admin',
        role: 'admin',
        avatarUrl: 'https://picsum.photos/seed/admin/200/200'
      });
      setSuccess(true);
      toast({
        title: "Staff Profile Created",
        description: `User ${targetUid} is now an Admin.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Seeding Failed",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="text-orange-500" />
            System Initialization
          </CardTitle>
          <CardDescription>
            Use this tool to create the initial staff profile for your User ID.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-muted rounded-md font-mono text-xs break-all">
            Target UID: {targetUid}
          </div>
          {success && (
            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 p-3 rounded-md border border-emerald-200">
              <CheckCircle2 size={18} />
              <p className="text-sm font-medium">Profile successfully initialized!</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          {!success ? (
            <Button className="w-full" onClick={handleSeed} disabled={loading}>
              {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
              Create Admin Profile
            </Button>
          ) : (
            <Button className="w-full" asChild>
              <Link href="/login">Go to Login</Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
