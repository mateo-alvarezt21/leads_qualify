'use client'

import { useState } from 'react';
import { addManualLead } from '@/app/actions/leads';
import { Loader2, Plus, X, Building2, MapPin, User, Mail, Phone, Briefcase } from 'lucide-react';

export function AddLeadDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', source: 'Manual',
        company: '', role: '', address: '', city: ''
    });
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res = await addManualLead(formData as any);

        if (res.success) {
            setIsOpen(false);
            setFormData({
                name: '', email: '', phone: '', source: 'Manual',
                company: '', role: '', address: '', city: ''
            });
        } else {
            setError(res.error || 'Error desconocido');
        }
        setIsLoading(false);
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 bg-brand text-white px-4 py-2 rounded shadow hover:bg-amber-600 transition-colors"
            >
                <Plus size={18} />
                Nuevo Lead
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-zinc-900 border border-brand/50 p-6 rounded-lg shadow-xl w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
                <button
                    onClick={() => setIsOpen(false)}
                    className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                >
                    <X size={20} />
                </button>

                <h2 className="text-xl font-semibold mb-6 text-brand flex items-center gap-2">
                    <User size={20} /> Ingresar Nuevo Lead
                </h2>

                {error && <div className="p-2 mb-4 text-sm text-red-600 bg-red-50 rounded">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Contacto */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Contacto</h3>
                            <div>
                                <label className="block text-xs font-medium mb-1 flex items-center gap-1"><User size={12} /> Nombre Completo *</label>
                                <input
                                    required
                                    className="w-full p-2 border border-zinc-300 dark:border-zinc-700 rounded bg-transparent outline-none focus:border-brand"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1 flex items-center gap-1"><Mail size={12} /> Email</label>
                                <input
                                    type="email"
                                    className="w-full p-2 border border-zinc-300 dark:border-zinc-700 rounded bg-transparent outline-none focus:border-brand"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1 flex items-center gap-1"><Phone size={12} /> Teléfono</label>
                                <input
                                    type="tel"
                                    className="w-full p-2 border border-zinc-300 dark:border-zinc-700 rounded bg-transparent outline-none focus:border-brand"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Empresa y Dirección */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Detalles</h3>
                            <div>
                                <label className="block text-xs font-medium mb-1 flex items-center gap-1"><Building2 size={12} /> Empresa</label>
                                <input
                                    className="w-full p-2 border border-zinc-300 dark:border-zinc-700 rounded bg-transparent outline-none focus:border-brand"
                                    value={formData.company}
                                    onChange={e => setFormData({ ...formData, company: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1 flex items-center gap-1"><Briefcase size={12} /> Cargo / Rol</label>
                                <input
                                    className="w-full p-2 border border-zinc-300 dark:border-zinc-700 rounded bg-transparent outline-none focus:border-brand"
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1 flex items-center gap-1"><MapPin size={12} /> Ciudad / Dirección</label>
                                <input
                                    className="w-full p-2 border border-zinc-300 dark:border-zinc-700 rounded bg-transparent outline-none focus:border-brand"
                                    value={formData.city}
                                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                                    placeholder="Ciudad"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-brand text-white py-3 rounded font-medium hover:bg-amber-600 transition-colors flex justify-center items-center gap-2 mt-4"
                    >
                        {isLoading && <Loader2 className="animate-spin" size={18} />}
                        {isLoading ? 'Procesando...' : 'Guardar y Calificar'}
                    </button>
                </form>
            </div>
        </div>
    );
}
