const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const email = 'nelsondcarvajal@gmail.com';
    const password = 'Lancelot.012025';
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
                role: 'admin',
                organizationId: org.id
            },
            create: {
                email,
                name: 'Nelson Carvajal',
                password: hashedPassword,
                role: 'admin',
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
