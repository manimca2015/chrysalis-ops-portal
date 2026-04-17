
"use client"

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { MgmtRole, StaffProfile } from '@/types';
import { useAuth as useFirebaseAuth, useFirestore, useUser } from '@/firebase';

interface AuthContextType {
  user: User | null;
  profile: StaffProfile | null;
  loading: boolean;
  role: MgmtRole | null;
  error: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useUser();
  const auth = useFirebaseAuth();
  const db = useFirestore();
  
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<MgmtRole | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      if (user) {
        try {
          // Tier 1: Strict Production User Check
          // This requires 'read' permission on the 'users' collection for the auth user.
          let prodUserData;
          try {
            const prodUserRef = doc(db, 'users', user.uid);
            const prodUserSnap = await getDoc(prodUserRef);

            if (!prodUserSnap.exists()) {
              setError("Access Restricted: No linked production user account found in the 'users' collection.");
              setLoading(false);
              return;
            }
            prodUserData = prodUserSnap.data();
          } catch (e: any) {
            if (e.code === 'permission-denied') {
              setError("Permission Denied: Your Firestore rules block reading from the 'users' collection. Please update your rules to allow users to read their own document.");
            } else {
              setError(`System Error: ${e.message}`);
            }
            setLoading(false);
            return;
          }

          if (prodUserData.role !== 'Admin' || prodUserData.status !== 'Publish') {
            setError(`Access Denied: You are logged in as "${prodUserData.role}" with status "${prodUserData.status}". This portal is restricted to published Administrators.`);
            setLoading(false);
            return;
          }

          // Tier 2: Fetch Management Portal Profile
          // This requires 'read' permission on the 'mgmt_staff' collection.
          try {
            const profileDoc = await getDoc(doc(db, 'mgmt_staff', user.uid));
            
            if (profileDoc.exists()) {
              const data = profileDoc.data() as StaffProfile;
              setProfile({ id: profileDoc.id, ...data });
              setRole(data.role || 'staff');
              setError(null);
            } else {
              setProfile(null);
              setRole(null);
              setError("Authorized by Production, but your 'mgmt_staff' profile is missing. Please use the /admin/seed utility to initialize your profile.");
            }
          } catch (e: any) {
            if (e.code === 'permission-denied') {
              setError("Permission Denied: Your Firestore rules block reading from 'mgmt_staff'. Ensure the 'mgmt_*' collections have appropriate read/write rules.");
            } else {
              setError(`Profile Fetch Error: ${e.message}`);
            }
          }
        } catch (err: any) {
          console.error("General Auth Error:", err);
          setError("Verification failed due to a system error. Check console for details.");
        }
      } else {
        setProfile(null);
        setRole(null);
        setError(null);
      }
      setLoading(false);
    }

    if (!authLoading) {
      setLoading(true);
      fetchProfile();
    }
  }, [user, authLoading, db]);

  const signOut = async () => {
    setError(null);
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading: loading || authLoading, role, error, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
