import {
    default as makeWASocket,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    WASocket,
    AuthenticationCreds,
    BufferJSON,
    initAuthCreds,
    proto
} from '@whiskeysockets/baileys';
import { prisma } from './prisma';
import pino from 'pino';

// Persist state on globalThis to survive HMR re-evaluations in dev mode
interface AccountInfo {
    phone: string;
    name: string;
    jid: string;
}

interface MessageBuffer {
    leadId: number;
    organizationId: string;
    instanceId: string;
    phone: string;
    pushName: string;
    messages: { text: string; timestamp: number }[];
    timer: ReturnType<typeof setTimeout> | null; // null = waiting for first message after welcome
    startedAt: number;
    timeoutMs: number; // resolved from org config
}

const MAX_BUFFER_MESSAGES = 50;
const DEFAULT_BUFFER_MINUTES = 2;

async function getBufferTimeoutMs(organizationId: string): Promise<number> {
    try {
        const config = await prisma.systemConfig.findUnique({
            where: { organizationId_key: { organizationId, key: 'whatsapp_buffer_timeout' } }
        });
        const minutes = config?.value ? parseFloat(config.value) : DEFAULT_BUFFER_MINUTES;
        return Math.max(0.1, minutes) * 60 * 1000; // min 6 seconds
    } catch {
        return DEFAULT_BUFFER_MINUTES * 60 * 1000;
    }
}

const g = globalThis as unknown as {
    __waSessions: Map<string, WASocket>;
    __waQrCodes: Map<string, string>;
    __waState: Map<string, 'connecting' | 'open' | 'closed'>;
    __waAccountInfo: Map<string, AccountInfo>;
    __waRestorePromise: Promise<void> | null;
    __waMessageBuffers: Map<string, MessageBuffer>;
};

// All maps are now keyed by instanceId
const sessions = (g.__waSessions ??= new Map());
const qrCodes = (g.__waQrCodes ??= new Map());
const connectionState = (g.__waState ??= new Map());
const accountInfo = (g.__waAccountInfo ??= new Map());
// Buffer key = `${organizationId}:${phone}`
const messageBuffers = (g.__waMessageBuffers ??= new Map());

// Lazy restore: runs once on first function call after server start
async function ensureSessionsRestored() {
    if (g.__waRestorePromise) return g.__waRestorePromise;
    g.__waRestorePromise = (async () => {
        try {
            // Find all instances that have stored credentials
            const instancesWithSessions = await prisma.whatsAppSession.findMany({
                where: { key: 'creds' },
                select: { instanceId: true },
                distinct: ['instanceId'],
            });

            // Clean up orphaned "Pendiente" leads from previous server run
            const orphanedLeads = await prisma.lead.updateMany({
                where: { status: 'Pendiente' },
                data: {
                    status: 'Nuevo',
                    notes: 'Conversacion interrumpida por reinicio del servidor - Score por defecto',
                    initialScore: 50,
                }
            });
            if (orphanedLeads.count > 0) {
                console.log(`[WhatsApp] Marked ${orphanedLeads.count} orphaned "Pendiente" lead(s) as "Nuevo"`);
            }

            if (instancesWithSessions.length === 0) return;

            console.log(`[WhatsApp] Restoring ${instancesWithSessions.length} session(s)...`);
            for (const { instanceId } of instancesWithSessions) {
                connectToWhatsApp(instanceId).catch(err =>
                    console.error(`[WhatsApp] Failed to restore session for instance ${instanceId}:`, err)
                );
            }
        } catch (error) {
            console.error('[WhatsApp] Error restoring sessions:', error);
        }
    })();
    return g.__waRestorePromise;
}

