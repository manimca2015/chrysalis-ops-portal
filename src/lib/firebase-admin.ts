
import * as admin from 'firebase-admin';

export function getFirebaseAdmin() {
  if (!admin.apps.length) {
    let credential;

    // Check if the user provided a full JSON service account key string
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        // Ensure private key handles newlines correctly if provided in a single line
        if (serviceAccount.private_key) {
          serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
        }
        credential = admin.credential.cert(serviceAccount);
      } catch (e) {
        console.error('Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:', e);
      }
    }

    // Fallback to individual environment variables if no full JSON provided
    if (!credential) {
      const config = {
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      };

      if (config.projectId && config.clientEmail && config.privateKey) {
        credential = admin.credential.cert(config as any);
      }
    }

    if (credential) {
      admin.initializeApp({
        credential,
      });
    } else {
      throw new Error('Firebase Admin credentials not found. Please set FIREBASE_SERVICE_ACCOUNT_KEY or individual env vars.');
    }
  }

  return {
    auth: admin.auth(),
    db: admin.firestore(),
  };
}
