import OpenAI from 'openai';

// Lazy initialization to avoid build-time errors
let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
    if (!openai) {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY environment variable is not set');
        }
        openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    return openai;
}

export interface QualificationResult {
    score: number;
    reason: string;
}

export async function qualifyLead(leadData: any, scoringPrompt: string): Promise<QualificationResult> {
    try {
        const client = getOpenAI();
        const response = await client.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `Eres un experto en calificación de leads. Tu tarea es analizar los datos de un lead entrante y asignarle una calificación del 1 al 100 basada en los criterios proporcionados.
          
          Criterios de calificación:
          ${scoringPrompt}
          
          Responde EXCLUSIVAMENTE con un objeto JSON con la siguiente estructura:
          {
            "score": number, // Entero del 0 al 100
            "reason": "Breve justificación de la calificación"
          }
          `
                },
                {
                    role: "user",
                    content: JSON.stringify(leadData)
                }
            ],
            response_format: { type: "json_object" }
        });

        const content = response.choices[0].message.content;
        if (!content) throw new Error("No response from AI");

        return JSON.parse(content) as QualificationResult;
    } catch (error) {
        console.error("Error qualifying lead:", error);
        // Fallback in case of error
        return { score: 50, reason: "Error de conexión o análisis con IA - Score por defecto" };
    }
}