// Custom Auth State using Prisma - keyed by instanceId
async function usePrismaAuthState(instanceId: string) {
    const writeData = async (data: any, key: string) => {
        try {
            const stringified = JSON.stringify(data, BufferJSON.replacer);
            await prisma.whatsAppSession.upsert({
                where: {
                    instanceId_key: {
                        instanceId,
                        key
                    }
                },
                update: { data: stringified },
                create: {
                    instanceId,
                    key,
                    data: stringified
                }
            });
        } catch (error) {
            console.error('Error writing auth data', error);
        }
    };

    const readData = async (key: string) => {
        try {
            const session = await prisma.whatsAppSession.findUnique({
                where: {
                    instanceId_key: {
                        instanceId,
                        key
                    }
                }
            });
            if (session) {
                return JSON.parse(session.data, BufferJSON.reviver);
            }
            return null;
        } catch (error) {
            return null;
        }
    };

    const removeData = async (key: string) => {
        try {
            await prisma.whatsAppSession.delete({
                where: {
                    instanceId_key: {
                        instanceId,
                        key
                    }
                }
            });
        } catch (error) {
            // Ignore if not found
        }
    };

    const creds: AuthenticationCreds = (await readData('creds')) || initAuthCreds();

    return {
        state: {
            creds,
            keys: {
                get: async (type: string, ids: string[]) => {
                    const data: any = {};
                    await Promise.all(
                        ids.map(async (id) => {
                            let value = await readData(`${type}-${id}`);
                            if (type === 'app-state-sync-key' && value) {
                                value = proto.Message.AppStateSyncKeyData.fromObject(value);
                            }
                            if (value) {
                                data[id] = value;
                            }
                        })
                    );
                    return data;
                },
                set: async (data: any) => {
                    const tasks: any[] = [];
                    for (const category in data) {
                        for (const id in data[category]) {
                            const value = data[category][id];
                            const key = `${category}-${id}`;
                            if (value) {
                                tasks.push(writeData(value, key));
                            } else {
                                tasks.push(removeData(key));
                            }
                        }
                    }
                    await Promise.all(tasks);
                }
            }
        },
        saveCreds: () => writeData(creds, 'creds')
    };
}

