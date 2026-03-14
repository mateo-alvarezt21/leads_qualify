import crypto from 'crypto';
import { prisma } from './prisma';
import { DEFAULT_SCORING_PROMPT } from './constants';

// ── Types ─────────────────────────────────────────────────────────────────────

interface CloudMessageBuffer {
    leadId: number;
    organizationId: string;
    accountId: string;
    phone: string;
    pushName: string;
    messages: { text: string; timestamp: number }[];
    timer: ReturnType<typeof setTimeout> | null;
    startedAt: number;
    timeoutMs: number;
}

// ── Global buffers (survive HMR, separate from Baileys) ───────────────────────

const g = globalThis as unknown as {
    __waCloudBuffers: Map<string, CloudMessageBuffer>;
};
const cloudBuffers = (g.__waCloudBuffers ??= new Map());
// Buffer key format: `cloud:${organizationId}:${phone}` — prefixed to avoid collision with Baileys

const MAX_BUFFER_MESSAGES = 50;
const DEFAULT_BUFFER_MINUTES = 2;

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getBufferTimeoutMs(organizationId: string): Promise<number> {
    try {
        const config = await prisma.systemConfig.findUnique({
            where: { organizationId_key: { organizationId, key: 'whatsapp_buffer_timeout' } }
        });
        const minutes = config?.value ? parseFloat(config.value) : DEFAULT_BUFFER_MINUTES;
        return Math.max(0.1, minutes) * 60 * 1000;
    } catch {
        return DEFAULT_BUFFER_MINUTES * 60 * 1000;
    }
}

// ── Signature validation ──────────────────────────────────────────────────────

export function verifyCloudWebhookSignature(
    rawBody: string,
    signature: string | null,
    appSecret: string
): boolean {
    if (!signature) return false;
    const expected = 'sha256=' + crypto
        .createHmac('sha256', appSecret)
        .update(rawBody, 'utf8')
        .digest('hex');
    try {
        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
        return false;
    }
}

// ── Send message via Cloud API ────────────────────────────────────────────────

export async function sendCloudMessage(
    phoneNumberId: string,
    accessToken: string,
    apiVersion: string,
    to: string,
    text: string
): Promise<void> {
    const cleanTo = to.replace(/[^0-9]/g, '');
    const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: cleanTo,
            type: 'text',
            text: { body: text },
        }),
    });
    if (!res.ok) {
        const body = await res.text();
        throw new Error(`Cloud API error ${res.status}: ${body}`);
    }
}

// ── Welcome message ───────────────────────────────────────────────────────────

async function sendWelcomeCloudMessage(
    account: { phoneNumberId: string; accessToken: string; apiVersion: string },
    organizationId: string,
    phone: string,
    name: string
): Promise<void> {
    try {
        const config = await prisma.systemConfig.findUnique({
            where: { organizationId_key: { organizationId, key: 'whatsapp_welcome_message' } }
        });
        const template = config?.value ?? '';
        if (!template.trim()) return;
        const message = template.replace(/\{nombre\}/gi, name);
        await sendCloudMessage(account.phoneNumberId, account.accessToken, account.apiVersion, phone, message);
        console.log(`[WA Cloud] Welcome message sent to ${phone}`);
    } catch (err) {
        console.error('[WA Cloud] Error sending welcome message:', err);
    }
}

// ── Flush buffer → qualify lead ───────────────────────────────────────────────

async function flushCloudBuffer(bufferKey: string): Promise<void> {
    const buffer = cloudBuffers.get(bufferKey);
    if (!buffer) return;

    if (buffer.timer) clearTimeout(buffer.timer);
    cloudBuffers.delete(bufferKey);

    const { leadId, organizationId, accountId, messages, phone } = buffer;
    console.log(`[WA Cloud] Flushing buffer for ${phone}: ${messages.length} message(s)`);

    try {
        const lead = await prisma.lead.findUnique({ where: { id: leadId } });
        if (!lead) {
            console.log(`[WA Cloud] Lead #${leadId} was deleted during buffer, skipping`);
            return;
        }

        const conversationText = messages.map(m => m.text).join('\n');

        const [waPromptConfig, generalPromptConfig] = await Promise.all([
            prisma.systemConfig.findUnique({
                where: { organizationId_key: { organizationId, key: 'whatsapp_scoring_prompt' } }
            }),
            prisma.systemConfig.findUnique({
                where: { organizationId_key: { organizationId, key: 'scoring_prompt' } }
            }),
        ]);

        const promptToUse = (waPromptConfig?.value?.trim())
            || generalPromptConfig?.value
            || DEFAULT_SCORING_PROMPT;

        const { qualifyLead } = await import('./ai');
        const leadData = {
            name: buffer.pushName,
            phone,
            conversation: conversationText,
        };
        const qualification = await qualifyLead(leadData, promptToUse);

        await prisma.lead.update({
            where: { id: leadId },
            data: {
                initialScore: qualification.score,
                notes: qualification.reason,
                status: 'Nuevo',
                rawData: JSON.stringify(leadData),
            }
        });
        console.log(`[WA Cloud] Lead #${leadId} qualified: score=${qualification.score}, status=Nuevo`);

        // Trigger outgoing n8n webhook (fire and forget)
        const webhookConfig = await prisma.systemConfig.findUnique({
            where: { organizationId_key: { organizationId, key: 'n8n_webhook_url' } }
        });
        if (webhookConfig?.value) {
            const updatedLead = await prisma.lead.findUnique({ where: { id: leadId } });
            if (updatedLead) {
                fetch(webhookConfig.value, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedLead),
                }).catch(err => console.error('[WA Cloud] Error sending to n8n webhook:', err));
            }
        }
    } catch (error) {
        console.error(`[WA Cloud] Error flushing buffer for ${phone}:`, error);
        try {
            await prisma.lead.update({
                where: { id: leadId },
                data: {
                    initialScore: 50,
                    notes: 'Error de conexión o análisis con IA - Score por defecto',
                    status: 'Nuevo',
                }
            });
        } catch { /* lead may have been deleted */ }
    }
}

