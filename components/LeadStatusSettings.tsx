'use client';

import { useState } from 'react';
import { Prisma } from '@prisma/client';
import {
    createLeadStatus, updateLeadStatus, deleteLeadStatus,
    createStatusTrigger, updateStatusTrigger, deleteStatusTrigger,
} from '@/app/actions/leadStatuses';
import {
    Plus, Pencil, Trash2, Check, X, Loader2,
    Webhook, ChevronDown, ChevronRight, Info,
} from 'lucide-react';

type LeadStatusWithTriggers = Prisma.LeadStatusGetPayload<{ include: { triggers: true } }>;
type StatusTrigger = LeadStatusWithTriggers['triggers'][number];

const PRESET_COLORS = [
    '#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981',
    '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#6b7280',
];

const PAYLOAD_FIELDS = [
    'id', 'name', 'email', 'phone', 'company', 'role',
    'city', 'address', 'status', 'source', 'initialScore', 'notes', 'createdAt', 'rawData',
];

const PAYLOAD_FIELD_LABELS: Record<string, string> = {
    id: 'ID', name: 'Nombre', email: 'Email', phone: 'Teléfono',
    company: 'Empresa', role: 'Cargo', city: 'Ciudad', address: 'Dirección',
    status: 'Estado', source: 'Fuente', initialScore: 'Puntaje',
    notes: 'Análisis IA', createdAt: 'Fecha', rawData: 'Datos extra',
};

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
    return (
        <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map(c => (
                    <button
                        key={c}
                        type="button"
                        onClick={() => onChange(c)}
                        className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${value === c ? 'border-zinc-800 dark:border-white scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: c }}
                    />
                ))}
            </div>
            <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full border border-zinc-300 dark:border-zinc-600 shrink-0" style={{ backgroundColor: value }} />
                <input
                    type="text"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder="#3b82f6"
                    className="w-28 text-xs font-mono p-1.5 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900 focus:border-brand outline-none"
                />
            </div>
        </div>
    );
}

function TriggerRow({
    trigger,
    onToggle,
    onDelete,
}: {
    trigger: StatusTrigger;
    onToggle: (id: string, enabled: boolean) => void;
    onDelete: (id: string) => void;
}) {
    const [toggling, setToggling] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleToggle = async () => {
        setToggling(true);
        await onToggle(trigger.id, !trigger.enabled);
        setToggling(false);
    };

    const handleDelete = async () => {
        setDeleting(true);
        await onDelete(trigger.id);
        setDeleting(false);
    };

    const triggerFieldsList: string[] | null = trigger.fields ? (() => { try { return JSON.parse(trigger.fields); } catch { return null; } })() : null;

    return (
        <div className="flex flex-col gap-2 p-2.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center gap-3">
            <Webhook size={14} className="text-brand shrink-0" />
            <span className="flex-1 text-xs font-mono text-zinc-600 dark:text-zinc-400 break-all">{trigger.webhookUrl}</span>
            <button
                onClick={handleToggle}
                disabled={toggling}
                title={trigger.enabled ? 'Desactivar' : 'Activar'}
                className={`shrink-0 text-xs px-2 py-1 rounded font-medium transition-colors ${
                    trigger.enabled
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200'
                        : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-600'
                }`}
            >
                {toggling ? <Loader2 size={12} className="animate-spin" /> : trigger.enabled ? 'ON' : 'OFF'}
            </button>
            <button
                onClick={handleDelete}
                disabled={deleting}
                className="shrink-0 p-1 text-zinc-400 hover:text-red-500 transition-colors"
            >
                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            </button>
            </div>
            {triggerFieldsList && (
                <div className="flex flex-wrap gap-1 pl-5">
                    {triggerFieldsList.map(f => (
                        <span key={f} className="text-[10px] px-1.5 py-0.5 rounded bg-brand/10 text-brand font-mono">
                            {PAYLOAD_FIELD_LABELS[f] || f}
                        </span>
                    ))}
                </div>
            )}
            {!triggerFieldsList && (
                <p className="text-[10px] text-zinc-400 pl-5">Todos los campos</p>
            )}
        </div>
    );
}

interface LeadStatusSettingsProps {
    initialStatuses: LeadStatusWithTriggers[];
}