export async function connectToWhatsApp(instanceId: string) {
    // Prevent duplicate connections
    const currentState = connectionState.get(instanceId);
    if (currentState === 'connecting' || currentState === 'open') {
        return sessions.get(instanceId);
    }

    // Look up the instance to get the organizationId
    const instance = await prisma.whatsAppInstance.findUnique({
        where: { id: instanceId },
        select: { id: true, organizationId: true }
    });
    if (!instance) {
        throw new Error(`WhatsApp instance ${instanceId} not found`);
    }
    const organizationId = instance.organizationId;

    connectionState.set(instanceId, 'connecting');

    const { state, saveCreds } = await usePrismaAuthState(instanceId);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })),
        },
        printQRInTerminal: false,
        logger: pino({ level: "silent" }) as any,
        generateHighQualityLinkPreview: true,
    });

    // Store socket reference immediately so getQR/getStatus can find it
    sessions.set(instanceId, sock);

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log(`QR generated for instance ${instanceId}`);
            qrCodes.set(instanceId, qr);
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(`Connection closed for instance ${instanceId}, reconnecting: ${shouldReconnect}`);

            sessions.delete(instanceId);
            qrCodes.delete(instanceId);
            connectionState.set(instanceId, 'closed');

            if (shouldReconnect) {
                // Delay reconnection to avoid reconnection storms
                const delay = 3000 + Math.random() * 2000; // 3-5 seconds
                console.log(`[WhatsApp] Reconnecting instance ${instanceId} in ${Math.round(delay / 1000)}s...`);
                setTimeout(() => connectToWhatsApp(instanceId), delay);
            } else {
                // Logged out: creds are invalid, clear them so next connect starts fresh
                console.log(`[WhatsApp] Session logged out for instance ${instanceId}, clearing stored creds`);
                await prisma.whatsAppSession.deleteMany({ where: { instanceId } });
            }
        } else if (connection === 'open') {
            const jid = sock.user?.id || '';
            const phone = jid.split(':')[0].split('@')[0];
            const name = sock.user?.name || '';
            console.log(`[WhatsApp] Connected instance ${instanceId}: ${name} (${phone})`);
            qrCodes.delete(instanceId);
            connectionState.set(instanceId, 'open');
            accountInfo.set(instanceId, { phone, name, jid });

            // Save phone and pushName to the instance record
            await prisma.whatsAppInstance.update({
                where: { id: instanceId },
                data: { phone, pushName: name || null }
            }).catch(err => console.error('[WhatsApp] Error saving instance info:', err));
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const myJid = sock.user?.id || '';
        const myPhone = myJid.split(':')[0].split('@')[0];

        for (const msg of messages) {
            if (msg.key.fromMe) continue;
            if (msg.key.remoteJid === 'status@broadcast') continue;
            if (!msg.message) continue;

            // Ignore group messages
            if (msg.key.remoteJid?.endsWith('@g.us')) continue;

            // Extract phone number: handle LID format from WhatsApp Business accounts
            const remoteJid = msg.key.remoteJid || '';
            const remoteJidAlt = (msg.key as any).remoteJidAlt || '';
            const senderPn = (msg.key as any).senderPn || '';

            let phone = '';
            if (remoteJid.endsWith('@s.whatsapp.net')) {
                phone = remoteJid.replace('@s.whatsapp.net', '');
            } else if (remoteJidAlt.endsWith('@s.whatsapp.net')) {
                phone = remoteJidAlt.replace('@s.whatsapp.net', '');
            } else if (senderPn.endsWith('@s.whatsapp.net')) {
                phone = senderPn.replace('@s.whatsapp.net', '');
            } else {
                console.log(`[WhatsApp] No phone number found for JID: ${remoteJid}, skipping`);
                continue;
            }

            // Ignore messages from our own number
            if (phone === myPhone) continue;

            const text = msg.message.conversation
                || msg.message.extendedTextMessage?.text
                || '';

            // Ignore messages without text (images, stickers, audio, etc.)
            if (!text.trim()) continue;

            const pushName = msg.pushName || '';
            const msgTimestamp = typeof msg.messageTimestamp === 'number'
                ? msg.messageTimestamp * 1000
                : Date.now();

            console.log(`[WhatsApp] Message on instance ${instanceId} from ${pushName} (${phone}): ${text.substring(0, 80)}`);

            const bufferKey = `${organizationId}:${phone}`;

            try {
                // State B: Buffer exists
                const existingBuffer = messageBuffers.get(bufferKey);
                if (existingBuffer) {
                    // B-waiting: buffer exists but timer is null → first message after welcome
                    if (existingBuffer.timer === null) {
                        existingBuffer.messages.push({ text, timestamp: msgTimestamp });
                        if (pushName) existingBuffer.pushName = pushName;
                        existingBuffer.startedAt = Date.now();
                        existingBuffer.timer = setTimeout(() => flushBuffer(bufferKey), existingBuffer.timeoutMs);
                        console.log(`[WhatsApp] Buffer activated for ${phone} (timeout: ${Math.round(existingBuffer.timeoutMs / 1000)}s): "${text.substring(0, 60)}"`);
                        continue;
                    }

                    // B-active: buffer has timer → accumulate and reset timer
                    // Duplicate detection: same text + timestamp < 1s
                    const lastMsg = existingBuffer.messages[existingBuffer.messages.length - 1];
                    if (lastMsg && lastMsg.text === text && Math.abs(msgTimestamp - lastMsg.timestamp) < 1000) {
                        continue;
                    }

                    existingBuffer.messages.push({ text, timestamp: msgTimestamp });
                    if (pushName) existingBuffer.pushName = pushName;

                    // Reset the flush timer
                    clearTimeout(existingBuffer.timer);

                    // Force flush if max messages or max total time (5x the configured timeout) reached
                    const maxTotalMs = existingBuffer.timeoutMs * 5;
                    const elapsed = Date.now() - existingBuffer.startedAt;
                    if (existingBuffer.messages.length >= MAX_BUFFER_MESSAGES || elapsed >= maxTotalMs) {
                        console.log(`[WhatsApp] Buffer limit reached for ${phone}, flushing now`);
                        flushBuffer(bufferKey);
                    } else {
                        existingBuffer.timer = setTimeout(() => flushBuffer(bufferKey), existingBuffer.timeoutMs);
                    }

                    console.log(`[WhatsApp] Buffered message ${existingBuffer.messages.length} for ${phone}`);
                    continue;
                }

                // State C: Lead already exists and is qualified — ignore
                const existingLead = await prisma.lead.findFirst({
                    where: { phone, organizationId }
                });

                if (existingLead) {
                    console.log(`[WhatsApp] Lead already exists for ${phone}, skipping`);
                    continue;
                }

                // State A: First message, no lead — create lead, send welcome, buffer in waiting mode
                // Resolve timeout from org config
                const timeoutMs = await getBufferTimeoutMs(organizationId);

                // Reserve the buffer key BEFORE async DB call to prevent race conditions
                const buffer: MessageBuffer = {
                    leadId: 0, // will be set after create
                    organizationId,
                    instanceId,
                    phone,
                    pushName: pushName || phone,
                    messages: [], // empty — first message is just a trigger, not part of the conversation
                    timer: null, // waiting mode — timer starts when first message after welcome arrives
                    startedAt: 0,
                    timeoutMs,
                };
                messageBuffers.set(bufferKey, buffer);

                const lead = await prisma.lead.create({
                    data: {
                        organizationId,
                        whatsappInstanceId: instanceId,
                        source: 'WhatsApp',
                        name: pushName || phone,
                        phone,
                        rawData: JSON.stringify({ name: pushName || phone, phone }),
                        initialScore: 0,
                        notes: '',
                        status: 'Pendiente',
                    }
                });
                buffer.leadId = lead.id;
                console.log(`[WhatsApp] Lead #${lead.id} created as "Pendiente" for ${phone}, waiting for messages after welcome`);

                // Send welcome message (fire and forget — awaiting blocks the handler and causes message loss during reconnections)
                sendWelcomeMessage(organizationId, instanceId, phone, pushName || phone);
            } catch (error) {
                console.error(`[WhatsApp] Error processing message:`, error);
                // Clean up buffer if lead creation failed
                const buf = messageBuffers.get(bufferKey);
                if (buf && buf.leadId === 0) {
                    if (buf.timer) clearTimeout(buf.timer);
                    messageBuffers.delete(bufferKey);
                }
            }
        }
    });

    return sock;
}

