
"use client"

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
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
          const profileDoc = await getDoc(doc(db, 'mgmt_staff', user.uid));
          
          if (profileDoc.exists()) {
            const data = profileDoc.data() as StaffProfile;
            setProfile({ id: profileDoc.id, ...data });
            setRole(data.role || 'staff');
            setError(null);
          } else {
            // Profile missing in mgmt_staff
            console.warn("User authenticated but no staff profile found in mgmt_staff.");
            setProfile(null);
            setRole(null);
            setError("Your account is not registered as a Portal Staff member. Please contact an Administrator.");
          }
        } catch (err: any) {
          console.error("Error fetching staff profile:", err);
          setError("Failed to verify your staff access. Please check your connection.");
        }
      } else {
        setProfile(null);
        setRole(null);
        setError(null);
      }
      setLoading(false);
    }

    if (!authLoading) {
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
