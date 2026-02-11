import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

function getKey() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET environment variable is required');
    }
    return new TextEncoder().encode(secret);
}

export async function encrypt(payload: any) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h') // Session lasts 24h
        .sign(getKey());
}

export async function decrypt(input: string): Promise<any> {
    const { payload } = await jwtVerify(input, getKey(), {
        algorithms: ['HS256'],
    });
    return payload;
}

export async function login(userData: any) {
    // Create the session
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const session = await encrypt({ user: userData, expires });

    // Save the session in a cookie
    // Note: 'httpOnly' is true by default in Next.js cookies().set() if not specified otherwise in some contexts, 
    // but explicitly setting it is good.
    (await cookies()).set('session', session, { expires, httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
}

export async function logout() {
    // Destroy the session
    (await cookies()).set('session', '', { expires: new Date(0) });
}

export async function getSession() {
    const session = (await cookies()).get('session')?.value;
    if (!session) return null;
    try {
        return await decrypt(session);
    } catch (e) {
        return null;
    }
}

export async function updateSession(request: NextRequest) {
    const session = request.cookies.get('session')?.value;
    if (!session) return;

    // Refresh formatting if needed, but here simple return
    const parsed = await decrypt(session);
    parsed.expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const res = NextResponse.next();
    res.cookies.set({
        name: 'session',
        value: await encrypt(parsed),
        httpOnly: true,
        expires: parsed.expires,
    });
    return res;
}
