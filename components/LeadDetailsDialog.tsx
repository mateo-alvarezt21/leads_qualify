'use client'

import { useState } from 'react';
import { Lead } from '@prisma/client';
import { updateLead } from '@/app/actions/leads';
import { X, User, Mail, Phone, Building2, Briefcase, MapPin, Save, Loader2, MessageSquare } from 'lucide-react';

interface LeadDetailsDialogProps {
    lead: Lead;
    isOpen: boolean;
    onClose: () => void;
}

export function LeadDetailsDialog({ lead, isOpen, onClose }: LeadDetailsDialogProps) {
    const [formData, setFormData] = useState({
        name: lead.name,
        email: lead.email || '',
        phone: lead.phone || '',
        company: lead.company || '',
        role: lead.role || '',
        address: lead.address || '',
        city: lead.city || '',
        status: lead.status
    });
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSave = async () => {
        setLoading(true);
        await updateLead(lead.id, formData);
        setLoading(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-zinc-900 border border-brand/50 rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col">

                {/* Header */}
                <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center sticky top-0 bg-white dark:bg-zinc-900 z-10">
                    <div>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{formData.name}</h2>
                        <p className="text-sm text-zinc-500">ID: #{lead.id} • Fuente: {lead.source}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Sidebar Info - Score & Status */}
                    <div className="space-y-6">
                        <div className="bg-zinc-50 dark:bg-black p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 text-center">
                            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-2">Temperatura</span>
                            <div className={`text-5xl font-black ${lead.initialScore >= 80 ? 'text-green-500' :
                                lead.initialScore >= 50 ? 'text-yellow-500' : 'text-red-500'
                                }`}>
                                {lead.initialScore}%
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-zinc-500 uppercase mb-2">Estado del Lead</label>
                            <select
                                className="w-full p-2 border border-brand/50 rounded bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-brand focus:border-transparent outline-none"
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value })}
                            >
                                <option value="Pendiente">Pendiente</option>
                                <option value="Nuevo">Nuevo</option>
                                <option value="Contactado">Contactado</option>
                                <option value="Ganado">Ganado</option>
                                <option value="Perdido">Perdido</option>
                            </select>
                        </div>

                        {lead.notes && (
                            <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded border border-amber-200 dark:border-amber-800/30">
                                <h4 className="text-xs font-bold text-amber-700 dark:text-amber-500 mb-1">Análisis IA</h4>
                                <p className="text-xs text-amber-900 dark:text-amber-200/80 leading-relaxed">
                                    {lead.notes}
                                </p>
                            </div>
                        )}

                        {(() => {
                            try {
                                const raw = JSON.parse(lead.rawData || '{}');
                                if (raw.conversation) {
                                    const msgs = raw.conversation.split('\n').filter((m: string) => m.trim());
                                    return (
                                        <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded border border-blue-200 dark:border-blue-800/30">
                                            <h4 className="text-xs font-bold text-blue-700 dark:text-blue-500 mb-2 flex items-center gap-1">
                                                <MessageSquare size={12} /> Conversación WhatsApp
                                            </h4>
                                            <div className="space-y-1 max-h-40 overflow-y-auto">
                                                {msgs.map((msg: string, i: number) => (
                                                    <p key={i} className="text-xs text-blue-900 dark:text-blue-200/80 leading-relaxed pl-2 border-l-2 border-blue-300 dark:border-blue-700">
                                                        {msg}
                                                    </p>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                }
                            } catch { /* rawData not JSON or no conversation */ }
                            return null;
                        })()}
                    </div>

                    {/* Main Form */}
                    <div className="md:col-span-2 space-y-6">
                        <h3 className="text-lg font-medium border-b border-zinc-100 dark:border-zinc-800 pb-2">Información del Contacto</h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="flex items-center gap-1 text-xs font-medium text-zinc-500 mb-1"><User size={12} /> Nombre</label>
                                <input
                                    className="w-full text-sm p-2 border rounded border-zinc-200 dark:border-zinc-700 bg-transparent focus:border-brand outline-none"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="flex items-center gap-1 text-xs font-medium text-zinc-500 mb-1"><Briefcase size={12} /> Cargo</label>
                                <input
                                    className="w-full text-sm p-2 border rounded border-zinc-200 dark:border-zinc-700 bg-transparent focus:border-brand outline-none"
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                    placeholder="Ej. Gerente de Ventas"
                                />
                            </div>
                            <div>
                                <label className="flex items-center gap-1 text-xs font-medium text-zinc-500 mb-1"><Mail size={12} /> Email</label>
                                <input
                                    className="w-full text-sm p-2 border rounded border-zinc-200 dark:border-zinc-700 bg-transparent focus:border-brand outline-none"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="flex items-center gap-1 text-xs font-medium text-zinc-500 mb-1"><Phone size={12} /> Teléfono</label>
                                <input
                                    className="w-full text-sm p-2 border rounded border-zinc-200 dark:border-zinc-700 bg-transparent focus:border-brand outline-none"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        </div>

                        <h3 className="text-lg font-medium border-b border-zinc-100 dark:border-zinc-800 pb-2 pt-2">Datos de Empresa</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="flex items-center gap-1 text-xs font-medium text-zinc-500 mb-1"><Building2 size={12} /> Empresa</label>
                                <input
                                    className="w-full text-sm p-2 border rounded border-zinc-200 dark:border-zinc-700 bg-transparent focus:border-brand outline-none"
                                    value={formData.company}
                                    onChange={e => setFormData({ ...formData, company: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="flex items-center gap-1 text-xs font-medium text-zinc-500 mb-1"><MapPin size={12} /> Dirección</label>
                                    <input
                                        className="w-full text-sm p-2 border rounded border-zinc-200 dark:border-zinc-700 bg-transparent focus:border-brand outline-none"
                                        value={formData.address}
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="flex items-center gap-1 text-xs font-medium text-zinc-500 mb-1">Ciudad</label>
                                    <input
                                        className="w-full text-sm p-2 border rounded border-zinc-200 dark:border-zinc-700 bg-transparent focus:border-brand outline-none"
                                        value={formData.city}
                                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="bg-brand text-white px-6 py-2 rounded shadow hover:bg-amber-600 transition-colors flex items-center gap-2 font-medium"
                            >
                                {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                Guardar Cambios
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
