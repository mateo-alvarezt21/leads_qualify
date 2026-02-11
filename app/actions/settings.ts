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
