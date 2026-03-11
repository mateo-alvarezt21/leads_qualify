'use client'

import { useState, useMemo, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lead, CustomField } from '@prisma/client';
import { Search, Download, Filter, X, AlertCircle, Trash2, ChevronRight } from 'lucide-react';
import { AddLeadDialog } from './AddLeadDialog';
import { LeadDetailsDialog } from './LeadDetailsDialog';
import { ImportLeadsDialog } from './ImportLeadsDialog';
import { deleteLead, deleteAllLeads } from '@/app/actions/leads';
import { useLanguage } from '@/lib/i18n';
import { LeadStatus } from '@prisma/client';

type LeadWithInstance = Lead & {
    whatsappInstance?: { id: string; name: string; phone: string | null } | null;
};

interface LeadTableProps {
    initialLeads: LeadWithInstance[];
    totalPages: number;
    currentPage: number;
    totalCount: number;
    customFields?: CustomField[];
    leadStatuses?: LeadStatus[];
}

const formatNumber = (raw: string | number) => {
    const digits = String(raw).replace(/\D/g, '');
    if (!digits) return String(raw);
    return parseInt(digits, 10).toLocaleString('de-DE');
};

export function LeadTable({ initialLeads, totalPages, currentPage, totalCount, customFields = [], leadStatuses = [] }: LeadTableProps) {
    const columnFields = customFields.filter(cf => cf.showAsColumn);
    const router = useRouter();
    const { t } = useLanguage();
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
        if (confirm(t.table.confirmDelete)) {
            startTransition(async () => {
                await deleteLead(leadId);
            });
        }
    };

    const handleDeleteAll = () => {
        if (confirm(t.table.confirmDeleteAll)) {
            startTransition(async () => {
                await deleteAllLeads();
            });
        }
    };

    // Status style helper — uses DB color when available
    const getStatusStyle = (statusName: string): React.CSSProperties => {
        const s = leadStatuses.find(ls => ls.name === statusName);
        if (!s) return {};
        return {
            backgroundColor: `${s.color}20`,
            color: s.color,
            borderColor: `${s.color}40`,
        };
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
            {/* Dashboard Heading */}
            <div className="mb-8">
                <h2 className="text-2xl font-light mb-2">{t.dashboard.title}</h2>
                <p className="text-zinc-500 font-light">{t.dashboard.subtitle}</p>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-col gap-4 mb-6">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="relative w-full md:w-auto flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                        <input
                            placeholder={t.filters.searchPlaceholder}
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
                            <span className="hidden sm:inline">{t.filters.filters}</span>
                        </button>
                        <button
                            onClick={downloadCSV}
                            className="flex items-center justify-center gap-2 px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                        >
                            <Download size={18} />
                            <span className="hidden sm:inline">{t.filters.export}</span>
                        </button>
                        <ImportLeadsDialog />
                        <AddLeadDialog />
                    </div>
                </div>

                {/* Advanced Filters Panel */}
                {showFilters && (
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg grid grid-cols-1 md:grid-cols-4 gap-4 animate-in slide-in-from-top-2">
                        <div>
                            <label className="text-xs font-semibold text-zinc-500 mb-1 block">{t.filters.status}</label>
                            <select
                                className="w-full text-sm p-2 border border-zinc-200 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 focus:border-brand outline-none"
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value)}
                            >
                                <option value="Todos">{t.filters.statusAll}</option>
                                {leadStatuses.map(s => (
                                    <option key={s.id} value={s.name}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-zinc-500 mb-1 block">{t.filters.source}</label>
                            <select
                                className="w-full text-sm p-2 border border-zinc-200 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 focus:border-brand outline-none"
                                value={sourceFilter}
                                onChange={e => setSourceFilter(e.target.value)}
                            >
                                <option value="Todos">{t.filters.sourceAll}</option>
                                {sources.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-zinc-500 mb-1 block">{t.filters.minTemp}</label>
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
                            <label className="text-xs font-semibold text-zinc-500 mb-1 block">{t.filters.maxTemp}</label>
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
                                    title={t.filters.clearFilters}
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
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-border-dark">
                                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider min-w-[200px]">{t.table.prospect}</th>
                                <th className="px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center whitespace-nowrap">{t.table.initialTemp}</th>
                                <th className="px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center whitespace-nowrap">{t.table.currentTemp}</th>
                                <th className="px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{t.table.source}</th>
                                <th className="px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{t.table.line}</th>
                                <th className="px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{t.table.date}</th>
                                {columnFields.map(cf => (
                                    <th key={cf.id} className="px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{cf.fieldLabel}</th>
                                ))}
                                <th className="px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right whitespace-nowrap">{t.table.status}</th>
                                <th className="px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-border-dark">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={8 + columnFields.length} className="px-4 py-16 text-center text-slate-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <AlertCircle size={32} className="text-slate-300 dark:text-slate-600" />
                                            {t.table.noLeads}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(lead => {
                                    let leadRawData: Record<string, unknown> = {};
                                    try { leadRawData = JSON.parse(lead.rawData || '{}'); } catch { /* ignore */ }
                                    return (
                                        <tr
                                            key={lead.id}
                                            role="button"
                                            tabIndex={0}
                                            aria-label={`Ver detalles de ${lead.name}`}
                                            className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"
                                            onClick={() => setSelectedLead(lead)}
                                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedLead(lead); } }}
                                        >
                                            <td className="px-4 py-3 min-w-[200px] max-w-[280px]">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-medium text-xs text-slate-600 dark:text-slate-300 shrink-0">
                                                        {getInitials(lead.name)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="font-semibold text-slate-900 dark:text-white group-hover:text-primary transition-colors flex items-center gap-1 truncate">
                                                            <span className="truncate">{lead.name}</span>
                                                            <ChevronRight size={13} className="opacity-0 group-hover:opacity-60 transition-opacity text-slate-400 shrink-0" />
                                                        </div>
                                                        <div className="text-xs text-slate-500 truncate">
                                                            {lead.company && <span>{lead.company} · </span>}
                                                            {lead.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3">
                                                <div className="flex justify-center">
                                                    <div className="relative w-10 h-10">
                                                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                                            <circle className="stroke-slate-200 dark:stroke-slate-800" cx="18" cy="18" fill="none" r="16" strokeWidth="3.5"></circle>
                                                            <circle className={getScoreStrokeColor(lead.initialScore)} cx="18" cy="18" fill="none" r="16" strokeDasharray={`${lead.initialScore}, 100`} strokeLinecap="round" strokeWidth="3.5"></circle>
                                                        </svg>
                                                        <span className={`absolute inset-0 flex items-center justify-center text-[10px] font-bold ${getScoreTextColor(lead.initialScore)}`}>{lead.initialScore}%</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3">
                                                <div className="flex justify-center">
                                                    <div className="relative w-10 h-10">
                                                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                                            <circle className="stroke-slate-200 dark:stroke-slate-800" cx="18" cy="18" fill="none" r="16" strokeWidth="3.5"></circle>
                                                            <circle className={getScoreStrokeColor(lead.currentScore)} cx="18" cy="18" fill="none" r="16" strokeDasharray={`${lead.currentScore}, 100`} strokeLinecap="round" strokeWidth="3.5"></circle>
                                                        </svg>
                                                        <span className={`absolute inset-0 flex items-center justify-center text-[10px] font-bold ${getScoreTextColor(lead.currentScore)}`}>{lead.currentScore}%</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 max-w-[140px]">
                                                <span
                                                    className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 max-w-full min-w-0"
                                                    title={lead.source}
                                                >
                                                    <span className="truncate">{lead.source}</span>
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 max-w-[120px]">
                                                {lead.whatsappInstance ? (
                                                    <span className="text-xs text-accent font-medium truncate block" title={lead.whatsappInstance.name}>{lead.whatsappInstance.name}</span>
                                                ) : (
                                                    <span className="text-xs text-slate-500">—</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-3 text-slate-500 whitespace-nowrap text-xs" suppressHydrationWarning>
                                                {new Date(lead.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            {columnFields.map(cf => {
                                                const raw = leadRawData[cf.fieldName];
                                                let display = raw !== undefined && raw !== null && raw !== '' ? String(raw) : '—';
                                                if (cf.fieldType === 'number' && raw !== undefined && raw !== null && raw !== '') {
                                                    display = formatNumber(String(raw));
                                                }
                                                if (cf.fieldType === 'boolean') {
                                                    display = raw === true || raw === 'true' ? t.leadDetails.yes : raw === false || raw === 'false' ? t.leadDetails.no : '—';
                                                }
                                                return (
                                                    <td key={cf.id} className="px-3 py-3 max-w-[160px]" title={display !== '—' ? display : undefined}>
                                                        <span className="block text-xs text-slate-600 dark:text-slate-400 truncate">{display}</span>
                                                    </td>
                                                );
                                            })}
                                            <td className="px-3 py-3 text-right">
                                                <span
                                                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border whitespace-nowrap"
                                                    style={getStatusStyle(lead.status)}
                                                >
                                                    {lead.status}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 text-center">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(lead.id); }}
                                                    disabled={isPending}
                                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50 opacity-0 group-hover:opacity-100"
                                                    title={t.table.deleteLead}
                                                >
                                                    <Trash2 size={15} />
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
                <div className="px-4 py-4 border-t border-slate-100 dark:border-border-dark flex items-center justify-between text-sm text-slate-500">
                    <span>{t.table.showing} {initialLeads.length} {t.table.of} {totalCount} {t.table.leads}</span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                const params = new URLSearchParams(window.location.search);
                                params.set('page', (currentPage - 1).toString());
                                router.push(`?${params.toString()}`);
                            }}
                            disabled={currentPage <= 1}
                            className="px-3 py-1.5 border border-slate-200 dark:border-border-dark rounded-md hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-50 transition-colors"
                        >
                            {t.table.previous}
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
                                        router.push(`?${params.toString()}`);
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
                                router.push(`?${params.toString()}`);
                            }}
                            disabled={currentPage >= totalPages}
                            className="px-3 py-1.5 border border-slate-200 dark:border-border-dark rounded-md hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-50 transition-colors"
                        >
                            {t.table.next}
                        </button>
                    </div>
                </div>
            </div>

            {selectedLead && (
                <LeadDetailsDialog
                    lead={selectedLead}
                    isOpen={!!selectedLead}
                    onClose={() => setSelectedLead(null)}
                    customFields={customFields}
                    leadStatuses={leadStatuses}
                />
            )}
        </div>
    );
}
