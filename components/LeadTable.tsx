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
                return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800';
            case 'Nuevo':
                return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800';
            case 'Contactado':
                return 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800';
            case 'Ganado':
                return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800';
            case 'Perdido':
                return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800';
            default:
                return 'bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-900/20 dark:text-zinc-300 dark:border-zinc-800';
        }
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
            <div className="overflow-hidden border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm bg-white dark:bg-black">
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10">
                            <tr>
                                <th className="p-4 font-medium text-zinc-500 dark:text-zinc-400">
                                    <span className="flex items-center gap-2"><User size={14} /> Prospecto</span>
                                </th>
                                <th className="p-4 font-medium text-zinc-500 dark:text-zinc-400">
                                    <span className="flex items-center gap-2"><Globe size={14} /> Fuente</span>
                                </th>
                                <th className="p-4 font-medium text-zinc-500 dark:text-zinc-400">
                                    <span className="flex items-center gap-2"><Smartphone size={14} /> Linea</span>
                                </th>
                                <th className="p-4 font-medium text-zinc-500 dark:text-zinc-400">
                                    <span className="flex items-center gap-2"><Calendar size={14} /> Fecha</span>
                                </th>
                                <th className="p-4 font-medium text-center text-zinc-500 dark:text-zinc-400">
                                    <span className="flex items-center justify-center gap-2"><Activity size={14} /> Estado</span>
                                </th>
                                <th className="p-4 font-medium text-right text-zinc-500 dark:text-zinc-400">
                                    <span className="flex items-center justify-end gap-2"><Gauge size={14} /> Inicial</span>
                                </th>
                                <th className="p-4 font-medium text-right text-brand">
                                    <span className="flex items-center justify-end gap-2"><Flame size={14} /> Temp.</span>
                                </th>
                                <th className="p-4 font-medium text-center text-zinc-500 dark:text-zinc-400 w-12">

                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-12 text-center text-zinc-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <AlertCircle size={32} className="text-zinc-300" />
                                            No se encontraron leads que coincidan con los filtros.
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(lead => {
                                    return (
                                        <tr key={lead.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors bg-white dark:bg-black group border-l-4 border-l-transparent hover:border-l-brand">
                                            <td className="p-4">
                                                <button
                                                    onClick={() => setSelectedLead(lead)}
                                                    className="text-left outline-none"
                                                >
                                                    <div className="font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-brand transition-colors">{lead.name}</div>
                                                    <div className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                                                        {lead.company && <span className="font-semibold">{lead.company} •</span>}
                                                        {lead.email}
                                                    </div>
                                                </button>
                                            </td>
                                            <td className="p-4">
                                                <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded text-xs border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400">
                                                    {lead.source}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                {lead.whatsappInstance ? (
                                                    <span className="px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded text-xs border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400">
                                                        {lead.whatsappInstance.name}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-zinc-300 dark:text-zinc-600">-</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-zinc-500 whitespace-nowrap text-xs" suppressHydrationWarning>
                                                {new Date(lead.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusClasses(lead.status)}`}>
                                                    {lead.status}
                                                </span>
                                            </td>
                                            <td className="p-4 font-medium text-right text-zinc-400">
                                                {lead.initialScore}%
                                            </td>
                                            <td className={`p-4 font-bold text-right text-lg ${getTempColor(lead.currentScore)}`}>
                                                {lead.currentScore}%
                                            </td>
                                            <td className="p-4 text-center">
                                                <button
                                                    onClick={() => handleDelete(lead.id)}
                                                    disabled={isPending}
                                                    className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50"
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
            </div>

            {selectedLead && (
                <LeadDetailsDialog
                    lead={selectedLead}
                    isOpen={!!selectedLead}
                    onClose={() => setSelectedLead(null)}
                />
            )}

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4 px-2">
                <span className="text-sm text-zinc-500">
                    Mostrando {initialLeads.length} de {totalCount} resultados
                </span>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            const params = new URLSearchParams(window.location.search);
                            params.set('page', (currentPage - 1).toString());
                            window.location.search = params.toString();
                        }}
                        disabled={currentPage <= 1}
                        className="px-3 py-1 border rounded text-sm hover:bg-zinc-50 disabled:opacity-50"
                    >
                        Anterior
                    </button>
                    <span className="text-sm">
                        Página {currentPage} de {totalPages}
                    </span>
                    <button
                        onClick={() => {
                            const params = new URLSearchParams(window.location.search);
                            params.set('page', (currentPage + 1).toString());
                            window.location.search = params.toString();
                        }}
                        disabled={currentPage >= totalPages}
                        className="px-3 py-1 border rounded text-sm hover:bg-zinc-50 disabled:opacity-50"
                    >
                        Siguiente
                    </button>
                </div>
            </div>
        </div>
    );
}
