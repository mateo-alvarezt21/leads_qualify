'use client'

import { useState } from 'react';
import { generateLicenseCodes } from '@/app/actions/admin';
import { Plus, X, Copy, Check, Loader2 } from 'lucide-react';

export function GenerateLicenseButton({ onGenerated }: { onGenerated?: () => void }) {
    const [open, setOpen] = useState(false);
    const [count, setCount] = useState(5);
    const [loading, setLoading] = useState(false);
    const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
    const [copied, setCopied] = useState(false);

    const handleGenerate = async () => {
        setLoading(true);
        const res = await generateLicenseCodes(count);
        setLoading(false);
        if (res.success) {
            setGeneratedCodes(res.codes);
            onGenerated?.();
        }
    };

    const copyAll = () => {
        navigator.clipboard.writeText(generatedCodes.join('\n'));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const close = () => {
        setOpen(false);
        setGeneratedCodes([]);
    };

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 bg-brand hover:bg-amber-600 text-white px-4 py-2 rounded transition-colors font-medium text-sm"
            >
                <Plus size={16} /> Generar Licencias
            </button>

            {open && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold">Generar Códigos de Licencia</h3>
                            <button onClick={close} className="text-zinc-400 hover:text-zinc-600">
                                <X size={20} />
                            </button>
                        </div>

                        {generatedCodes.length === 0 ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Cantidad</label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={50}
                                        value={count}
                                        onChange={e => setCount(Number(e.target.value))}
                                        className="w-full border border-zinc-300 dark:border-zinc-700 rounded px-3 py-2 bg-white dark:bg-black outline-none focus:border-brand"
                                    />
                                </div>
                                <button
                                    onClick={handleGenerate}
                                    disabled={loading}
                                    className="w-full bg-brand hover:bg-amber-600 text-white py-2.5 rounded font-medium flex justify-center items-center gap-2"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={18} /> : 'Generar'}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3 max-h-60 overflow-y-auto">
                                    {generatedCodes.map((code, i) => (
                                        <div key={i} className="font-mono text-sm py-1 border-b border-zinc-200 dark:border-zinc-700 last:border-0">
                                            {code}
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={copyAll}
                                    className="w-full border border-zinc-300 dark:border-zinc-700 py-2.5 rounded font-medium flex justify-center items-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    {copied ? <><Check size={16} /> Copiado</> : <><Copy size={16} /> Copiar Todos</>}
                                </button>
                                <button
                                    onClick={close}
                                    className="w-full bg-brand hover:bg-amber-600 text-white py-2.5 rounded font-medium"
                                >
                                    Cerrar
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
