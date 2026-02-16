'use client'

import { useState, useMemo, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lead } from '@prisma/client';
import { Search, Download, Filter, X, User, Globe, Calendar, Activity, Gauge, Flame, Trash2, AlertCircle, Smartphone } from 'lucide-react';
import { AddLeadDialog } from './AddLeadDialog';
import { LeadDetailsDialog } from './LeadDetailsDialog';
import { deleteLead, deleteAllLeads } from '@/app/actions/leads';

type LeadWithInstance = Lead & {
    whatsappInstance?: { id: string; name: string; phone: string | null } | null;
};

interface LeadTableProps {
    initialLeads: LeadWithInstance[];
    totalPages: number;
    currentPage: number;
    totalCount: number;
}

export function LeadTable({ initialLeads, totalPages, currentPage, totalCount }: LeadTableProps) {
    const router = useRouter();
    const [textFilter, setTextFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('Todos');
    const [sourceFilter, setSourceFilter] = useState('Todos');
    const [minTemp, setMinTemp] = useState('');
    const [maxTemp, setMaxTemp] = useState('');
    const [selectedLead, setSelectedLead] = useState<LeadWithInstance | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [isPending, startTransition] = useTransition();

    // Auto-refresh: poll for new leads every 10 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            router.refresh();
        }, 10_000);
        return () => clearInterval(interval);
    }, [router]);

    // Helper: 0 (Red) -> 100 (Green)
    const getTempColor = (value: number) => {
        if (value >= 80) return 'text-green-600 dark:text-green-400';
        if (value >= 50) return 'text-yellow-600 dark:text-yellow-400';
        return 'text-red-600 dark:text-red-400';
    };

    // Calculate Decay and Sort
    const processedLeads = useMemo(() => {
        return initialLeads.map(lead => {
            let currentScore = lead.initialScore;
            if (lead.status === 'Nuevo') {
                const now = new Date().getTime();
                const created = new Date(lead.createdAt).getTime();
                const days = Math.floor((now - created) / (1000 * 3600 * 24));
                const decay = days * 5;
                currentScore = Math.max(0, lead.initialScore - decay);
            }
            return { ...lead, currentScore };
        });
    }, [initialLeads]);

    // Unique sources for filter
    const sources = Array.from(new Set(initialLeads.map(l => l.source)));

    const filtered = processedLeads.filter(l => {
        const matchesText =
            l.name.toLowerCase().includes(textFilter.toLowerCase()) ||
            (l.email && l.email.toLowerCase().includes(textFilter.toLowerCase()));

        const matchesStatus = statusFilter === 'Todos' || l.status === statusFilter;
        const matchesSource = sourceFilter === 'Todos' || l.source === sourceFilter;

        const min = minTemp ? parseInt(minTemp) : 0;
        const max = maxTemp ? parseInt(maxTemp) : 100;
        const matchesTemp = l.currentScore >= min && l.currentScore <= max;

        return matchesText && matchesStatus && matchesSource && matchesTemp;
    });

    const downloadCSV = () => {
        const headers = "ID,Nombre,Email,Telefono,Empresa,Fuente,Fecha,Temp Inicial,Temp Actual,Estado,Notas\n";
        const rows = filtered.map(l =>
            `${l.id},"${l.name}","${l.email || ''}","${l.phone || ''}","${l.company || ''}","${l.source}","${new Date(l.createdAt).toISOString()}","${l.initialScore}%","${l.currentScore}%","${l.status}","${(l.notes || '').replace(/"/g, '""')}"`
        ).join("\n");

        const blob = new Blob([headers + rows], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `leads_export_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const handleDelete = (leadId: number) => {
        if (confirm('¿Estás seguro de eliminar este lead?')) {
            startTransition(async () => {
                await deleteLead(leadId);
            });
        }
    };

    const handleDeleteAll = () => {
        if (confirm('⚠️ ¿Estás seguro de eliminar TODOS los leads? Esta acción no se puede deshacer.')) {
            startTransition(async () => {
                await deleteAllLeads();
            });
        }
    };

    // Status color helper
    const getStatusClasses = (status: string) => {
        switch (status) {
            case 'Pendiente':
                return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
            case 'Nuevo':
                return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'Contactado':
                return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'Ganado':
                return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'Perdido':
                return 'bg-red-500/10 text-red-500 border-red-500/20';
            default:
                return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
        }
    };

    // Get initials from name
    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    // Get stroke color class based on score
    const getScoreStrokeColor = (score: number) => {
        if (score >= 80) return 'stroke-emerald-500';
        if (score >= 50) return 'stroke-amber-500';
        return 'stroke-red-500';
    };

    const getScoreTextColor = (score: number) => {
        if (score >= 80) return 'text-emerald-500';
        if (score >= 50) return 'text-amber-500';
        return 'text-red-500';
    };

    return (
        <div className="w-full">
            {/* Actions Bar */}
            <div className="flex flex-col gap-4 mb-6">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="relative w-full md:w-auto flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                        <input
                            placeholder="Buscar leads por nombre, email..."
                            className="pl-10 pr-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg w-full bg-white dark:bg-zinc-900 focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all"
                            value={textFilter}
                            onChange={e => setTextFilter(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center justify-center gap-2 px-4 py-2 border rounded transition-colors ${showFilters ? 'bg-brand/10 border-brand text-brand' : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
                        >
                            <Filter size={18} />
                            <span className="hidden sm:inline">Filtros</span>
                        </button>
                        <button
                            onClick={downloadCSV}
                            className="flex items-center justify-center gap-2 px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                        >
                            <Download size={18} />
                            <span className="hidden sm:inline">Exportar</span>
                        </button>
                        <AddLeadDialog />
                    </div>
                </div>

                {/* Advanced Filters Panel */}
                {showFilters && (
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg grid grid-cols-1 md:grid-cols-4 gap-4 animate-in slide-in-from-top-2">
                        <div>
                            <label className="text-xs font-semibold text-zinc-500 mb-1 block">Estado</label>
                            <select
                                className="w-full text-sm p-2 border border-zinc-200 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 focus:border-brand outline-none"
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value)}
                            >
                                <option value="Todos">Todos</option>
                                <option value="Pendiente">Pendiente</option>
                                <option value="Nuevo">Nuevo</option>
                                <option value="Contactado">Contactado</option>
                                <option value="Ganado">Ganado</option>
                                <option value="Perdido">Perdido</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-zinc-500 mb-1 block">Fuente</label>
                            <select
                                className="w-full text-sm p-2 border border-zinc-200 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 focus:border-brand outline-none"
                                value={sourceFilter}
                                onChange={e => setSourceFilter(e.target.value)}
                            >
                                <option value="Todos">Todas</option>
                                {sources.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-zinc-500 mb-1 block">Temp. Mín (%)</label>
                            <input
                                type="number"
                                min="0" max="100"
                                className="w-full text-sm p-2 border border-zinc-200 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 focus:border-brand outline-none"
                                value={minTemp}
                                onChange={e => setMinTemp(e.target.value)}
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-zinc-500 mb-1 block">Temp. Máx (%)</label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    min="0" max="100"
                                    className="w-full text-sm p-2 border border-zinc-200 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 focus:border-brand outline-none"
                                    value={maxTemp}
                                    onChange={e => setMaxTemp(e.target.value)}
                                    placeholder="100"
                                />
                                <button
                                    onClick={() => { setMinTemp(''); setMaxTemp(''); setStatusFilter('Todos'); setSourceFilter('Todos'); }}
                                    className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                                    title="Limpiar filtros"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Table container */}
            <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-border-dark">
                                <th className="px-8 py-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Prospecto</th>
                                <th className="px-8 py-5 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Temp. Inicial</th>
                                <th className="px-8 py-5 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Temp. Actual</th>
                                <th className="px-8 py-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Fuente</th>
                                <th className="px-8 py-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Línea</th>
                                <th className="px-8 py-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Fecha</th>
                                <th className="px-8 py-5 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Estado</th>
                                <th className="px-8 py-5 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right w-12"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-border-dark">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-8 py-16 text-center text-slate-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <AlertCircle size={32} className="text-slate-300 dark:text-slate-600" />
                                            No se encontraron leads que coincidan con los filtros.
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(lead => {
                                    return (
                                        <tr key={lead.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group">
                                            <td className="px-8 py-5">
                                                <button
                                                    onClick={() => setSelectedLead(lead)}
                                                    className="text-left outline-none"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-medium text-slate-600 dark:text-slate-300 shrink-0">
                                                            {getInitials(lead.name)}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{lead.name}</div>
                                                            <div className="text-xs text-slate-500">
                                                                {lead.company && <span>{lead.company} · </span>}
                                                                {lead.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </button>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex justify-center">
                                                    <div className="relative w-14 h-14">
                                                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                                            <circle className="stroke-slate-200 dark:stroke-slate-800" cx="18" cy="18" fill="none" r="16" strokeWidth="3.5"></circle>
                                                            <circle className={getScoreStrokeColor(lead.initialScore)} cx="18" cy="18" fill="none" r="16" strokeDasharray={`${lead.initialScore}, 100`} strokeLinecap="round" strokeWidth="3.5"></circle>
                                                        </svg>
                                                        <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${getScoreTextColor(lead.initialScore)}`}>{lead.initialScore}%</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex justify-center">
                                                    <div className="relative w-14 h-14">
                                                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                                            <circle className="stroke-slate-200 dark:stroke-slate-800" cx="18" cy="18" fill="none" r="16" strokeWidth="3.5"></circle>
                                                            <circle className={getScoreStrokeColor(lead.currentScore)} cx="18" cy="18" fill="none" r="16" strokeDasharray={`${lead.currentScore}, 100`} strokeLinecap="round" strokeWidth="3.5"></circle>
                                                        </svg>
                                                        <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${getScoreTextColor(lead.currentScore)}`}>{lead.currentScore}%</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                                    {lead.source}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5">
                                                {lead.whatsappInstance ? (
                                                    <span className="text-sm text-accent font-medium">{lead.whatsappInstance.name}</span>
                                                ) : (
                                                    <span className="text-sm text-slate-500">—</span>
                                                )}
                                            </td>
                                            <td className="px-8 py-5 text-slate-500 whitespace-nowrap text-sm" suppressHydrationWarning>
                                                {new Date(lead.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusClasses(lead.status)}`}>
                                                    {lead.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <button
                                                    onClick={() => handleDelete(lead.id)}
                                                    disabled={isPending}
                                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50 opacity-0 group-hover:opacity-100"
                                                    title="Eliminar lead"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination inside table card */}
                <div className="px-8 py-4 border-t border-slate-100 dark:border-border-dark flex items-center justify-between text-sm text-slate-500">
                    <span>Mostrando {initialLeads.length} de {totalCount} leads</span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                const params = new URLSearchParams(window.location.search);
                                params.set('page', (currentPage - 1).toString());
                                window.location.search = params.toString();
                            }}
                            disabled={currentPage <= 1}
                            className="px-3 py-1.5 border border-slate-200 dark:border-border-dark rounded-md hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-50 transition-colors"
                        >
                            Anterior
                        </button>
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                            const startPage = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
                            const page = startPage + i;
                            if (page > totalPages) return null;
                            return (
                                <button
                                    key={page}
                                    onClick={() => {
                                        const params = new URLSearchParams(window.location.search);
                                        params.set('page', page.toString());
                                        window.location.search = params.toString();
                                    }}
                                    className={`px-3 py-1.5 border border-slate-200 dark:border-border-dark rounded-md transition-colors ${
                                        page === currentPage
                                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-medium'
                                            : 'hover:bg-slate-50 dark:hover:bg-white/5'
                                    }`}
                                >
                                    {page}
                                </button>
                            );
                        })}
                        <button
                            onClick={() => {
                                const params = new URLSearchParams(window.location.search);
                                params.set('page', (currentPage + 1).toString());
                                window.location.search = params.toString();
                            }}
                            disabled={currentPage >= totalPages}
                            className="px-3 py-1.5 border border-slate-200 dark:border-border-dark rounded-md hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-50 transition-colors"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            </div>

            {selectedLead && (
                <LeadDetailsDialog
                    lead={selectedLead}
                    isOpen={!!selectedLead}
                    onClose={() => setSelectedLead(null)}
                />
            )}
        </div>
    );
}