export function LeadStatusSettings({ initialStatuses }: LeadStatusSettingsProps) {
    const [statuses, setStatuses] = useState<LeadStatusWithTriggers[]>(initialStatuses);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ name: '', color: '' });
    const [showCreate, setShowCreate] = useState(false);
    const [createForm, setCreateForm] = useState({ name: '', color: '#3b82f6' });
    const [expandedTriggers, setExpandedTriggers] = useState<Set<string>>(new Set());
    const [addingTriggerFor, setAddingTriggerFor] = useState<string | null>(null);
    const [triggerUrl, setTriggerUrl] = useState('');
    const [triggerFields, setTriggerFields] = useState<string[] | null>(null); // null = all
    const [saving, setSaving] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [triggerError, setTriggerError] = useState<string | null>(null);

    // ── Helpers ──────────────────────────────────────────────────────────────

    const updateStatusInState = (updated: LeadStatusWithTriggers) => {
        setStatuses(prev => prev.map(s => s.id === updated.id ? updated : s));
    };

    const toggleTriggers = (id: string) => {
        setExpandedTriggers(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    // ── Create status ─────────────────────────────────────────────────────────

    const handleCreate = async () => {
        if (!createForm.name.trim()) { setError('El nombre es obligatorio.'); return; }
        setSaving('create');
        setError(null);
        const res = await createLeadStatus(createForm);
        if (res.success && res.status) {
            setStatuses(prev => [...prev, res.status as LeadStatusWithTriggers]);
            setShowCreate(false);
            setCreateForm({ name: '', color: '#3b82f6' });
        } else {
            setError(res.error || 'Error al crear');
        }
        setSaving(null);
    };

    // ── Edit status ───────────────────────────────────────────────────────────

    const startEdit = (s: LeadStatusWithTriggers) => {
        setShowCreate(false);
        setEditingId(s.id);
        setEditForm({ name: s.name, color: s.color });
        setError(null);
    };

    const handleUpdate = async (id: string) => {
        if (!editForm.name.trim()) { setError('El nombre es obligatorio.'); return; }
        setSaving(id);
        setError(null);
        const res = await updateLeadStatus(id, editForm);
        if (res.success && res.status) {
            updateStatusInState(res.status as LeadStatusWithTriggers);
            setEditingId(null);
        } else {
            setError(res.error || 'Error al actualizar');
        }
        setSaving(null);
    };

    // ── Delete status ─────────────────────────────────────────────────────────

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`¿Eliminar el estado "${name}"? Solo es posible si ningún lead lo usa actualmente.`)) return;
        setDeleting(id);
        const res = await deleteLeadStatus(id);
        if (res.success) {
            setStatuses(prev => prev.filter(s => s.id !== id));
        } else {
            alert(res.error || 'Error al eliminar');
        }
        setDeleting(null);
    };

    // ── Triggers ──────────────────────────────────────────────────────────────

    const handleAddTrigger = async (statusId: string) => {
        if (!triggerUrl.trim()) { setTriggerError('La URL es obligatoria.'); return; }
        try { new URL(triggerUrl); } catch { setTriggerError('URL inválida.'); return; }
        setSaving(`trigger-${statusId}`);
        setTriggerError(null);
        const res = await createStatusTrigger({ statusId, webhookUrl: triggerUrl.trim(), fields: triggerFields });
        if (res.success && res.trigger) {
            setStatuses(prev => prev.map(s =>
                s.id === statusId ? { ...s, triggers: [...s.triggers, res.trigger as StatusTrigger] } : s
            ));
            setAddingTriggerFor(null);
            setTriggerUrl('');
            setTriggerFields(null);
        } else {
            setTriggerError(res.error || 'Error al agregar');
        }
        setSaving(null);
    };

    const handleToggleTrigger = async (triggerId: string, enabled: boolean) => {
        const res = await updateStatusTrigger(triggerId, { enabled });
        if (res.success && res.trigger) {
            setStatuses(prev => prev.map(s => ({
                ...s,
                triggers: s.triggers.map(t => t.id === triggerId ? { ...t, enabled } : t),
            })));
        }
    };

    const handleDeleteTrigger = async (triggerId: string) => {
        const res = await deleteStatusTrigger(triggerId);
        if (res.success) {
            setStatuses(prev => prev.map(s => ({
                ...s,
                triggers: s.triggers.filter(t => t.id !== triggerId),
            })));
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-xl font-semibold">Estados de Lead</h2>
                    <p className="text-sm text-zinc-500 mt-1">
                        Personaliza los estados disponibles para tus leads y configura acciones automáticas al cambiar de estado.
                    </p>
                </div>
                {!showCreate && editingId === null && (
                    <button
                        onClick={() => { setShowCreate(true); setEditingId(null); setError(null); }}
                        className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors shrink-0"
                    >
                        <Plus size={16} /> Nuevo Estado
                    </button>
                )}
            </div>

            {/* Create form */}
            {showCreate && (
                <div className="mb-4 p-4 bg-zinc-50 dark:bg-black rounded-lg border border-zinc-200 dark:border-zinc-700 space-y-4">
                    <h3 className="text-sm font-semibold">Nuevo Estado</h3>
                    {error && <p className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded px-3 py-2">{error}</p>}
                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 mb-1">Nombre *</label>
                        <input
                            autoFocus
                            type="text"
                            value={createForm.name}
                            onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                            placeholder="Ej. Engatuzado"
                            className="w-full text-sm p-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 focus:border-brand outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 mb-2">Color</label>
                        <ColorPicker value={createForm.color} onChange={c => setCreateForm(f => ({ ...f, color: c }))} />
                    </div>
                    <div className="flex gap-2 justify-end">
                        <button onClick={() => { setShowCreate(false); setError(null); }} className="flex items-center gap-1 px-4 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                            <X size={14} /> Cancelar
                        </button>
                        <button onClick={handleCreate} disabled={saving === 'create'} className="flex items-center gap-1 px-4 py-2 text-sm bg-brand text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-60">
                            {saving === 'create' ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                            Crear Estado
                        </button>
                    </div>
                </div>
            )}

            {/* Status list */}
            <div className="space-y-3">
                {statuses.map(status => {
                    const isEditing = editingId === status.id;
                    const triggersExpanded = expandedTriggers.has(status.id);
                    const addingTrigger = addingTriggerFor === status.id;
                    const activeTriggers = status.triggers.filter(t => t.enabled).length;

                    return (
                        <div key={status.id} className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
                            {/* Status row */}
                            <div className="flex items-center gap-3 p-3">
                                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: status.color }} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">{status.name}</span>
                                        {status.isDefault && (
                                            <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-400">predeterminado</span>
                                        )}
                                    </div>
                                </div>

                                {/* Trigger toggle */}
                                <button
                                    onClick={() => toggleTriggers(status.id)}
                                    className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-brand transition-colors px-2 py-1 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800"
                                >
                                    <Webhook size={13} />
                                    <span>{status.triggers.length > 0 ? `${activeTriggers}/${status.triggers.length}` : 'Triggers'}</span>
                                    {triggersExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                                </button>

                                <div className="flex gap-1 shrink-0">
                                    <button
                                        onClick={() => isEditing ? setEditingId(null) : startEdit(status)}
                                        className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-brand transition-colors"
                                        title="Editar"
                                    >
                                        <Pencil size={15} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(status.id, status.name)}
                                        disabled={deleting === status.id}
                                        className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-zinc-400 hover:text-red-500 transition-colors disabled:opacity-50"
                                        title="Eliminar"
                                    >
                                        {deleting === status.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                                    </button>
                                </div>
                            </div>

                            {/* Edit form */}
                            {isEditing && (
                                <div className="p-4 bg-zinc-50 dark:bg-black border-t border-zinc-200 dark:border-zinc-700 space-y-4">
                                    {error && editingId === status.id && (
                                        <p className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded px-3 py-2">{error}</p>
                                    )}
                                    <div>
                                        <label className="block text-xs font-semibold text-zinc-500 mb-1">Nombre</label>
                                        <input
                                            autoFocus
                                            type="text"
                                            value={editForm.name}
                                            onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                                            className="w-full text-sm p-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 focus:border-brand outline-none"
                                        />
                                        {status.isDefault && (
                                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                                                <Info size={11} /> Renombrar actualizará todos los leads con este estado.
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-zinc-500 mb-2">Color</label>
                                        <ColorPicker value={editForm.color} onChange={c => setEditForm(f => ({ ...f, color: c }))} />
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                        <button onClick={() => { setEditingId(null); setError(null); }} className="flex items-center gap-1 px-4 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                                            <X size={14} /> Cancelar
                                        </button>
                                        <button onClick={() => handleUpdate(status.id)} disabled={saving === status.id} className="flex items-center gap-1 px-4 py-2 text-sm bg-brand text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-60">
                                            {saving === status.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                            Guardar
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Triggers panel */}
                            {triggersExpanded && (
                                <div className="border-t border-zinc-200 dark:border-zinc-700 p-4 space-y-3 bg-zinc-50/50 dark:bg-zinc-800/20">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Acciones automáticas</span>
                                        {!addingTrigger && (
                                            <button
                                                onClick={() => { setAddingTriggerFor(status.id); setTriggerUrl(''); setTriggerError(null); }}
                                                className="flex items-center gap-1 text-xs px-2 py-1 bg-brand text-white rounded hover:bg-amber-600 transition-colors"
                                            >
                                                <Plus size={12} /> Agregar webhook
                                            </button>
                                        )}
                                    </div>

                                    {/* Payload reference */}
                                    <div className="p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/40 rounded-lg">
                                        <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1.5 flex items-center gap-1">
                                            <Info size={11} /> Payload enviado al webhook (JSON):
                                        </p>
                                        <p className="text-xs font-mono text-blue-600 dark:text-blue-300 leading-relaxed">
                                            {`{ ${PAYLOAD_FIELDS.join(', ')} }`}
                                        </p>
                                    </div>

                                    {/* Add trigger form */}
                                    {addingTrigger && (
                                        <div className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg space-y-3">
                                            <div>
                                                <label className="block text-xs font-semibold text-zinc-500 mb-1">URL del Webhook (POST)</label>
                                                {triggerError && <p className="text-xs text-red-600 mb-1">{triggerError}</p>}
                                                <input
                                                    autoFocus
                                                    type="url"
                                                    value={triggerUrl}
                                                    onChange={e => setTriggerUrl(e.target.value)}
                                                    placeholder="https://hook.n8n.cloud/webhook/..."
                                                    className="w-full text-sm p-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 focus:border-brand outline-none font-mono"
                                                />
                                            </div>

                                            {/* Field selector */}
                                            <div>
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <label className="text-xs font-semibold text-zinc-500">Campos a enviar</label>
                                                    <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={triggerFields === null}
                                                            onChange={e => setTriggerFields(e.target.checked ? null : [...PAYLOAD_FIELDS])}
                                                            className="w-3.5 h-3.5 accent-brand"
                                                        />
                                                        <span className="text-zinc-500">Todos</span>
                                                    </label>
                                                </div>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                                                    {PAYLOAD_FIELDS.map(field => (
                                                        <label key={field} className={`flex items-center gap-1.5 text-xs cursor-pointer p-1.5 rounded border transition-colors ${
                                                            triggerFields === null || triggerFields.includes(field)
                                                                ? 'border-brand/30 bg-brand/5 text-zinc-700 dark:text-zinc-300'
                                                                : 'border-zinc-200 dark:border-zinc-700 text-zinc-400'
                                                        }`}>
                                                            <input
                                                                type="checkbox"
                                                                checked={triggerFields === null || triggerFields.includes(field)}
                                                                onChange={e => {
                                                                    const base = triggerFields ?? [...PAYLOAD_FIELDS];
                                                                    setTriggerFields(
                                                                        e.target.checked
                                                                            ? [...base, field]
                                                                            : base.filter(f => f !== field)
                                                                    );
                                                                }}
                                                                className="w-3.5 h-3.5 accent-brand"
                                                            />
                                                            <span className="font-mono">{PAYLOAD_FIELD_LABELS[field] || field}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="flex gap-2 justify-end">
                                                <button onClick={() => { setAddingTriggerFor(null); setTriggerError(null); setTriggerFields(null); }} className="flex items-center gap-1 px-3 py-1.5 text-xs border border-zinc-200 dark:border-zinc-700 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                                                    <X size={12} /> Cancelar
                                                </button>
                                                <button onClick={() => handleAddTrigger(status.id)} disabled={saving === `trigger-${status.id}`} className="flex items-center gap-1 px-3 py-1.5 text-xs bg-brand text-white rounded hover:bg-amber-600 transition-colors disabled:opacity-60">
                                                    {saving === `trigger-${status.id}` ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                                    Guardar
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Trigger list */}
                                    {status.triggers.length === 0 && !addingTrigger && (
                                        <p className="text-xs text-zinc-400 text-center py-2">Sin acciones configuradas.</p>
                                    )}
                                    {status.triggers.map(trigger => (
                                        <TriggerRow
                                            key={trigger.id}
                                            trigger={trigger}
                                            onToggle={handleToggleTrigger}
                                            onDelete={handleDeleteTrigger}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
