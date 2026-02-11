'use client'
import { useState } from 'react';
import { generateAnalysis } from '@/app/actions/analysis';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Loader2 } from 'lucide-react';


export default function AnalysisPage() {
    const [report, setReport] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        setLoading(true);
        const result = await generateAnalysis();
        setReport(result);
        setLoading(false);
    };

    return (
        <main className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 p-8">
            <div className="max-w-4xl mx-auto">
                <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-brand mb-8 transition-colors">
                    <ArrowLeft size={18} /> Volver al Inicio
                </Link>

                <header className="mb-10">
                    <h1 className="text-3xl font-light mb-4 flex items-center gap-3">
                        Análisis de <span className="text-brand font-semibold">Rendimiento</span>
                        <Sparkles className="text-brand" size={24} />
                    </h1>
                    <p className="text-zinc-500">
                        Utiliza la IA para analizar la correlación entre la calificación inicial y el resultado real de ventas.
                        Obtén sugerencias para refinar tu prompt y mejorar la calidad de los leads.
                    </p>
                </header>

                {!report && (
                    <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-12 text-center">
                        <div className="mb-6 mx-auto w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center text-brand">
                            <Sparkles size={32} />
                        </div>
                        <h3 className="text-lg font-medium mb-2">Generar Nuevo Análisis</h3>
                        <p className="text-zinc-500 mb-6 max-w-md mx-auto">
                            Analizaremos tu base de datos de leads históricos para encontrar patrones de éxito y fracaso.
                        </p>
                        <button
                            onClick={handleGenerate}
                            disabled={loading}
                            className="bg-brand text-white px-8 py-3 rounded shadow-lg hover:bg-amber-600 transition-all font-medium inline-flex items-center gap-2"
                        >
                            {loading && <Loader2 className="animate-spin" size={20} />}
                            {loading ? 'Analizando Datos...' : 'Comenzar Análisis IA'}
                        </button>
                    </div>
                )}

                {report && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-white dark:bg-zinc-900 border border-brand/30 rounded-lg p-8 shadow-xl relative">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand to-yellow-300"></div>
                            <h3 className="text-xl font-bold text-brand mb-6 flex items-center gap-2">
                                <Sparkles size={20} /> Resultados del Análisis
                            </h3>
                            <div className="prose dark:prose-invert max-w-none text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                                {report}
                            </div>

                            <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
                                <button
                                    onClick={handleGenerate}
                                    disabled={loading}
                                    className="text-sm text-zinc-500 hover:text-brand underline"
                                >
                                    {loading ? 'Regenerando...' : 'Regenerar Análisis'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
