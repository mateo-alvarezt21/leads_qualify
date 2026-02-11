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

        // Scope update by organizationId
        const updatedLead = await prisma.lead.updateMany({
            where: {
                id: leadId,
                organizationId: session.user.organizationId
            },
            data: {
                name: data.name,
                email: data.email,
                phone: data.phone,
                company: data.company,
                role: data.role,
                address: data.address,
                city: data.city,
                status: data.status
            }
        });

        if (updatedLead.count === 0) return { success: false, error: 'Lead not found or unauthorized' };

        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Error updating lead:', error);
        return { success: false, error: 'Error al actualizar el lead' };
    }
}
