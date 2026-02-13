'use server'

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import crypto from 'crypto';

async function requireSuperadmin() {
    const session = await getSession();
    if (!session?.user || session.user.role !== 'superadmin') {
        throw new Error('No autorizado');
    }
    return session;
}

export async function getAdminStats() {
    await requireSuperadmin();

    const [orgs, users, leads, totalLicenses, usedLicenses] = await Promise.all([
        prisma.organization.count(),
        prisma.user.count(),
        prisma.lead.count(),
        prisma.licenseCode.count(),
        prisma.licenseCode.count({ where: { used: true } }),
    ]);

    return {
        organizations: orgs,
        users,
        leads,
        totalLicenses,
        availableLicenses: totalLicenses - usedLicenses,
    };
}

export async function getAllOrganizations() {
    await requireSuperadmin();

    const orgs = await prisma.organization.findMany({
        include: {
            _count: {
                select: { users: true, leads: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    return orgs.map(org => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
        usersCount: org._count.users,
        leadsCount: org._count.leads,
        createdAt: org.createdAt.toISOString(),
    }));
}

export async function getAllLicenseCodes() {
    await requireSuperadmin();

    const codes = await prisma.licenseCode.findMany({
        include: {
            organization: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' }
    });

    return codes.map(c => ({
        id: c.id,
        code: c.code,
        used: c.used,
        usedAt: c.usedAt?.toISOString() || null,
        usedByEmail: c.usedByEmail,
        organizationName: c.organization?.name || null,
        createdAt: c.createdAt.toISOString(),
    }));
}

export async function generateLicenseCodes(count: number) {
    await requireSuperadmin();

    if (count < 1 || count > 50) {
        return { success: false, error: 'Cantidad debe ser entre 1 y 50', codes: [] };
    }

    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
        const parts = [];
        for (let j = 0; j < 4; j++) {
            parts.push(crypto.randomBytes(2).toString('hex').toUpperCase());
        }
        codes.push(parts.join('-'));
    }

    await prisma.licenseCode.createMany({
        data: codes.map(code => ({ code }))
    });

    return { success: true, codes };
}