// ── Main message processor ────────────────────────────────────────────────────

export async function processCloudWebhookMessage(
    accountId: string,
    account: { phoneNumberId: string; accessToken: string; apiVersion: string },
    organizationId: string,
    phone: string,
    pushName: string,
    text: string,
    timestamp: number
): Promise<void> {
    const bufferKey = `cloud:${organizationId}:${phone}`;

    try {
        // State B: buffer already exists
        const existingBuffer = cloudBuffers.get(bufferKey);
        if (existingBuffer) {
            // B-waiting: timer is null → first message after welcome
            if (existingBuffer.timer === null) {
                existingBuffer.messages.push({ text, timestamp });
                if (pushName) existingBuffer.pushName = pushName;
                existingBuffer.startedAt = Date.now();
                existingBuffer.timer = setTimeout(() => flushCloudBuffer(bufferKey), existingBuffer.timeoutMs);
                console.log(`[WA Cloud] Buffer activated for ${phone} (timeout: ${Math.round(existingBuffer.timeoutMs / 1000)}s)`);
                return;
            }

            // B-active: accumulate + reset timer
            const lastMsg = existingBuffer.messages[existingBuffer.messages.length - 1];
            if (lastMsg && lastMsg.text === text && Math.abs(timestamp - lastMsg.timestamp) < 1000) {
                return; // duplicate
            }

            existingBuffer.messages.push({ text, timestamp });
            if (pushName) existingBuffer.pushName = pushName;

            clearTimeout(existingBuffer.timer);

            const maxTotalMs = existingBuffer.timeoutMs * 5;
            const elapsed = Date.now() - existingBuffer.startedAt;
            if (existingBuffer.messages.length >= MAX_BUFFER_MESSAGES || elapsed >= maxTotalMs) {
                console.log(`[WA Cloud] Buffer limit reached for ${phone}, flushing now`);
                flushCloudBuffer(bufferKey);
            } else {
                existingBuffer.timer = setTimeout(() => flushCloudBuffer(bufferKey), existingBuffer.timeoutMs);
            }

            console.log(`[WA Cloud] Buffered message ${existingBuffer.messages.length} for ${phone}`);
            return;
        }

        // Check if lead already exists (prevents duplicates across Baileys and Cloud)
        const existingLead = await prisma.lead.findFirst({
            where: { phone, organizationId }
        });
        if (existingLead) {
            console.log(`[WA Cloud] Lead already exists for ${phone}, skipping`);
            return;
        }

        // State A: first message — create lead, send welcome, init buffer in waiting mode
        const timeoutMs = await getBufferTimeoutMs(organizationId);

        const buffer: CloudMessageBuffer = {
            leadId: 0,
            organizationId,
            accountId,
            phone,
            pushName: pushName || phone,
            messages: [],
            timer: null,
            startedAt: 0,
            timeoutMs,
        };
        cloudBuffers.set(bufferKey, buffer);

        const lead = await prisma.lead.create({
            data: {
                organizationId,
                whatsappCloudAccountId: accountId,
                source: 'WhatsApp Cloud',
                name: pushName || phone,
                phone,
                rawData: JSON.stringify({ name: pushName || phone, phone }),
                initialScore: 0,
                notes: '',
                status: 'Pendiente',
            }
        });
        buffer.leadId = lead.id;
        console.log(`[WA Cloud] Lead #${lead.id} created as "Pendiente" for ${phone}`);

        // Send welcome (fire and forget)
        sendWelcomeCloudMessage(account, organizationId, phone, pushName || phone);
    } catch (error) {
        console.error(`[WA Cloud] Error processing message from ${phone}:`, error);
        const buf = cloudBuffers.get(bufferKey);
        if (buf && buf.leadId === 0) {
            if (buf.timer) clearTimeout(buf.timer);
            cloudBuffers.delete(bufferKey);
        }
    }
}
