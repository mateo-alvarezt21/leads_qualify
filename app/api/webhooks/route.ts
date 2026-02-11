import { NextRequest, NextResponse } from 'next/server';
import { processNewLead } from '@/lib/leads';
import { LeadSchema } from '@/lib/schemas';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
    try {
        // Rate limit: 60 requests per minute per IP
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
        const rl = rateLimit(`webhook:${ip}`, 60, 60_000);
        if (!rl.allowed) {
            return NextResponse.json(
                { success: false, error: 'Too many requests' },
                { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.resetIn / 1000)) } }
            );
        }

        // 1. Identify Organization via API Key
        // Look in Header 'x-api-key' or Query Param 'apiKey'
        const apiKey = req.headers.get('x-api-key') || new URL(req.url).searchParams.get('apiKey');

        if (!apiKey) {
            return NextResponse.json({ success: false, error: 'Missing API Key' }, { status: 401 });
        }

        const org = await prisma.organization.findUnique({
            where: { apiKey }
        });

        if (!org) {
            return NextResponse.json({ success: false, error: 'Invalid API Key' }, { status: 403 });
        }

        const body = await req.json();

        // 2. Validate Body
        const validation = LeadSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({
                success: false,
                error: 'Validation Error',
                details: validation.error.format()
            }, { status: 400 });
        }

        const validData = validation.data;

        const { searchParams } = new URL(req.url);
        const sourceParam = searchParams.get('source');
        const source = sourceParam || validData.source || 'Webhook';

        // 3. Process Lead with Context
        const lead = await processNewLead(body, source, org.id);

        return NextResponse.json({ success: true, leadId: lead.id }, { status: 201 });
    } catch (error) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
