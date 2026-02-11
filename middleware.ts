import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession, decrypt } from '@/lib/auth';

export async function middleware(request: NextRequest) {
    // 1. Update session expiry if exists
    await updateSession(request);

    const sessionCookie = request.cookies.get('session');
    let user = null;
    if (sessionCookie) {
        try {
            const payload = await decrypt(sessionCookie.value);
            user = payload.user;
        } catch (e) { }
    }

    const path = request.nextUrl.pathname;

    // 2. Define protected paths and public paths
    const isPublicPath =
        path === '/login' ||
        path === '/forgot-password' ||
        path.startsWith('/api/') || // Let API handle its own auth or public webhooks
        path.startsWith('/_next') ||
        path.includes('.'); // Static files (images, videos, etc.)

    // 3. Logic
    // If user IS NOT logged in and tries to access private route -> Redirect to Login
    if (!user && !isPublicPath) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // If user IS logged in and tries to access Login page -> Redirect to Home
    if (user && path === '/login') {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
