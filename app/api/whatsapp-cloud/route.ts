import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    const session = await getSession();
    if (!session?.user?.organizationId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = session.user.organizationId;
    const action = req.nextUrl.searchParams.get('action');

    if (action === 'accounts') {
        const accounts = await prisma.whatsAppCloudAccount.findMany({
            where: { organizationId: orgId },
            orderBy: { createdAt: 'asc' },
            select: {
                id: true,
                displayName: true,
                phoneNumberId: true,
                wabaId: true,
                apiVersion: true,
                phone: true,
                active: true,
                verifyToken: true,
                createdAt: true,
                // Never expose accessToken / appSecret in list
            }
        });
        return NextResponse.json({ accounts });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

export async function POST(req: NextRequest) {
    const session = await getSession();
    if (!session?.user?.organizationId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = session.user.organizationId;

    let body: Record<string, string>;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { action } = body;

    if (action === 'create') {
        const { displayName, phoneNumberId, accessToken, wabaId, appSecret, verifyToken, apiVersion } = body;
        if (!displayName?.trim() || !phoneNumberId?.trim() || !accessToken?.trim() || !wabaId?.trim() || !appSecret?.trim() || !verifyToken?.trim()) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const account = await prisma.whatsAppCloudAccount.create({
            data: {
                organizationId: orgId,
                displayName: displayName.trim(),
                phoneNumberId: phoneNumberId.trim(),
                accessToken: accessToken.trim(),
                wabaId: wabaId.trim(),
                appSecret: appSecret.trim(),
                verifyToken: verifyToken.trim(),
                apiVersion: apiVersion?.trim() || 'v21.0',
            }
        });

        return NextResponse.json({
            success: true,
            account: {
                id: account.id,
                displayName: account.displayName,
                phoneNumberId: account.phoneNumberId,
                wabaId: account.wabaId,
                apiVersion: account.apiVersion,
                phone: account.phone,
                active: account.active,
                verifyToken: account.verifyToken,
                createdAt: account.createdAt,
            }
        });
    }

    if (action === 'delete') {
        const { accountId } = body;
        if (!accountId) return NextResponse.json({ error: 'accountId required' }, { status: 400 });

        const account = await prisma.whatsAppCloudAccount.findFirst({
            where: { id: accountId, organizationId: orgId }
        });
        if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 });

        await prisma.whatsAppCloudAccount.delete({ where: { id: accountId } });
        return NextResponse.json({ success: true });
    }

    if (action === 'test') {
        const { accountId } = body;
        if (!accountId) return NextResponse.json({ error: 'accountId required' }, { status: 400 });

        const account = await prisma.whatsAppCloudAccount.findFirst({
            where: { id: accountId, organizationId: orgId }
        });
        if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 });

        try {
            const url = `https://graph.facebook.com/${account.apiVersion}/${account.phoneNumberId}?fields=display_phone_number,verified_name`;
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${account.accessToken}` }
            });
            const data = await res.json();

            if (!res.ok) {
                return NextResponse.json({ success: false, error: data.error?.message ?? 'API error' });
            }

            const displayPhone = data.display_phone_number as string | undefined;

            // Save the phone number if not already set
            if (displayPhone && !account.phone) {
                await prisma.whatsAppCloudAccount.update({
                    where: { id: accountId },
                    data: { phone: displayPhone }
                });
            }

            return NextResponse.json({
                success: true,
                displayPhone: displayPhone ?? null,
                verifiedName: data.verified_name ?? null,
            });
        } catch (err) {
            return NextResponse.json({ success: false, error: String(err) });
        }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