async function flushBuffer(bufferKey: string) {
    const buffer = messageBuffers.get(bufferKey);
    if (!buffer) return;

    if (buffer.timer) clearTimeout(buffer.timer);
    messageBuffers.delete(bufferKey);

    const { leadId, organizationId, messages, phone } = buffer;
    console.log(`[WhatsApp] Flushing buffer for ${phone}: ${messages.length} message(s)`);

    try {
        // Verify lead still exists
        const lead = await prisma.lead.findUnique({ where: { id: leadId } });
        if (!lead) {
            console.log(`[WhatsApp] Lead #${leadId} was deleted during buffer, skipping qualification`);
            return;
        }

        // Build conversation text for scoring
        const conversationText = messages.map(m => m.text).join('\n');

        // Get the WhatsApp-specific scoring prompt, fall back to general prompt
        const DEFAULT_PROMPT = "Analiza el lead. Si tiene nombre completo, email y teléfono suma 50 puntos. Si el email parece corporativo suma 20 puntos. Si menciona interés explícito suma 30 puntos.";

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
            || DEFAULT_PROMPT;

        // Qualify with the full conversation
        const { qualifyLead } = await import('./ai');
        const leadData = {
            name: buffer.pushName,
            phone,
            conversation: conversationText,
        };
        const qualification = await qualifyLead(leadData, promptToUse);

        // Update the lead
        await prisma.lead.update({
            where: { id: leadId },
            data: {
                initialScore: qualification.score,
                notes: qualification.reason,
                status: 'Nuevo',
                rawData: JSON.stringify(leadData),
            }
        });
        console.log(`[WhatsApp] Lead #${leadId} qualified: score=${qualification.score}, status=Nuevo`);

        // Trigger outgoing webhook (fire and forget)
        const updatedLead = await prisma.lead.findUnique({ where: { id: leadId } });
        if (updatedLead) {
            const webhookConfig = await prisma.systemConfig.findUnique({
                where: { organizationId_key: { organizationId, key: 'n8n_webhook_url' } }
            });
            if (webhookConfig?.value) {
                fetch(webhookConfig.value, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedLead)
                }).catch(err => console.error('[WhatsApp] Error sending to n8n webhook:', err));
            }
        }
    } catch (error) {
        console.error(`[WhatsApp] Error flushing buffer for ${phone}:`, error);
        // On error, set a default score and move to Nuevo
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

async function sendWelcomeMessage(organizationId: string, instanceId: string, phone: string, name: string) {
    try {
        const config = await prisma.systemConfig.findUnique({
            where: { organizationId_key: { organizationId, key: 'whatsapp_welcome_message' } }
        });
        const template = config?.value ?? '';
        if (!template.trim()) return;

        const message = template.replace(/\{nombre\}/gi, name);
        await sendWhatsAppMessage(instanceId, phone, message);
        console.log(`[WhatsApp] Welcome message sent to ${phone}`);
    } catch (err) {
        console.error('[WhatsApp] Error sending welcome message:', err);
    }
}

export async function getQR(instanceId: string): Promise<string | null> {
    await ensureSessionsRestored();
    if (!sessions.has(instanceId)) {
        connectToWhatsApp(instanceId);
    }

    // Wait for QR to appear with polling (max 10s, checks every 500ms)
    const maxWait = 10_000;
    const interval = 500;
    let elapsed = 0;
    while (!qrCodes.has(instanceId) && elapsed < maxWait) {
        await new Promise(r => setTimeout(r, interval));
        elapsed += interval;
    }

    return qrCodes.get(instanceId) || null;
}

export async function getStatus(instanceId: string) {
    await ensureSessionsRestored();
    const state = connectionState.get(instanceId);

    if (state === 'open') {
        const account = accountInfo.get(instanceId);
        return { status: 'connected', account: account || null };
    }

    if (state === 'connecting') {
        const qr = qrCodes.get(instanceId);
        if (qr) return { status: 'scanning', qr };
        return { status: 'connecting' };
    }

    return { status: 'disconnected' };
}

export async function logout(instanceId: string) {
    const sock = sessions.get(instanceId);
    if (sock) {
        try { await sock.logout(); } catch { /* ignore */ }
        sessions.delete(instanceId);
        qrCodes.delete(instanceId);
        connectionState.delete(instanceId);
        accountInfo.delete(instanceId);
    }

    // Always clean up session data
    await prisma.whatsAppSession.deleteMany({
        where: { instanceId }
    });

    return { success: true };
}

export async function deleteInstance(instanceId: string) {
    // Disconnect first if connected
    await logout(instanceId);

    // Delete the instance (sessions cascade-deleted by onDelete: Cascade)
    await prisma.whatsAppInstance.delete({
        where: { id: instanceId }
    });

    return { success: true };
}

export async function sendWhatsAppMessage(instanceId: string, phone: string, text: string) {
    await ensureSessionsRestored();
    const sock = sessions.get(instanceId);
    if (!sock || connectionState.get(instanceId) !== 'open') {
        throw new Error('WhatsApp not connected');
    }

    const jid = phone.includes('@s.whatsapp.net') ? phone : `${phone.replace(/[^0-9]/g, '')}@s.whatsapp.net`;

    await sock.sendMessage(jid, { text });
}
