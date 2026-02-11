'use client'

import { useState } from 'react';
import { UserPlus, Loader2, X, Shield, User } from 'lucide-react';
import { createUser } from '@/app/actions/auth';

export function CreateUserDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'user'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const res = await createUser(formData);

        if (res.success) {
            setIsOpen(false);
            setFormData({ name: '', email: '', password: '', role: 'user' });
        } else {
            setError(res.error || 'Error al crear usuario');
        }
        setLoading(false);
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 bg-brand text-white px-4 py-2 rounded shadow hover:bg-amber-600 transition-colors"
            >
                <UserPlus size={18} />
                Nuevo Usuario
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-zinc-900 border border-brand/50 rounded-lg shadow-xl w-full max-w-md relative p-6">
                <button
                    onClick={() => setIsOpen(false)}
                    className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                >
                    <X size={20} />
                </button>

                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-zinc-800 dark:text-zinc-100">
                    <UserPlus size={24} className="text-brand" /> Crear Usuario
                </h2>

                {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded border border-red-200">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">Nombre</label>
                        <input
                            required
                            className="w-full p-2 border border-zinc-200 dark:border-zinc-700 rounded bg-transparent outline-none focus:border-brand"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">Email</label>
                        <input
                            type="email"
                            required
                            className="w-full p-2 border border-zinc-200 dark:border-zinc-700 rounded bg-transparent outline-none focus:border-brand"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">Contraseña</label>
                        <input
                            type="password"
                            required
                            className="w-full p-2 border border-zinc-200 dark:border-zinc-700 rounded bg-transparent outline-none focus:border-brand"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">Rol</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, role: 'user' })}
                                className={`p-2 rounded border text-sm flex items-center justify-center gap-2 transition-colors ${formData.role === 'user' ? 'bg-brand/10 border-brand text-brand' : 'border-zinc-200 dark:border-zinc-700 text-zinc-500'}`}
                            >
                                <User size={16} /> Usuario
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, role: 'admin' })}
                                className={`p-2 rounded border text-sm flex items-center justify-center gap-2 transition-colors ${formData.role === 'admin' ? 'bg-purple-100 border-purple-500 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'border-zinc-200 dark:border-zinc-700 text-zinc-500'}`}
                            >
                                <Shield size={16} /> Admin
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-brand text-white py-2 rounded font-medium mt-4 hover:bg-amber-600 transition-colors flex justify-center items-center gap-2"
                    >
                        {loading && <Loader2 className="animate-spin" size={18} />}
                        Crear Cuenta
                    </button>
                </form>
            </div>
        </div>
    );
}
