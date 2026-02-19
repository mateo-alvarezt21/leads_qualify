'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';

async function requireAdmin() {
    const session = await getSession();
    if (!session?.user?.organizationId) {
        throw new Error('Unauthorized');
    }
    if (session.user.role !== 'admin' && session.user.role !== 'superadmin') {
        throw new Error('Admin role required');
    }
    return session;
}

export async function getCustomFields() {
    const session = await getSession();
    if (!session?.user?.organizationId) return [];

    return prisma.customField.findMany({
        where: { organizationId: session.user.organizationId },
        orderBy: { position: 'asc' },
    });
}

interface CustomFieldData {
    fieldName: string;
    fieldLabel: string;
    fieldType?: string;
    required?: boolean;
    options?: string | null;
    showAsColumn?: boolean;
}

export async function createCustomField(data: CustomFieldData) {
    try {
        const session = await requireAdmin();

        if (!/^[a-z][a-z0-9_]*$/.test(data.fieldName)) {
            return { success: false, error: 'El nombre del campo solo puede contener letras minúsculas, números y guiones bajos, y debe empezar con una letra.' };
        }

        const maxPosition = await prisma.customField.aggregate({
            where: { organizationId: session.user.organizationId },
            _max: { position: true },
        });

        const nextPosition = (maxPosition._max.position ?? -1) + 1;

        const field = await prisma.customField.create({
            data: {
                organizationId: session.user.organizationId,
                fieldName: data.fieldName,
                fieldLabel: data.fieldLabel,
                fieldType: data.fieldType || 'text',
                required: data.required ?? false,
                options: data.options || null,
                showAsColumn: data.showAsColumn ?? false,
                position: nextPosition,
            },
        });

        revalidatePath('/settings');
        return { success: true, field };
    } catch (error: any) {
        if (error.code === 'P2002') {
            return { success: false, error: 'Ya existe un campo con ese nombre en tu organización.' };
        }
        return { success: false, error: error.message || 'Error al crear el campo' };
    }
}

export async function updateCustomField(id: number, data: Partial<CustomFieldData>) {
    try {
        const session = await requireAdmin();

        if (data.fieldName && !/^[a-z][a-z0-9_]*$/.test(data.fieldName)) {
            return { success: false, error: 'Nombre de campo inválido.' };
        }

        const field = await prisma.customField.findFirst({
            where: { id, organizationId: session.user.organizationId },
        });

        if (!field) return { success: false, error: 'Campo no encontrado' };

        const updated = await prisma.customField.update({
            where: { id },
            data: {
                ...(data.fieldName !== undefined && { fieldName: data.fieldName }),
                ...(data.fieldLabel !== undefined && { fieldLabel: data.fieldLabel }),
                ...(data.fieldType !== undefined && { fieldType: data.fieldType }),
                ...(data.required !== undefined && { required: data.required }),
                ...(data.options !== undefined && { options: data.options }),
                ...(data.showAsColumn !== undefined && { showAsColumn: data.showAsColumn }),
            },
        });

        revalidatePath('/settings');
        return { success: true, field: updated };
    } catch (error: any) {
        return { success: false, error: error.message || 'Error al actualizar el campo' };
    }
}

export async function deleteCustomField(id: number) {
    try {
        const session = await requireAdmin();

        const field = await prisma.customField.findFirst({
            where: { id, organizationId: session.user.organizationId },
        });

        if (!field) return { success: false, error: 'Campo no encontrado' };

        await prisma.customField.delete({ where: { id } });

        revalidatePath('/settings');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || 'Error al eliminar el campo' };
    }
}

export async function reorderCustomFields(orderedIds: number[]) {
    try {
        const session = await requireAdmin();

        await prisma.$transaction(
            orderedIds.map((id, index) =>
                prisma.customField.updateMany({
                    where: { id, organizationId: session.user.organizationId },
                    data: { position: index },
                })
            )
        );

        revalidatePath('/settings');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || 'Error al reordenar los campos' };
    }
}
