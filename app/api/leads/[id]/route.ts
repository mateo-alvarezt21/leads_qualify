import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH /api/leads/:id
// Autenticado con x-api-key (misma clave que el webhook entrante)
// Body: cualquier subconjunto de campos del lead a actualizar
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const apiKey = req.headers.get('x-api-key') || new URL(req.url).searchParams.get('apiKey');
        if (!apiKey) {
            return NextResponse.json({ success: false, error: 'Missing API Key' }, { status: 401 });
        }

        const org = await prisma.organization.findUnique({ where: { apiKey } });
        if (!org) {
            return NextResponse.json({ success: false, error: 'Invalid API Key' }, { status: 403 });
        }

        const { id } = await params;
        const leadId = parseInt(id, 10);
        if (isNaN(leadId)) {
            return NextResponse.json({ success: false, error: 'Invalid lead ID' }, { status: 400 });
        }

        // Verify the lead belongs to this org
        const existing = await prisma.lead.findFirst({
            where: { id: leadId, organizationId: org.id },
        });
        if (!existing) {
            return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
        }

        // Parse body with encoding fallback (Latin-1 → UTF-8)
        const rawBuffer = await req.arrayBuffer();
        const utf8Text = new TextDecoder('utf-8', { fatal: false }).decode(rawBuffer);
        const bodyText = utf8Text.includes('\uFFFD')
            ? new TextDecoder('latin1').decode(rawBuffer)
            : utf8Text;
        const body = JSON.parse(bodyText);

        // Only allow updating these fields
        const allowed = ['name', 'email', 'phone', 'company', 'role', 'address', 'city', 'status', 'notes', 'source'];
        const updateData: Record<string, unknown> = {};
        for (const field of allowed) {
            if (body[field] !== undefined) {
                updateData[field] = body[field];
            }
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ success: false, error: 'No valid fields to update' }, { status: 400 });
        }

        const updatedLead = await prisma.lead.update({
            where: { id: leadId },
            data: updateData,
        });

        return NextResponse.json({ success: true, lead: updatedLead });
    } catch (error) {
        console.error('Lead update error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
