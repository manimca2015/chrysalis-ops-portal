
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
      return NextResponse.json({ error: 'User record not found' }, { status: 403 });
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
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Access denied. Admin accounts only.' }, { status: 403 });
  } catch (error: any) {
    console.error('Error setting custom claim:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
