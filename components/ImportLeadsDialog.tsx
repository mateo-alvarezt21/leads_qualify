'use client';

import { useState, useRef } from 'react';
import { importLeads, ImportRow } from '@/app/actions/leads';
import { Upload, X, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const LEAD_FIELDS = [
    { value: 'name',    label: 'Nombre' },
    { value: 'email',   label: 'Email' },
    { value: 'phone',   label: 'Teléfono' },
    { value: 'company', label: 'Empresa' },
    { value: 'role',    label: 'Cargo' },
    { value: 'city',    label: 'Ciudad' },
    { value: 'address', label: 'Dirección' },
    { value: 'source',  label: 'Fuente' },
    { value: 'skip',    label: '— Ignorar —' },
];

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length === 0) return { headers: [], rows: [] };

    const parseRow = (line: string): string[] => {
        const fields: string[] = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') {
                if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
                else { inQuotes = !inQuotes; }
            } else if (ch === ',' && !inQuotes) {
                fields.push(current.trim());
                current = '';
            } else {
                current += ch;
            }
        }
        fields.push(current.trim());
        return fields;
    };

    return { headers: parseRow(lines[0]), rows: lines.slice(1).map(parseRow) };
}

function autoDetect(header: string): string {
    const h = header.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (['name', 'nombre', 'full name', 'nombre completo'].some(k => h.includes(k))) return 'name';
    if (['email', 'correo', 'e-mail', 'mail'].some(k => h.includes(k))) return 'email';
    if (['phone', 'telefono', 'cel', 'celular', 'movil', 'whatsapp', 'tel'].some(k => h.includes(k))) return 'phone';
    if (['company', 'empresa', 'compania', 'negocio', 'organizacion'].some(k => h.includes(k))) return 'company';
    if (['role', 'cargo', 'position', 'puesto', 'titulo'].some(k => h.includes(k))) return 'role';
    if (['city', 'ciudad', 'municipio'].some(k => h.includes(k))) return 'city';
    if (['address', 'direccion', 'domicilio'].some(k => h.includes(k))) return 'address';
    if (['source', 'fuente', 'origen', 'canal'].some(k => h.includes(k))) return 'source';
    return 'skip';
}

type Step = 'idle' | 'mapping' | 'importing' | 'done';

interface Result { imported: number; errors: number; }

