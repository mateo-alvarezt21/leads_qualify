'use client';

import { useState, useRef } from 'react';
import { CustomField } from '@prisma/client';
import { createCustomField, updateCustomField, deleteCustomField, reorderCustomFields } from '@/app/actions/customFields';
import { Plus, Pencil, Trash2, GripVertical, Check, X, Loader2, Lock, Unlock, Table2 } from 'lucide-react';

interface CustomFieldsSettingsProps {
    initialFields: CustomField[];
}

const FIELD_TYPES = [
    { value: 'text', label: 'Texto' },
    { value: 'number', label: 'Número' },
    { value: 'date', label: 'Fecha' },
    { value: 'select', label: 'Selección' },
    { value: 'boolean', label: 'Sí / No' },
];

const emptyForm = {
    fieldName: '',
    fieldLabel: '',
    fieldType: 'text',
    required: false,
    showAsColumn: false,
};

// Converts a label to a valid snake_case field name
function slugify(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s_]/g, '')
        .replace(/\s+/g, '_')
        .replace(/_{2,}/g, '_')
        .replace(/^([^a-z])/, 'f$1')
        .slice(0, 50);
}

export function CustomFieldsSettings({ initialFields }: CustomFieldsSettingsProps) {
    const [fields, setFields] = useState<CustomField[]>(initialFields);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [fieldNameLocked, setFieldNameLocked] = useState(false);
    const [optionsList, setOptionsList] = useState<string[]>([]);
    const [newOption, setNewOption] = useState('');
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [dragOverId, setDragOverId] = useState<number | null>(null);
    const [draggingId, setDraggingId] = useState<number | null>(null);
    const newOptionRef = useRef<HTMLInputElement>(null);

    const handleLabelChange = (label: string) => {
        setForm(f => ({
            ...f,
            fieldLabel: label,
            ...(!fieldNameLocked && { fieldName: slugify(label) }),
        }));
    };

    const handleCreate = () => {
        setEditingId(null);
        setForm(emptyForm);
        setFieldNameLocked(false);
        setOptionsList([]);
        setNewOption('');
        setError(null);
        setShowForm(true);
    };

    const handleEdit = (field: CustomField) => {
        setShowForm(false);
        setEditingId(field.id);
        setForm({
            fieldName: field.fieldName,
            fieldLabel: field.fieldLabel,
            fieldType: field.fieldType,
            required: field.required,
            showAsColumn: field.showAsColumn,
        });
        setFieldNameLocked(true); // always locked in edit mode
        let parsed: string[] = [];
        try { parsed = JSON.parse(field.options || '[]'); } catch { /* ignore */ }
        setOptionsList(parsed);
        setNewOption('');
        setError(null);
    };

    const handleCancelForm = () => {
        setShowForm(false);
        setEditingId(null);
        setForm(emptyForm);
        setFieldNameLocked(false);
        setOptionsList([]);
        setNewOption('');
        setError(null);
    };

    const addOption = () => {
        const trimmed = newOption.trim();
        if (!trimmed || optionsList.includes(trimmed)) return;
        setOptionsList(prev => [...prev, trimmed]);
        setNewOption('');
        newOptionRef.current?.focus();
    };

    const removeOption = (idx: number) => {
        setOptionsList(prev => prev.filter((_, i) => i !== idx));
    };

    const handleSave = async () => {
        if (!form.fieldLabel) {
            setError('La etiqueta es obligatoria.');
            return;
        }
        if (!form.fieldName) {
            setError('La clave JSON es obligatoria.');
            return;
        }
        if (form.fieldType === 'select' && optionsList.length === 0) {
            setError('Agrega al menos una opción para el campo de selección.');
            return;
        }
        setSaving(true);
        setError(null);

        const payload = {
            fieldName: form.fieldName,
            fieldLabel: form.fieldLabel,
            fieldType: form.fieldType,
            required: form.required,
            showAsColumn: form.showAsColumn,
            options: form.fieldType === 'select' ? JSON.stringify(optionsList) : null,
        };

        if (editingId !== null) {
            const res = await updateCustomField(editingId, payload);
            if (res.success) {
                window.location.reload();
            } else {
                setError(res.error || 'Error al guardar');
                setSaving(false);
            }
        } else {
            const res = await createCustomField(payload);
            if (res.success) {
                window.location.reload();
            } else {
                setError(res.error || 'Error al guardar');
                setSaving(false);
            }
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Eliminar este campo? Los valores existentes se mantendrán en rawData de los leads.')) return;
        setDeleting(id);
        const res = await deleteCustomField(id);
        if (res.success) {
            setFields(prev => prev.filter(f => f.id !== id));
        } else {
            alert(res.error || 'Error al eliminar');
        }
        setDeleting(null);
    };

    // Drag & drop
    const handleDragStart = (id: number) => setDraggingId(id);

    const handleDragOver = (e: React.DragEvent, id: number) => {
        e.preventDefault();
        setDragOverId(id);
    };

    const handleDrop = async (targetId: number) => {
        if (draggingId === null || draggingId === targetId) {
            setDraggingId(null);
            setDragOverId(null);
            return;
        }
        const oldIndex = fields.findIndex(f => f.id === draggingId);
        const newIndex = fields.findIndex(f => f.id === targetId);
        const reordered = [...fields];
        const [moved] = reordered.splice(oldIndex, 1);
        reordered.splice(newIndex, 0, moved);
        setFields(reordered);
        setDraggingId(null);
        setDragOverId(null);
        await reorderCustomFields(reordered.map(f => f.id));
    };

    const renderForm = (isInline = false) => (
        <div className={`space-y-4 ${isInline ? 'mt-3 p-4 bg-zinc-50 dark:bg-black rounded-lg border border-zinc-200 dark:border-zinc-700' : ''}`}>
            {error && (
                <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded px-3 py-2">
                    {error}
                </p>
            )}

            {/* Label — always first */}
            <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1">Nombre del campo *</label>
                <input
                    type="text"
                    value={form.fieldLabel}
                    onChange={e => handleLabelChange(e.target.value)}
                    placeholder="Ej. Presupuesto disponible"
                    className="w-full text-sm p-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 focus:border-brand outline-none"
                    autoFocus
                />
            </div>

            {/* Auto-generated fieldName (clave JSON) with lock toggle */}
            <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1">
                    Clave JSON{' '}
                    <span className="font-normal text-zinc-400">(se usa en el webhook)</span>
                </label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={form.fieldName}
                        onChange={e => {
                            if (!fieldNameLocked || editingId === null) {
                                setForm(f => ({ ...f, fieldName: slugify(e.target.value) }));
                            }
                        }}
                        placeholder="presupuesto_disponible"
                        disabled={editingId !== null || fieldNameLocked}
                        className="flex-1 text-sm p-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 focus:border-brand outline-none font-mono disabled:opacity-60 disabled:bg-zinc-100 dark:disabled:bg-zinc-800"
                    />
                    {editingId === null && (
                        <button
                            type="button"
                            onClick={() => setFieldNameLocked(l => !l)}
                            title={fieldNameLocked ? 'Desbloquear para editar' : 'Bloquear (no auto-generar)'}
                            className="p-2 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-brand transition-colors"
                        >
                            {fieldNameLocked ? <Lock size={16} /> : <Unlock size={16} />}
                        </button>
                    )}
                </div>
                {editingId !== null && (
                    <p className="text-xs text-zinc-400 mt-1">La clave JSON no se puede cambiar después de creado el campo.</p>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Tipo */}
                <div>
                    <label className="block text-xs font-semibold text-zinc-500 mb-1">Tipo</label>
                    <select
                        value={form.fieldType}
                        onChange={e => {
                            setForm(f => ({ ...f, fieldType: e.target.value }));
                            setOptionsList([]);
                        }}
                        className="w-full text-sm p-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 focus:border-brand outline-none"
                    >
                        {FIELD_TYPES.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                    </select>
                </div>

                {/* Checkboxes */}
                <div className="flex flex-col gap-3 pt-5">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={form.required}
                            onChange={e => setForm(f => ({ ...f, required: e.target.checked }))}
                            className="w-4 h-4 accent-brand"
                        />
                        <span className="text-sm font-medium">Campo requerido</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={form.showAsColumn}
                            onChange={e => setForm(f => ({ ...f, showAsColumn: e.target.checked }))}
                            className="w-4 h-4 accent-brand"
                        />
                        <span className="text-sm font-medium flex items-center gap-1">
                            <Table2 size={13} className="text-zinc-400" /> Mostrar como columna en la tabla
                        </span>
                    </label>
                </div>
            </div>

            {/* Options builder for select type */}
            {form.fieldType === 'select' && (
                <div>
                    <label className="block text-xs font-semibold text-zinc-500 mb-2">Opciones de selección</label>
                    <div className="border border-zinc-300 dark:border-zinc-700 rounded-lg overflow-hidden">
                        {optionsList.length > 0 && (
                            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                {optionsList.map((opt, idx) => (
                                    <li key={idx} className="flex items-center justify-between px-3 py-2 bg-white dark:bg-zinc-900 text-sm">
                                        <span>{opt}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeOption(idx)}
                                            className="text-zinc-400 hover:text-red-500 transition-colors p-1"
                                        >
                                            <X size={14} />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                        <div className="flex gap-2 p-2 bg-zinc-50 dark:bg-black">
                            <input
                                ref={newOptionRef}
                                type="text"
                                value={newOption}
                                onChange={e => setNewOption(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addOption(); } }}
                                placeholder="Nueva opción..."
                                className="flex-1 text-sm p-1.5 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-900 focus:border-brand outline-none"
                            />
                            <button
                                type="button"
                                onClick={addOption}
                                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-brand text-white rounded hover:bg-amber-600 transition-colors"
                            >
                                <Plus size={14} /> Agregar
                            </button>
                        </div>
                    </div>
                    {optionsList.length === 0 && (
                        <p className="text-xs text-zinc-400 mt-1">Escribe una opción y presiona Agregar o Enter.</p>
                    )}
                </div>
            )}

            <div className="flex gap-2 justify-end pt-1">
                <button
                    onClick={handleCancelForm}
                    className="flex items-center gap-1 px-4 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                    <X size={14} /> Cancelar
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1 px-4 py-2 text-sm bg-brand text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-60"
                >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    {editingId !== null ? 'Actualizar' : 'Crear Campo'}
                </button>
            </div>
        </div>
    );

    return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-xl font-semibold">Campos Personalizados</h2>
                    <p className="text-sm text-zinc-500 mt-1">
                        Define campos adicionales para tus leads. Los valores llegan por webhook y se muestran en el detalle de cada lead.
                    </p>
                </div>
                {!showForm && editingId === null && (
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors shrink-0"
                    >
                        <Plus size={16} /> Nuevo Campo
                    </button>
                )}
            </div>

            {showForm && renderForm()}

            {fields.length === 0 && !showForm ? (
                <div className="text-center py-10 text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-700 rounded-lg">
                    <Table2 size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Aún no hay campos personalizados.</p>
                    <p className="text-xs mt-1">Haz clic en "Nuevo Campo" para agregar uno.</p>
                </div>
            ) : (
                <div className="space-y-2 mt-4">
                    {fields.map(field => (
                        <div
                            key={field.id}
                            draggable
                            onDragStart={() => handleDragStart(field.id)}
                            onDragOver={e => handleDragOver(e, field.id)}
                            onDrop={() => handleDrop(field.id)}
                            onDragEnd={() => { setDraggingId(null); setDragOverId(null); }}
                            className={`border rounded-lg transition-all ${
                                dragOverId === field.id ? 'border-brand bg-brand/5' : 'border-zinc-200 dark:border-zinc-700'
                            } ${draggingId === field.id ? 'opacity-50' : ''}`}
                        >
                            <div className="flex items-center gap-3 p-3">
                                <div className="cursor-grab text-zinc-400 hover:text-zinc-600 shrink-0" title="Arrastrar para reordenar">
                                    <GripVertical size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-sm font-medium">{field.fieldLabel}</span>
                                        <span className="text-zinc-400 text-xs">→</span>
                                        <span className="font-mono text-xs text-zinc-500">{field.fieldName}</span>
                                        <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                                            {FIELD_TYPES.find(t => t.value === field.fieldType)?.label || field.fieldType}
                                        </span>
                                        {field.required && (
                                            <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-medium">
                                                Requerido
                                            </span>
                                        )}
                                        {field.showAsColumn && (
                                            <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
                                                <Table2 size={10} /> Columna
                                            </span>
                                        )}
                                    </div>
                                    {field.fieldType === 'select' && field.options && (() => {
                                        try {
                                            const opts = JSON.parse(field.options);
                                            return <p className="text-xs text-zinc-400 mt-0.5">{opts.join(' · ')}</p>;
                                        } catch { return null; }
                                    })()}
                                </div>
                                <div className="flex gap-1 shrink-0">
                                    <button
                                        onClick={() => editingId === field.id ? handleCancelForm() : handleEdit(field)}
                                        className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-brand transition-colors"
                                        title="Editar"
                                    >
                                        <Pencil size={15} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(field.id)}
                                        disabled={deleting === field.id}
                                        className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-zinc-400 hover:text-red-500 transition-colors disabled:opacity-50"
                                        title="Eliminar"
                                    >
                                        {deleting === field.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                                    </button>
                                </div>
                            </div>
                            {editingId === field.id && renderForm(true)}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
