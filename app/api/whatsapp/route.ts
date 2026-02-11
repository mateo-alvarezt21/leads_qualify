import { getSession } from '@/lib/auth';
import { connectToWhatsApp, getQR, getStatus, logout, deleteInstance } from '@/lib/whatsapp';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const session = await getSession();
    if (!session?.user?.organizationId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = session.user.organizationId;
    const action = req.nextUrl.searchParams.get('action');

    if (action === 'instances') {
        const instances = await prisma.whatsAppInstance.findMany({
            where: { organizationId: orgId },
            orderBy: { createdAt: 'asc' },
        });

        // Enrich with live status
        const enriched = await Promise.all(instances.map(async (inst) => {
            const liveStatus = await getStatus(inst.id);
            return {
                ...inst,
                liveStatus: liveStatus.status,
                account: liveStatus.status === 'connected' ? liveStatus.account : null,
                qr: liveStatus.status === 'scanning' ? (liveStatus as any).qr : null,
            };
        }));

        return NextResponse.json({ instances: enriched });
    }

    if (action === 'status') {
        const instanceId = req.nextUrl.searchParams.get('instanceId');
        if (!instanceId) {
            return NextResponse.json({ error: 'instanceId required' }, { status: 400 });
        }

        // Verify instance belongs to org
        const instance = await prisma.whatsAppInstance.findFirst({
            where: { id: instanceId, organizationId: orgId }
        });
        if (!instance) {
            return NextResponse.json({ error: 'Instance not found' }, { status: 404 });
        }

        const status = await getStatus(instanceId);
        return NextResponse.json(status);
    }

    if (action === 'qr') {
        const instanceId = req.nextUrl.searchParams.get('instanceId');
        if (!instanceId) {
            return NextResponse.json({ error: 'instanceId required' }, { status: 400 });
        }

        const instance = await prisma.whatsAppInstance.findFirst({
            where: { id: instanceId, organizationId: orgId }
        });
        if (!instance) {
            return NextResponse.json({ error: 'Instance not found' }, { status: 404 });
        }

        const qr = await getQR(instanceId);
        return NextResponse.json({ qr });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

export async function POST(req: NextRequest) {
    const session = await getSession();
    if (!session?.user?.organizationId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = session.user.organizationId;

    let body: { action?: string; instanceId?: string; name?: string };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { action } = body;

    if (action === 'create') {
        const name = body.name?.trim();
        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const instance = await prisma.whatsAppInstance.create({
            data: {
                organizationId: orgId,
                name,
            }
        });

        return NextResponse.json({ success: true, instance });
    }

    if (action === 'connect') {
        const { instanceId } = body;
        if (!instanceId) {
            return NextResponse.json({ error: 'instanceId required' }, { status: 400 });
        }

        const instance = await prisma.whatsAppInstance.findFirst({
            where: { id: instanceId, organizationId: orgId }
        });
        if (!instance) {
            return NextResponse.json({ error: 'Instance not found' }, { status: 404 });
        }

        connectToWhatsApp(instanceId);
        return NextResponse.json({ success: true, message: 'Connection started' });
    }

    if (action === 'logout') {
        const { instanceId } = body;
        if (!instanceId) {
            return NextResponse.json({ error: 'instanceId required' }, { status: 400 });
        }

        const instance = await prisma.whatsAppInstance.findFirst({
            where: { id: instanceId, organizationId: orgId }
        });
        if (!instance) {
            return NextResponse.json({ error: 'Instance not found' }, { status: 404 });
        }

        await logout(instanceId);
        return NextResponse.json({ success: true });
    }

    if (action === 'delete') {
        const { instanceId } = body;
        if (!instanceId) {
            return NextResponse.json({ error: 'instanceId required' }, { status: 400 });
        }

        const instance = await prisma.whatsAppInstance.findFirst({
            where: { id: instanceId, organizationId: orgId }
        });
        if (!instance) {
            return NextResponse.json({ error: 'Instance not found' }, { status: 404 });
        }

        await deleteInstance(instanceId);
        return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action. Use "create", "connect", "logout", or "delete"' }, { status: 400 });
}
