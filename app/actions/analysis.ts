'use server'
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';

import { getSession } from '@/lib/auth';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateAnalysis() {
    const session = await getSession();
    if (!session?.user?.organizationId) return "Unauthorized";

    const leads = await prisma.lead.findMany({
        where: { organizationId: session.user.organizationId }
    });

    if (leads.length === 0) return "No hay suficientes datos para generar un análisis.";

    // Basic stats
    const won = leads.filter((l: any) => l.status === 'Ganado');
    const lost = leads.filter((l: any) => l.status === 'Perdido');

    const avg = (items: any[]) => items.length ? (items.reduce((s, l) => s + l.initialScore, 0) / items.length).toFixed(1) : 0;

    const summary = `
    Total Leads: ${leads.length}
    Ganados: ${won.length} (Promedio Score: ${avg(won)})
    Perdidos: ${lost.length} (Promedio Score: ${avg(lost)})
    
    Por favor analiza si los scores se correlacionan con el éxito.
    Si hay leads ganados con bajo score o perdidos con alto score, sugiere ajustes a los criterios.
  `;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: "Eres un analista de negocios experto. Tu objetivo es mejorar la conversión de ventas. Analiza el rendimiento del sistema de calificación y da 3 sugerencias concretas para mejorar el Prompt de calificación."
                },
                { role: "user", content: summary }
            ]
        });

        return response.choices[0].message.content || "No se pudo generar análisis.";
    } catch (e) {
        console.error(e);
        return "Error al conectar con el servicio de IA.";
    }
}
