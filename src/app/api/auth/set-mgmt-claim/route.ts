
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const { auth, db } = getFirebaseAdmin();

    // Verify the token
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Check production users collection
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      console.warn(`Auth Error: User record not found for UID ${uid}`);
      return NextResponse.json({ error: 'User record not found in system database. Please initialize portal at /admin/seed.' }, { status: 403 });
    }

    const userData = userDoc.data();
    const isAdmin = userData?.role === 'Admin';
    const isPublished = userData?.status === 'Publish';

    if (isAdmin && isPublished) {
      // Set the custom claim
      await auth.setCustomUserClaims(uid, { mgmt_role: 'admin' });

      // Create session cookie for middleware
      const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
      const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });

      const cookieStore = await cookies();
      cookieStore.set('__session', sessionCookie, {
        maxAge: expiresIn,
        httpOnly: true,
        secure: true, // Always true for Firebase App Hosting / Production environments
        sameSite: 'lax',
        path: '/',
      });

      return NextResponse.json({ success: true });
    }

    console.warn(`Auth Error: Access denied for UID ${uid}. Role: ${userData?.role}, Status: ${userData?.status}`);
    return NextResponse.json({ error: 'Access denied. Only published Admin accounts can enter.' }, { status: 403 });
  } catch (error: any) {
    console.error('Error setting custom claim:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
