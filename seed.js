const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const email = process.env.SEED_ADMIN_EMAIL || 'admin@leadquality.com';
    const password = process.env.SEED_ADMIN_PASSWORD;
    if (!password) {
        console.error('Error: SEED_ADMIN_PASSWORD environment variable is required');
        process.exit(1);
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        // Create default organization
        const org = await prisma.organization.upsert({
            where: { slug: 'default-org' },
            update: {},
            create: {
                name: 'Default Organization',
                slug: 'default-org'
            }
        });

        const user = await prisma.user.upsert({
            where: { email },
            update: {
                password: hashedPassword,
                role: 'superadmin',
                organizationId: org.id
            },
            create: {
                email,
                name: process.env.SEED_ADMIN_NAME || 'Admin',
                password: hashedPassword,
                role: 'superadmin',
                organizationId: org.id
            },
        });
        console.log('Admin user created:', user.email);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
