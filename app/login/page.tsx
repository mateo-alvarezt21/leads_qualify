'use client'

import { useState } from 'react';
import { loginAction } from '@/app/actions/auth';
import { Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const res = await loginAction(formData);

        if (!res.success) {
            setError(res.error || 'Creedenciales inválidas');
            setLoading(false);
        } else {
            // Redirect handled by server or client router
            window.location.href = '/';
        }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* Background Video */}
            <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute z-0 w-auto min-w-full min-h-full max-w-none object-cover opacity-60"
            >
                <source src="/login-bg.mp4" type="video/mp4" />
            </video>

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/60 z-10" />

            {/* Login Card */}
            <div className="relative z-20 w-full max-w-md p-8 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl animate-in fade-in zoom-in duration-500">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-light text-white mb-2 tracking-wide">Bienvenido</h1>
                    <p className="text-zinc-400 text-sm">Ingresa a la Plataforma de Calificación</p>
                </div>

                {error && (
                    <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded mb-6 flex items-center gap-2 text-sm">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1 ml-1 uppercase tracking-wider">Correo Electrónico</label>
                        <input
                            type="email"
                            required
                            className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-white placeholder-zinc-500 focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all"
                            placeholder="nombre@empresa.com"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1 ml-1 uppercase tracking-wider">Contraseña</label>
                        <input
                            type="password"
                            required
                            className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-white placeholder-zinc-500 focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-brand hover:bg-amber-600 text-white font-medium py-3 rounded transition-colors shadow-lg shadow-brand/20 flex justify-center items-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : 'Iniciar Sesión'}
                    </button>
                </form>

                <div className="mt-6 text-center space-y-2">
                    <Link
                        href="/forgot-password"
                        className="block text-xs text-zinc-400 hover:text-brand transition-colors border-b border-transparent hover:border-brand pb-0.5 inline-block"
                    >
                        ¿He olvidado mi contraseña?
                    </Link>
                    <Link
                        href="/register"
                        className="block text-xs text-zinc-400 hover:text-brand transition-colors border-b border-transparent hover:border-brand pb-0.5 inline-block"
                    >
                        ¿No tienes cuenta? Regístrate
                    </Link>
                </div>
            </div>

            {/* Footer Credit always visible */}
            <div className="absolute bottom-4 text-center w-full z-20 text-xs text-white/30">
                Creado con ❤ en Medellín, Colombia
            </div>
        </div>
    );
}
