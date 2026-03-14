import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyCloudWebhookSignature, processCloudWebhookMessage } from '@/lib/whatsapp-cloud';

// GET — Meta webhook verification
export async function GET(req: NextRequest) {
    const mode = req.nextUrl.searchParams.get('hub.mode');
    const token = req.nextUrl.searchParams.get('hub.verify_token');
    const challenge = req.nextUrl.searchParams.get('hub.challenge');

    if (mode !== 'subscribe' || !token) {
        return new NextResponse('Bad Request', { status: 400 });
    }

    const account = await prisma.whatsAppCloudAccount.findFirst({
        where: { verifyToken: token, active: true }
    });

    if (!account) {
        return new NextResponse('Forbidden', { status: 403 });
    }

    console.log(`[WA Cloud] Webhook verified for account ${account.displayName} (${account.id})`);
    return new NextResponse(challenge, { status: 200 });
}

// POST — Incoming messages from Meta
export async function POST(req: NextRequest) {
    const rawBody = await req.text();
    const signature = req.headers.get('x-hub-signature-256');

    let parsed: any;
    try {
        parsed = JSON.parse(rawBody);
    } catch {
        return new NextResponse('Bad Request', { status: 400 });
    }

    if (parsed.object !== 'whatsapp_business_account') {
        return new NextResponse('OK', { status: 200 });
    }

    try {
        const entry = parsed.entry?.[0];
        const change = entry?.changes?.[0];
        const value = change?.value;

        if (!value) return new NextResponse('OK', { status: 200 });

        const phoneNumberId = value.metadata?.phone_number_id;
        if (!phoneNumberId) return new NextResponse('OK', { status: 200 });

        // Look up the account by phoneNumberId
        const account = await prisma.whatsAppCloudAccount.findFirst({
            where: { phoneNumberId, active: true }
        });

        if (!account) {
            console.warn(`[WA Cloud] No active account found for phoneNumberId=${phoneNumberId}`);
            return new NextResponse('OK', { status: 200 });
        }

        // Validate HMAC signature
        if (!verifyCloudWebhookSignature(rawBody, signature, account.appSecret)) {
            console.warn(`[WA Cloud] Invalid signature for account ${account.id}`);
            return new NextResponse('Forbidden', { status: 403 });
        }

        const messages: any[] = value.messages ?? [];
        const contacts: any[] = value.contacts ?? [];

        // Respond 200 immediately; process async
        const processAll = async () => {
            for (const msg of messages) {
                if (msg.type !== 'text') continue;

                const phone = msg.from; // already digits only from Meta
                const text: string = msg.text?.body ?? '';
                if (!text.trim()) continue;

                const timestamp = Number(msg.timestamp) * 1000;
                const contact = contacts.find((c: any) => c.wa_id === phone);
                const pushName: string = contact?.profile?.name ?? '';

                console.log(`[WA Cloud] Message from ${pushName || phone}: ${text.substring(0, 80)}`);

                await processCloudWebhookMessage(
                    account.id,
                    {
                        phoneNumberId: account.phoneNumberId,
                        accessToken: account.accessToken,
                        apiVersion: account.apiVersion,
                    },
                    account.organizationId,
                    phone,
                    pushName,
                    text,
                    timestamp
                );
            }
        };

        processAll().catch(err => console.error('[WA Cloud] Async processing error:', err));

        return new NextResponse('OK', { status: 200 });
    } catch (err) {
        console.error('[WA Cloud] Webhook handler error:', err);
        return new NextResponse('OK', { status: 200 }); // always 200 to Meta
    }
}
