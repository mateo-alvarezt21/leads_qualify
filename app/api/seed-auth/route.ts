import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { rateLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
    try {
        // Rate limit: 3 attempts per 10 minutes
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
        const rl = rateLimit(`seed:${ip}`, 3, 10 * 60_000);
        if (!rl.allowed) {
            return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
        }

        // Protect seed endpoint: require SEED_SECRET token or block entirely in production
        const seedSecret = process.env.SEED_SECRET;
        const token = request.nextUrl.searchParams.get('token');

        if (process.env.NODE_ENV === 'production') {
            if (!seedSecret || !token || token !== seedSecret) {
                return NextResponse.json(
                    { success: false, error: 'Forbidden' },
                    { status: 403 }
                );
            }
        }

        // Check if admin user exists
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@leadquality.com';
        const existingUser = await prisma.user.findUnique({
            where: { email: adminEmail }
        });

        if (!existingUser) {
            const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
            const hashedPassword = await bcrypt.hash(adminPassword, 10);

            // Create default organization
            const org = await prisma.organization.upsert({
                where: { slug: 'default-org' },
                update: {},
                create: {
                    name: 'Default Organization',
                    slug: 'default-org'
                }
            });

            await prisma.user.create({
                data: {
                    email: adminEmail,
                    name: 'Admin',
                    password: hashedPassword,
                    role: 'admin',
                    organizationId: org.id
                }
            });

            return NextResponse.json({
                success: true,
                message: 'Database initialized and admin user created',
                note: 'Change the admin password immediately'
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Database already initialized, admin user exists'
        });

    } catch (error) {
        console.error('Seed error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
