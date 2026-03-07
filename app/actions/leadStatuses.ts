'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';

async function requireSession() {
    const session = await getSession();
    if (!session?.user?.organizationId) throw new Error('Unauthorized');
    return session;
}

const DEFAULT_STATUSES = [
    { name: 'Nuevo',      color: '#10b981', isDefault: true, position: 0 },
    { name: 'Pendiente',  color: '#a855f7', isDefault: true, position: 1 },
    { name: 'Contactado', color: '#3b82f6', isDefault: true, position: 2 },
    { name: 'Ganado',     color: '#22c55e', isDefault: true, position: 3 },
    { name: 'Perdido',    color: '#ef4444', isDefault: true, position: 4 },
];

export async function getLeadStatuses(orgId: string) {
    let statuses = await prisma.leadStatus.findMany({
        where: { organizationId: orgId },
        include: { triggers: true },
        orderBy: { position: 'asc' },
    });

    // Auto-seed defaults for orgs that don't have statuses yet
    if (statuses.length === 0) {
        await prisma.leadStatus.createMany({
            data: DEFAULT_STATUSES.map(s => ({ ...s, organizationId: orgId })),
        });
        statuses = await prisma.leadStatus.findMany({
            where: { organizationId: orgId },
            include: { triggers: true },
            orderBy: { position: 'asc' },
        });
    }

    return statuses;
}

// ── CRUD Estados ──────────────────────────────────────────────────────────────

export async function createLeadStatus(data: { name: string; color: string }) {
    try {
        const session = await requireSession();
        const orgId = session.user.organizationId;

        const maxPos = await prisma.leadStatus.aggregate({
            where: { organizationId: orgId },
            _max: { position: true },
        });
        const position = (maxPos._max.position ?? -1) + 1;

        const status = await prisma.leadStatus.create({
            data: {
                organizationId: orgId,
                name: data.name.trim(),
                color: data.color,
                isDefault: false,
                position,
            },
            include: { triggers: true },
        });

        revalidatePath('/');
        revalidatePath('/settings');
        return { success: true, status };
    } catch (error: any) {
        if (error.code === 'P2002') return { success: false, error: 'Ya existe un estado con ese nombre.' };
        return { success: false, error: error.message || 'Error al crear estado' };
    }
}

export async function updateLeadStatus(id: string, data: { name?: string; color?: string }) {
    try {
        const session = await requireSession();

        const existing = await prisma.leadStatus.findFirst({
            where: { id, organizationId: session.user.organizationId },
        });
        if (!existing) return { success: false, error: 'Estado no encontrado' };

        const updates: { name?: string; color?: string } = {};
        if (data.color !== undefined) updates.color = data.color;

        if (data.name !== undefined && data.name.trim() !== existing.name) {
            const newName = data.name.trim();
            updates.name = newName;
            // Update all leads that had the old status name
            await prisma.lead.updateMany({
                where: { organizationId: session.user.organizationId, status: existing.name },
                data: { status: newName },
            });
        }

        const updated = await prisma.leadStatus.update({
            where: { id },
            data: updates,
            include: { triggers: true },
        });

        revalidatePath('/');
        revalidatePath('/settings');
        return { success: true, status: updated };
    } catch (error: any) {
        if (error.code === 'P2002') return { success: false, error: 'Ya existe un estado con ese nombre.' };
        return { success: false, error: error.message || 'Error al actualizar estado' };
    }
}

export async function deleteLeadStatus(id: string) {
    try {
        const session = await requireSession();

        const existing = await prisma.leadStatus.findFirst({
            where: { id, organizationId: session.user.organizationId },
        });
        if (!existing) return { success: false, error: 'Estado no encontrado' };

        const leadCount = await prisma.lead.count({
            where: { organizationId: session.user.organizationId, status: existing.name },
        });

        if (leadCount > 0) {
            return {
                success: false,
                error: `No se puede eliminar: ${leadCount} lead(s) usan este estado. Cambia su estado primero.`,
            };
        }

        await prisma.leadStatus.delete({ where: { id } });

        revalidatePath('/');
        revalidatePath('/settings');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || 'Error al eliminar estado' };
    }
}

// ── Triggers ──────────────────────────────────────────────────────────────────

export async function createStatusTrigger(data: { statusId: string; webhookUrl: string; fields?: string[] | null }) {
    try {
        const session = await requireSession();

        const status = await prisma.leadStatus.findFirst({
            where: { id: data.statusId, organizationId: session.user.organizationId },
        });
        if (!status) return { success: false, error: 'Estado no encontrado' };

        const trigger = await prisma.statusTrigger.create({
            data: {
                statusId: data.statusId,
                organizationId: session.user.organizationId,
                type: 'webhook',
                webhookUrl: data.webhookUrl,
                fields: data.fields && data.fields.length > 0 ? JSON.stringify(data.fields) : null,
                enabled: true,
            },
        });

        revalidatePath('/settings');
        return { success: true, trigger };
    } catch (error: any) {
        return { success: false, error: error.message || 'Error al crear trigger' };
    }
}

export async function updateStatusTrigger(id: string, data: { webhookUrl?: string; enabled?: boolean; fields?: string[] | null }) {
    try {
        const session = await requireSession();

        const existing = await prisma.statusTrigger.findFirst({
            where: { id, organizationId: session.user.organizationId },
        });
        if (!existing) return { success: false, error: 'Trigger no encontrado' };

        const updated = await prisma.statusTrigger.update({
            where: { id },
            data: {
                ...(data.webhookUrl !== undefined && { webhookUrl: data.webhookUrl }),
                ...(data.enabled !== undefined && { enabled: data.enabled }),
                ...(data.fields !== undefined && {
                    fields: data.fields && data.fields.length > 0 ? JSON.stringify(data.fields) : null,
                }),
            },
        });

        revalidatePath('/settings');
        return { success: true, trigger: updated };
    } catch (error: any) {
        return { success: false, error: error.message || 'Error al actualizar trigger' };
    }
}

export async function deleteStatusTrigger(id: string) {
    try {
        const session = await requireSession();

        const existing = await prisma.statusTrigger.findFirst({
            where: { id, organizationId: session.user.organizationId },
        });
        if (!existing) return { success: false, error: 'Trigger no encontrado' };

        await prisma.statusTrigger.delete({ where: { id } });

        revalidatePath('/settings');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || 'Error al eliminar trigger' };
    }
}
