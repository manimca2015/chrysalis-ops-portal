
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

  useEffect(() => {
    async function fetchProfile() {
      if (user) {
        try {
          const idTokenResult = await user.getIdTokenResult();
          const mgmtRole = idTokenResult.claims.mgmt_role as MgmtRole;
          setRole(mgmtRole || 'staff');

          const profileDoc = await getDoc(doc(db, 'mgmt_staff', user.uid));
          if (profileDoc.exists()) {
            setProfile({ id: profileDoc.id, ...profileDoc.data() } as StaffProfile);
          }
        } catch (error) {
          console.error("Error fetching staff profile:", error);
        }
      } else {
        setProfile(null);
        setRole(null);
      }
      setLoading(false);
    }

    if (!authLoading) {
      fetchProfile();
    }
  }, [user, authLoading, db]);

  const signOut = () => firebaseSignOut(auth);

  return (
    <AuthContext.Provider value={{ user, profile, loading: loading || authLoading, role, signOut }}>
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