export function ImportLeadsDialog() {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<Step>('idle');
    const [fileName, setFileName] = useState('');
    const [headers, setHeaders] = useState<string[]>([]);
    const [rows, setRows] = useState<string[][]>([]);
    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [scoreWithAI, setScoreWithAI] = useState(false);
    const [result, setResult] = useState<Result | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const reset = () => {
        setStep('idle');
        setFileName('');
        setHeaders([]);
        setRows([]);
        setMapping({});
        setScoreWithAI(false);
        setResult(null);
        setError(null);
    };

    const close = () => { setOpen(false); reset(); };

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFileName(file.name);
        setError(null);

        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target?.result as string;
            const { headers: h, rows: r } = parseCSV(text);
            if (h.length === 0) { setError('El archivo está vacío o no tiene encabezados.'); return; }
            if (r.length === 0) { setError('El archivo no tiene filas de datos.'); return; }
            const initialMapping: Record<string, string> = {};
            h.forEach(col => { initialMapping[col] = autoDetect(col); });
            setHeaders(h);
            setRows(r);
            setMapping(initialMapping);
            setStep('mapping');
        };
        reader.readAsText(file, 'UTF-8');
        e.target.value = '';
    };

    const dataRows = rows.filter(r => r.some(c => c.trim()));
    const nameColMapped = Object.values(mapping).includes('name');

    const handleImport = async () => {
        if (!nameColMapped) { setError('Debes mapear al menos la columna "Nombre".'); return; }

        setStep('importing');
        setError(null);

        const importRows: ImportRow[] = dataRows.map(row => {
            const lead: ImportRow = { name: '' };
            headers.forEach((col, idx) => {
                const field = mapping[col];
                if (field && field !== 'skip') {
                    const val = (row[idx] || '').trim();
                    if (val) lead[field] = val;
                }
            });
            if (!lead.name) lead.name = 'Sin nombre';
            return lead;
        });

        const res = await importLeads(importRows, scoreWithAI);
        setResult({ imported: res.imported, errors: res.errors });
        setStep('done');
    };

    const previewRows = dataRows.slice(0, 4);

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="flex items-center justify-center gap-2 px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                title="Importar leads desde CSV"
            >
                <Upload size={18} />
                <span className="hidden sm:inline">Importar</span>
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col">

                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-900 z-10">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <Upload size={18} className="text-brand" /> Importar Leads desde CSV
                            </h2>
                            <button onClick={close} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6 flex-1 space-y-6">

                            {/* ── Step: idle ── */}
                            {step === 'idle' && (
                                <div>
                                    {error && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded px-3 py-2 mb-4">{error}</p>}
                                    <div
                                        onClick={() => fileRef.current?.click()}
                                        className="border-2 border-dashed border-zinc-300 dark:border-zinc-600 rounded-xl p-12 text-center cursor-pointer hover:border-brand hover:bg-brand/5 transition-colors"
                                    >
                                        <FileText size={40} className="mx-auto mb-3 text-zinc-300 dark:text-zinc-600" />
                                        <p className="font-medium text-zinc-700 dark:text-zinc-300">Haz clic para seleccionar un archivo CSV</p>
                                        <p className="text-sm text-zinc-400 mt-1">La primera fila debe ser el encabezado de columnas</p>
                                    </div>
                                    <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" />
                                </div>
                            )}

                            {/* ── Step: mapping ── */}
                            {step === 'mapping' && (
                                <>
                                    <div className="flex items-center gap-2 text-sm text-zinc-500">
                                        <FileText size={15} className="text-brand" />
                                        <span className="font-medium text-zinc-700 dark:text-zinc-300">{fileName}</span>
                                        <span>— {dataRows.length} filas detectadas</span>
                                        <button onClick={reset} className="ml-auto text-xs text-zinc-400 hover:text-red-500 flex items-center gap-1 transition-colors">
                                            <X size={13} /> Cambiar archivo
                                        </button>
                                    </div>

                                    {error && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded px-3 py-2">{error}</p>}

                                    {/* Column mapping */}
                                    <div>
                                        <h3 className="text-sm font-semibold mb-3">Mapeo de columnas</h3>
                                        <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                                                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-zinc-500 uppercase">Columna CSV</th>
                                                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-zinc-500 uppercase">Ejemplo</th>
                                                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-zinc-500 uppercase">Campo de Lead</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                                    {headers.map((col, i) => (
                                                        <tr key={col} className="bg-white dark:bg-zinc-900">
                                                            <td className="px-4 py-2.5 font-medium">{col}</td>
                                                            <td className="px-4 py-2.5 text-zinc-400 text-xs max-w-[160px] truncate">
                                                                {rows[0]?.[i] || '—'}
                                                            </td>
                                                            <td className="px-4 py-2.5">
                                                                <select
                                                                    value={mapping[col] || 'skip'}
                                                                    onChange={e => setMapping(m => ({ ...m, [col]: e.target.value }))}
                                                                    className={`w-full text-sm p-1.5 border rounded bg-white dark:bg-zinc-900 focus:border-brand outline-none ${
                                                                        mapping[col] === 'name' ? 'border-brand text-brand' : 'border-zinc-200 dark:border-zinc-700'
                                                                    }`}
                                                                >
                                                                    {LEAD_FIELDS.map(f => (
                                                                        <option key={f.value} value={f.value}>{f.label}</option>
                                                                    ))}
                                                                </select>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        {!nameColMapped && (
                                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5">⚠ Mapea al menos una columna como "Nombre" para continuar.</p>
                                        )}
                                    </div>

                                    {/* Preview */}
                                    {previewRows.length > 0 && (
                                        <div>
                                            <h3 className="text-sm font-semibold mb-3">Vista previa ({previewRows.length} de {dataRows.length} filas)</h3>
                                            <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-700 rounded-lg">
                                                <table className="w-full text-xs">
                                                    <thead>
                                                        <tr className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                                                            {headers.filter(col => mapping[col] !== 'skip').map(col => (
                                                                <th key={col} className="px-3 py-2 text-left font-semibold text-zinc-500 whitespace-nowrap">
                                                                    {LEAD_FIELDS.find(f => f.value === mapping[col])?.label || col}
                                                                </th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                                        {previewRows.map((row, ri) => (
                                                            <tr key={ri} className="bg-white dark:bg-zinc-900">
                                                                {headers.filter(col => mapping[col] !== 'skip').map((col, ci) => (
                                                                    <td key={ci} className="px-3 py-2 text-zinc-600 dark:text-zinc-400 max-w-[140px] truncate">
                                                                        {row[headers.indexOf(col)] || '—'}
                                                                    </td>
                                                                ))}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {/* Options */}
                                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-lg border border-zinc-200 dark:border-zinc-700">
                                        <label className="flex items-start gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={scoreWithAI}
                                                onChange={e => setScoreWithAI(e.target.checked)}
                                                className="mt-0.5 w-4 h-4 accent-brand"
                                            />
                                            <div>
                                                <span className="text-sm font-medium">Calificar con IA</span>
                                                <p className="text-xs text-zinc-500 mt-0.5">
                                                    Más lento (requiere OpenAI por cada lead). Sin marcar, los leads se importan con puntaje 0 y estado "Nuevo".
                                                    {scoreWithAI && dataRows.length > 100 && (
                                                        <span className="text-amber-600 dark:text-amber-400"> ⚠ Máximo 100 leads con IA ({dataRows.length} detectados, se procesarán los primeros 100).</span>
                                                    )}
                                                </p>
                                            </div>
                                        </label>
                                    </div>

                                    <div className="flex justify-end gap-3">
                                        <button onClick={close} className="px-4 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={handleImport}
                                            disabled={!nameColMapped}
                                            className="flex items-center gap-2 px-5 py-2 text-sm bg-brand text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 font-medium"
                                        >
                                            <Upload size={16} />
                                            Importar {dataRows.length} leads
                                        </button>
                                    </div>
                                </>
                            )}

                            {/* ── Step: importing ── */}
                            {step === 'importing' && (
                                <div className="text-center py-12">
                                    <Loader2 size={40} className="animate-spin text-brand mx-auto mb-4" />
                                    <p className="font-medium text-zinc-700 dark:text-zinc-300">Importando leads...</p>
                                    <p className="text-sm text-zinc-400 mt-1">
                                        {scoreWithAI ? 'Calificando con IA. Esto puede tardar unos minutos.' : 'Procesando el archivo.'}
                                    </p>
                                </div>
                            )}

                            {/* ── Step: done ── */}
                            {step === 'done' && result && (
                                <div className="text-center py-10">
                                    {result.errors === 0
                                        ? <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
                                        : <AlertCircle size={48} className="text-amber-500 mx-auto mb-4" />
                                    }
                                    <h3 className="text-xl font-semibold mb-2">Importación completada</h3>
                                    <div className="flex justify-center gap-6 mt-4">
                                        <div className="text-center">
                                            <div className="text-3xl font-bold text-green-600">{result.imported}</div>
                                            <div className="text-sm text-zinc-500">importados</div>
                                        </div>
                                        {result.errors > 0 && (
                                            <div className="text-center">
                                                <div className="text-3xl font-bold text-red-500">{result.errors}</div>
                                                <div className="text-sm text-zinc-500">errores</div>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={close}
                                        className="mt-8 px-6 py-2 bg-brand text-white rounded-lg hover:bg-amber-600 transition-colors font-medium"
                                    >
                                        Cerrar
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
