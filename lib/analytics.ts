import { prisma } from './prisma';

export interface AnalyticsData {
    conversionByScore: { range: string; rate: number; total: number; won: number }[];
    statusDistribution: { name: string; value: number; color: string }[];
    sourceDistribution: { name: string; value: number }[];
    growth: { date: string; count: number }[];
}

export async function getAnalyticsData(): Promise<AnalyticsData> {
    // 1. Fetch all leads with relevant fields to minimize DB calls
    const leads = await prisma.lead.findMany({
        select: {
            id: true,
            initialScore: true,
            status: true,
            source: true,
            createdAt: true
        }
    });

    // --- A. Conversion vs Quality (Score Ranges) ---
    const ranges = [
        { min: 0, max: 20, label: '0-20' },
        { min: 21, max: 40, label: '21-40' },
        { min: 41, max: 60, label: '41-60' },
        { min: 61, max: 80, label: '61-80' },
        { min: 81, max: 100, label: '81-100' },
    ];

    const conversionByScore = ranges.map(range => {
        const leadsInRange = leads.filter(l => l.initialScore >= range.min && l.initialScore <= range.max);
        const total = leadsInRange.length;
        const won = leadsInRange.filter(l => l.status === 'Ganado').length;
        const rate = total > 0 ? (won / total) * 100 : 0;

        return {
            range: range.label,
            rangeName: `${range.min}-${range.max}`,
            rate: parseFloat(rate.toFixed(1)),
            total,
            won
        };
    });

    // --- B. Status Distribution ---
    // Count by status
    const statusCounts: Record<string, number> = {};
    leads.forEach(l => {
        statusCounts[l.status] = (statusCounts[l.status] || 0) + 1;
    });

    const statusColors: Record<string, string> = {
        'Pendiente': '#a855f7', // purple-500
        'Nuevo': '#3b82f6', // blue-500
        'Contactado': '#eab308', // yellow-500
        'Ganado': '#22c55e', // green-500
        'Perdido': '#ef4444', // red-500
    };

    const statusDistribution = Object.keys(statusCounts).map(status => ({
        name: status,
        value: statusCounts[status],
        color: statusColors[status] || '#9ca3af' // gray-400 default
    }));

    // --- C. Source Distribution ---
    const sourceCounts: Record<string, number> = {};
    leads.forEach(l => {
        const src = l.source || 'Desconocido';
        sourceCounts[src] = (sourceCounts[src] || 0) + 1;
    });

    const sourceDistribution = Object.keys(sourceCounts)
        .map(source => ({ name: source, value: sourceCounts[source] }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5); // Top 5 sources

    // --- D. Growth (Last 30 days) ---
    const growthMap: Record<string, number> = {};
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    // Initialize map with 0s for the last 30 days
    for (let d = 0; d < 30; d++) {
        const date = new Date();
        date.setDate(now.getDate() - d);
        const dateString = date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
        // We use a slightly different key for sorting, but for simplicity let's rely on array reverse later
        // actually let's use ISO date key for mapping, and formatted for display
    }

    // Simpler approach for growth: just map existing leads
    // Note: This might miss days with 0 leads if we just map leads, but for now it's okay.
    // Let's do it properly: Key = YYYY-MM-DD

    const last30DaysLeads = leads.filter(l => new Date(l.createdAt) >= thirtyDaysAgo);

    last30DaysLeads.forEach(l => {
        const date = new Date(l.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
        growthMap[date] = (growthMap[date] || 0) + 1;
    });

    // Convert to array and sort (simple version)
    // For a perfect chart we would fill in the gaps, but let's send what we have first.
    // To make it look nice, let's ensure at least we return the data sorted by date.

    // Better: Generate the last 7 days keys strictly
    const growth = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
        growth.push({
            date: key,
            count: growthMap[key] || 0
        });
    }

    return {
        conversionByScore,
        statusDistribution,
        sourceDistribution,
        growth
    };
}
