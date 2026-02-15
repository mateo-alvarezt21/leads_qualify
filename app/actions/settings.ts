'use server'
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';

export async function updateSettings(formData: FormData) {
    const prompt = formData.get('prompt') as string;
    const webhookUrl = formData.get('n8n_webhook_url') as string;
    const welcomeMessage = formData.get('whatsapp_welcome_message') as string | null;
    const waScoringPrompt = formData.get('whatsapp_scoring_prompt') as string | null;
    const bufferTimeout = formData.get('whatsapp_buffer_timeout') as string | null;

    try {
        const session = await getSession();
        if (!session?.user?.organizationId) return { success: false, error: 'Unauthorized' };

        const orgId = session.user.organizationId;

        if (prompt) {
            await prisma.systemConfig.upsert({
                where: {
                    organizationId_key: {
                        organizationId: orgId,
                        key: 'scoring_prompt'
                    }
                },
                update: { value: prompt },
                create: {
                    organizationId: orgId,
                    key: 'scoring_prompt',
                    value: prompt
                }
            });
        }

        if (webhookUrl !== null) {
            await prisma.systemConfig.upsert({
                where: {
                    organizationId_key: {
                        organizationId: orgId,
                        key: 'n8n_webhook_url'
                    }
                },
                update: { value: webhookUrl },
                create: {
                    organizationId: orgId,
                    key: 'n8n_webhook_url',
                    value: webhookUrl
                }
            });
        }

        if (welcomeMessage !== null) {
            await prisma.systemConfig.upsert({
                where: {
                    organizationId_key: {
                        organizationId: orgId,
                        key: 'whatsapp_welcome_message'
                    }
                },
                update: { value: welcomeMessage ?? '' },
                create: {
                    organizationId: orgId,
                    key: 'whatsapp_welcome_message',
                    value: welcomeMessage ?? ''
                }
            });
        }

        if (waScoringPrompt !== null) {
            await prisma.systemConfig.upsert({
                where: {
                    organizationId_key: {
                        organizationId: orgId,
                        key: 'whatsapp_scoring_prompt'
                    }
                },
                update: { value: waScoringPrompt ?? '' },
                create: {
                    organizationId: orgId,
                    key: 'whatsapp_scoring_prompt',
                    value: waScoringPrompt ?? ''
                }
            });
        }

        if (bufferTimeout !== null) {
            await prisma.systemConfig.upsert({
                where: {
                    organizationId_key: {
                        organizationId: orgId,
                        key: 'whatsapp_buffer_timeout'
                    }
                },
                update: { value: bufferTimeout ?? '2' },
                create: {
                    organizationId: orgId,
                    key: 'whatsapp_buffer_timeout',
                    value: bufferTimeout ?? '2'
                }
            });
        }

        revalidatePath('/settings');
        return { success: true };
    } catch (error) {
        console.error(error);
        return { success: false, error: 'Error updating settings' };
    }
}

export async function updateBranding(data: { logo?: string | null; brandColor?: string | null }) {
    try {
        const session = await getSession();
        if (!session?.user?.organizationId) return { success: false, error: 'No autorizado' };

        // Only admin or superadmin can change branding
        if (session.user.role !== 'admin' && session.user.role !== 'superadmin') {
            return { success: false, error: 'No autorizado' };
        }

        // Validate logo size if base64 (max 500KB)
        if (data.logo && data.logo.startsWith('data:')) {
            const sizeInBytes = Math.ceil((data.logo.length * 3) / 4);
            if (sizeInBytes > 512_000) {
                return { success: false, error: 'El logo no puede pesar más de 500KB' };
            }
        }

        // Validate color format
        if (data.brandColor && !/^#[0-9a-fA-F]{6}$/.test(data.brandColor)) {
            return { success: false, error: 'Color inválido. Usa formato hex (#FF5500)' };
        }

        const updateData: { logo?: string | null; brandColor?: string | null } = {};
        if (data.logo !== undefined) updateData.logo = data.logo;
        if (data.brandColor !== undefined) updateData.brandColor = data.brandColor;

        await prisma.organization.update({
            where: { id: session.user.organizationId },
            data: updateData,
        });

        revalidatePath('/');
        revalidatePath('/settings');
        return { success: true };
    } catch (error) {
        console.error('Error updating branding:', error);
        return { success: false, error: 'Error al actualizar la marca' };
    }
}

export async function getOrganizationBranding() {
    try {
        const session = await getSession();
        if (!session?.user?.organizationId) return null;

        const org = await prisma.organization.findUnique({
            where: { id: session.user.organizationId },
            select: { logo: true, brandColor: true, name: true },
        });

        return org;
    } catch {
        return null;
    }
}
