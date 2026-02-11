const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding analytics data...');

    const sources = ['Google Ads', 'Facebook Ads', 'Referido', 'Web Orgánica', 'LinkedIn'];
    const statuses = ['Nuevo', 'Contactado', 'Ganado', 'Perdido', 'Perdido']; // Double weight on Perdido/Ganado for realism?

    // Create 50 dummy leads distributed over the last 30 days
    for (let i = 0; i < 50; i++) {
        const daysAgo = Math.floor(Math.random() * 30);
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);

        const source = sources[Math.floor(Math.random() * sources.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];

        // Correlate score with status roughly
        let score = Math.floor(Math.random() * 100);
        if (status === 'Ganado') score = Math.min(100, Math.max(70, score + 20)); // Boost score for won
        if (status === 'Perdido') score = Math.max(0, Math.min(60, score - 10)); // Lower score for lost

        await prisma.lead.create({
            data: {
                name: `Lead Histórico ${i + 1}`,
                email: `lead${i}@test.com`,
                phone: `+1234567${i}`,
                company: `Empresa ${i}`,
                role: 'Gerente',
                source: source,
                status: status,
                initialScore: score,
                notes: 'Generado automáticamente para pruebas de analítica.',
                rawData: '{}',
                createdAt: date
            }
        });
    }

    console.log('✅ Analytics data seeded!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
