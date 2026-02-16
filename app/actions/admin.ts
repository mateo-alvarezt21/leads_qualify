'use server'

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getAnalyticsData } from '@/lib/analytics';
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

export async function deleteOrganization(orgId: string, confirmName: string) {
    await requireSuperadmin();

    const org = await prisma.organization.findUnique({
        where: { id: orgId },
        select: { name: true },
    });

    if (!org) {
        return { success: false, error: 'Organización no encontrada' };
    }

    if (org.name !== confirmName) {
        return { success: false, error: 'El nombre no coincide' };
    }

    // Cascade delete: Prisma schema has onDelete: Cascade for users, leads, settings, whatsapp instances
    // License codes need to be unlinked since they use SetNull
    await prisma.$transaction([
        prisma.licenseCode.updateMany({
            where: { organizationId: orgId },
            data: { organizationId: null },
        }),
        prisma.organization.delete({
            where: { id: orgId },
        }),
    ]);

    return { success: true };
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

export async function getOrganizationDetail(orgId: string) {
    await requireSuperadmin();

    const org = await prisma.organization.findUnique({
        where: { id: orgId },
        include: {
            _count: {
                select: { users: true, leads: true, whatsappInstances: true }
            },
            users: {
                select: { id: true, name: true, email: true, role: true },
                orderBy: { createdAt: 'desc' }
            },
            leads: {
                select: { id: true, initialScore: true, status: true, createdAt: true }
            }
        }
    });

    if (!org) return null;

    // Calculate average initial score
    const totalLeads = org.leads.length;
    const avgInitialScore = totalLeads > 0
        ? Math.round(org.leads.reduce((sum, l) => sum + l.initialScore, 0) / totalLeads)
        : 0;

    // Calculate average current score (with decay for 'Nuevo' leads)
    const now = Date.now();
    const avgCurrentScore = totalLeads > 0
        ? Math.round(org.leads.reduce((sum, l) => {
            let score = l.initialScore;
            if (l.status === 'Nuevo') {
                const days = Math.floor((now - new Date(l.createdAt).getTime()) / (1000 * 3600 * 24));
                score = Math.max(0, l.initialScore - days * 5);
            }
            return sum + score;
        }, 0) / totalLeads)
        : 0;

    // Temperature distribution
    const ranges = [
        { label: '0-20', min: 0, max: 20 },
        { label: '21-40', min: 21, max: 40 },
        { label: '41-60', min: 41, max: 60 },
        { label: '61-80', min: 61, max: 80 },
        { label: '81-100', min: 81, max: 100 },
    ];

    const temperatureDistribution = ranges.map(range => {
        const count = org.leads.filter(l => {
            let score = l.initialScore;
            if (l.status === 'Nuevo') {
                const days = Math.floor((now - new Date(l.createdAt).getTime()) / (1000 * 3600 * 24));
                score = Math.max(0, l.initialScore - days * 5);
            }
            return score >= range.min && score <= range.max;
        }).length;
        return { range: range.label, count };
    });

    const temperatureDistributionInitial = ranges.map(range => {
        const count = org.leads.filter(l =>
            l.initialScore >= range.min && l.initialScore <= range.max
        ).length;
        return { range: range.label, count };
    });

    // Get analytics data for charts
    const analytics = await getAnalyticsData(orgId);

    return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        brandColor: org.brandColor,
        logo: org.logo,
        appNameFirst: org.appNameFirst,
        appNameSecond: org.appNameSecond,
        createdAt: org.createdAt.toISOString(),
        usersCount: org._count.users,
        leadsCount: org._count.leads,
        whatsappCount: org._count.whatsappInstances,
        avgInitialScore,
        avgCurrentScore,
        temperatureDistribution,
        temperatureDistributionInitial,
        users: org.users.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
        })),
        analytics,
    };
}

export async function updateOrgAppName(orgId: string, appNameFirst: string, appNameSecond: string) {
    await requireSuperadmin();

    await prisma.organization.update({
        where: { id: orgId },
        data: {
            appNameFirst: appNameFirst.trim() || null,
            appNameSecond: appNameSecond.trim() || null,
        },
    });

    return { success: true };
}
