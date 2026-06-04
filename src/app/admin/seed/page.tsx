
"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { upsertStaffProfile, addSupplier } from '@/services/mgmt-service';
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
      // Create Admin
      await upsertStaffProfile(targetUid, {
        email: 'admin@chrysalistours.sg',
        name: 'Chrysalis Admin',
        role: 'admin',
        avatarUrl: 'https://picsum.photos/seed/admin/200/200'
      });

      // Seed dummy suppliers for testing Module 3
      await addSupplier({
        name: 'Marina Bay Sands',
        location: 'Singapore',
        contactPerson: 'Reservation Desk',
        email: 'reservations@mbs.com.sg',
        phone: '+65 6688 8888',
        tags: ['hotel', 'luxury'],
        services: [
          { id: 'mbs-deluxe', name: 'Deluxe Room', cost: 550, currency: 'SGD' },
          { id: 'mbs-suite', name: 'Executive Suite', cost: 1200, currency: 'SGD' }
        ]
      });

      await addSupplier({
        name: 'Chrysalis Transport',
        location: 'Singapore',
        contactPerson: 'Ah Huat',
        email: 'transport@chrysalis.sg',
        phone: '+65 9123 4567',
        tags: ['transport', 'coach'],
        services: [
          { id: 'coach-45', name: '45-Seater Luxury Coach', cost: 350, currency: 'SGD' },
          { id: 'van-13', name: '13-Seater Combi Van', cost: 180, currency: 'SGD' }
        ]
      });

      setSuccess(true);
      toast({
        title: "System Initialized",
        description: `Admin profile and demo suppliers created.`,
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
          <CardTitle className="flex items-center gap-2 text-xl font-headline">
            <AlertCircle className="text-orange-500" />
            System Initialization
          </CardTitle>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Create your admin profile and seed initial supplier data for testing Module 3.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-muted rounded-md font-mono text-[10px] break-all border border-muted-foreground/10">
            Target UID: {targetUid}
          </div>
          {success && (
            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 p-3 rounded-md border border-emerald-200">
              <CheckCircle2 size={18} />
              <p className="text-xs font-bold uppercase">Ready for operations!</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          {!success ? (
            <Button className="w-full" onClick={handleSeed} disabled={loading}>
              {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
              Initialize Portal
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
