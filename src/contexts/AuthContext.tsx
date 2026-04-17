
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
          const prodUserRef = doc(db, 'users', user.uid);
          const prodUserSnap = await getDoc(prodUserRef);

          if (!prodUserSnap.exists()) {
            setError("Access Restricted: No linked production user account found.");
            setLoading(false);
            return;
          }

          const prodUserData = prodUserSnap.data();
          if (prodUserData.role !== 'Admin' || prodUserData.status !== 'Publish') {
            setError("Access Denied: This portal is restricted to published Administrators.");
            setLoading(false);
            return;
          }

          // Tier 2: Fetch Management Portal Profile
          const profileDoc = await getDoc(doc(db, 'mgmt_staff', user.uid));
          
          if (profileDoc.exists()) {
            const data = profileDoc.data() as StaffProfile;
            setProfile({ id: profileDoc.id, ...data });
            setRole(data.role || 'staff');
            setError(null);
          } else {
            console.warn("User authorized by Production but no staff profile found in mgmt_staff.");
            setProfile(null);
            setRole(null);
            setError("Your production account is valid, but your Management Portal profile has not been initialized. Please contact the System Owner.");
          }
        } catch (err: any) {
          console.error("Error verifying access:", err);
          setError("Verification failed. Please check your internet connection and try again.");
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

  const signOut = () => firebaseSignOut(auth);

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
