'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { processNewLead } from '@/lib/leads';
import { getSession } from '@/lib/auth';

export async function deleteLead(leadId: number) {
    try {
        const session = await getSession();
        if (!session?.user?.organizationId) return { success: false, error: 'Unauthorized' };

        // Ensure lead belongs to org
        const count = await prisma.lead.count({
            where: { id: leadId, organizationId: session.user.organizationId }
        });

        if (count === 0) return { success: false, error: 'Lead not found' };

        await prisma.lead.delete({
            where: { id: leadId }
        });

        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Error deleting lead:', error);
        return { success: false, error: 'Error al eliminar el lead' };
    }
}

export async function deleteAllLeads() {
    try {
        const session = await getSession();
        if (!session?.user?.organizationId) return { success: false, error: 'Unauthorized' };

        await prisma.lead.deleteMany({
            where: { organizationId: session.user.organizationId }
        });

        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Error deleting all leads:', error);
        return { success: false, error: 'Error al eliminar los leads' };
    }
}

interface ManualLeadData {
    name: string;
    email?: string;
    phone?: string;
    source?: string;
    company?: string;
    role?: string;
    address?: string;
    city?: string;
    status?: string; // Add status to interface for update
    rawData?: string;
}

export async function addManualLead(data: ManualLeadData) {
    try {
        const session = await getSession();
        if (!session?.user?.organizationId) return { success: false, error: 'Unauthorized' };

        // Add lead with orgId
        const lead = await processNewLead({
            name: data.name,
            email: data.email,
            phone: data.phone,
            company: data.company,
            role: data.role,
            address: data.address,
            city: data.city,
        }, data.source || 'Manual', session.user.organizationId);

        revalidatePath('/');
        return { success: true, lead };
    } catch (error) {
        console.error('Error adding manual lead:', error);
        return { success: false, error: 'Error al agregar el lead' };
    }
}

export async function updateLead(leadId: number, data: Partial<ManualLeadData & { status: string }>) {
    try {
        const session = await getSession();
        if (!session?.user?.organizationId) return { success: false, error: 'Unauthorized' };

        const orgId = session.user.organizationId;

        // Get current lead to detect status change
        const currentLead = await prisma.lead.findFirst({
            where: { id: leadId, organizationId: orgId },
        });
        if (!currentLead) return { success: false, error: 'Lead not found or unauthorized' };

        const updatedLead = await prisma.lead.update({
            where: { id: leadId },
            data: {
                name: data.name,
                email: data.email,
                phone: data.phone,
                company: data.company,
                role: data.role,
                address: data.address,
                city: data.city,
                status: data.status,
                ...(data.rawData !== undefined && { rawData: data.rawData })
            },
        });

        // Fire triggers if status changed (fire-and-forget)
        if (data.status && data.status !== currentLead.status) {
            fireStatusTriggers(updatedLead, data.status, orgId).catch(console.error);
        }

        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Error updating lead:', error);
        return { success: false, error: 'Error al actualizar el lead' };
    }
}

async function fireStatusTriggers(lead: any, newStatus: string, orgId: string) {
    const status = await prisma.leadStatus.findFirst({
        where: { organizationId: orgId, name: newStatus },
        include: { triggers: { where: { enabled: true, type: 'webhook' } } },
    });

    if (!status || status.triggers.length === 0) return;

    let rawDataParsed: Record<string, unknown> = {};
    try { rawDataParsed = JSON.parse(lead.rawData || '{}'); } catch { /* ignore */ }

    const payload = {
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        role: lead.role,
        city: lead.city,
        address: lead.address,
        status: lead.status,
        source: lead.source,
        initialScore: lead.initialScore,
        notes: lead.notes,
        createdAt: lead.createdAt,
        rawData: rawDataParsed,
    };

    for (const trigger of status.triggers) {
        let finalPayload: Record<string, unknown> = payload;
        if (trigger.fields) {
            try {
                const selectedFields = JSON.parse(trigger.fields) as string[];
                finalPayload = Object.fromEntries(
                    Object.entries(payload).filter(([k]) => selectedFields.includes(k))
                );
            } catch { /* use full payload */ }
        }
        fetch(trigger.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(finalPayload),
        }).catch(err => console.error(`Trigger webhook ${trigger.id} error:`, err));
    }
}

// ── Import ─────────────────────────────────────────────────────────────────────

export interface ImportRow {
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    role?: string;
    city?: string;
    address?: string;
    source?: string;
    [key: string]: string | undefined;
}

export async function importLeads(rows: ImportRow[], scoreWithAI: boolean) {
    try {
        const session = await getSession();
        if (!session?.user?.organizationId) return { success: false, imported: 0, errors: 0 };
        const orgId = session.user.organizationId;

        let imported = 0;
        let errors = 0;

        if (!scoreWithAI) {
            const data = rows.map(({ name, email, phone, company, role, city, address, source, ...rest }) => ({
                organizationId: orgId,
                name: name || 'Sin nombre',
                email: email || null,
                phone: phone || null,
                company: company || null,
                role: role || null,
                city: city || null,
                address: address || null,
                source: source || 'Importación',
                rawData: JSON.stringify(rest),
                initialScore: 0,
                status: 'Nuevo',
            }));
            try {
                await prisma.lead.createMany({ data });
                imported = rows.length;
            } catch {
                errors = rows.length;
            }
        } else {
            // Sequential AI scoring (max 100 rows to avoid timeout)
            const limited = rows.slice(0, 100);
            for (const row of limited) {
                try {
                    const { name, email, phone, company, role, city, address, source, ...rest } = row;
                    await processNewLead(
                        { name, email, phone, company, role, city, address },
                        source || 'Importación',
                        orgId,
                    );
                    imported++;
                } catch {
                    errors++;
                }
            }
        }

        revalidatePath('/');
        return { success: true, imported, errors };
    } catch (error) {
        console.error('Error importing leads:', error);
        return { success: false, imported: 0, errors: rows.length };
    }
}
