
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

export function initializeFirebase(): {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
} {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

  let auth: Auth;
  try {
    auth = getAuth(app);
  } catch {
    // getAuth() validates the API key format synchronously and throws if it's
    // missing/malformed. This function runs during Next.js server prerendering
    // (FirebaseClientProvider wraps the root layout), where no real Auth calls
    // ever happen, so a bad key here must not crash the build.
    auth = null as unknown as Auth;
  }

  const db = getFirestore(app);

  return { app, auth, db };
}

export * from './provider';
export * from './auth/use-user';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
