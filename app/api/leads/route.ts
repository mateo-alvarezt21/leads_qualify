import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/leads?phone=xxx&email=xxx&name=xxx&status=xxx&id=xxx
// Autenticado con x-api-key
export async function GET(req: NextRequest) {
    try {
        const apiKey = req.headers.get('x-api-key') || new URL(req.url).searchParams.get('apiKey');
        if (!apiKey) {
            return NextResponse.json({ success: false, error: 'Missing API Key' }, { status: 401 });
        }

        const org = await prisma.organization.findUnique({ where: { apiKey } });
        if (!org) {
            return NextResponse.json({ success: false, error: 'Invalid API Key' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const id       = searchParams.get('id');
        const phone    = searchParams.get('phone');
        const email    = searchParams.get('email');
        const name     = searchParams.get('name');
        const status   = searchParams.get('status');
        const source   = searchParams.get('source');

        // At least one filter required
        if (!id && !phone && !email && !name && !status && !source) {
            return NextResponse.json({ success: false, error: 'Provide at least one search param: id, phone, email, name, status, source' }, { status: 400 });
        }

        // Phone search: compare only digits, ignoring prefixes like +57, BS+, etc.
        if (phone) {
            const digitsOnly = phone.replace(/\D/g, '');
            if (!digitsOnly) {
                return NextResponse.json({ success: false, error: 'Phone must contain at least one digit' }, { status: 400 });
            }
            const leads = await prisma.$queryRaw<any[]>`
                SELECT * FROM "Lead"
                WHERE "organizationId" = ${org.id}
                  AND regexp_replace("phone", '[^0-9]', '', 'g') LIKE ${'%' + digitsOnly + '%'}
                ORDER BY "createdAt" DESC
                LIMIT 20
            `;
            return NextResponse.json({ success: true, total: leads.length, leads });
        }

        const where: Record<string, unknown> = { organizationId: org.id };

        if (id)     where.id     = parseInt(id, 10);
        if (email)  where.email  = { contains: email, mode: 'insensitive' };
        if (name)   where.name   = { contains: name,  mode: 'insensitive' };
        if (status) where.status = status;
        if (source) where.source = source;

        const leads = await prisma.lead.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 20,
        });

        return NextResponse.json({ success: true, total: leads.length, leads });
    } catch (error) {
        console.error('Lead search error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
