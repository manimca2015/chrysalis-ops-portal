
"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { upsertStaffProfile, addSupplier, saveTaskTemplate } from '@/services/mgmt-service';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function SeedAdminPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const targetUid = 'O9vpTjrJXyX8G1dcZ5SwBnfCQ2l1';

  const handleSeed = async () => {
    setLoading(true);
    try {
      // 1. Create the production user record
      await setDoc(doc(db, 'users', targetUid), {
        email: 'admin@chrysalistours.sg',
        name: 'Chrysalis Admin',
        role: 'Admin',
        status: 'Publish',
        createdAt: new Date().toISOString()
      });

      // 2. Create the Internal Staff Profile
      await upsertStaffProfile(targetUid, {
        email: 'admin@chrysalistours.sg',
        name: 'Chrysalis Admin',
        role: 'admin',
        avatarUrl: 'https://picsum.photos/seed/admin/200/200'
      });

      // 3. Seed demo suppliers
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

      // 4. Seed Task Templates
      await saveTaskTemplate({
        title: 'Standard Educational Tour',
        category: 'education',
        tasks: [
          { title: 'School Approval & MOE Documentation', priority: 'high', role: 'Team Lead' },
          { title: 'Student Insurance Verification', priority: 'high', role: 'Staff' },
          { title: 'Risk Assessment (RAMS) Drafting', priority: 'medium', role: 'Staff' },
          { title: 'Dietary Requirements Mapping', priority: 'medium', role: 'Staff' },
          { title: 'Coach Permit & Bus Bay Booking', priority: 'low', role: 'Staff' }
        ]
      });

      await saveTaskTemplate({
        title: 'Corporate Incentive Trip',
        category: 'corporate',
        tasks: [
          { title: 'Dinner Venue Contract Signing', priority: 'high', role: 'Senior Staff' },
          { title: 'Custom Merchandise / Branding Design', priority: 'medium', role: 'Staff' },
          { title: 'Guest List & Flight Monitoring', priority: 'high', role: 'Staff' },
          { title: 'Audio Visual (AV) Requirement Check', priority: 'medium', role: 'Staff' }
        ]
      });

      setSuccess(true);
      toast({
        title: "System Initialized",
        description: `Admin, Suppliers, and Task Templates created.`,
      });
    } catch (error: any) {
      console.error('Seeding error:', error);
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
            This will set up the Admin account, initial suppliers, and standard task templates.
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
