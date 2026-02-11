'use client'

import { useState } from 'react';
import { requestPasswordReset } from '@/app/actions/auth';
import { Loader2, ArrowLeft, CheckCircle, Mail } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');

        // In a real app we'd validate email format
        const res = await requestPasswordReset(email);

        if (res.success) {
            setStatus('success');
        } else {
            setStatus('error');
            setMessage(res.error || 'Ocurrió un error.');
        }
    };

    if (status === 'success') {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center animate-in zoom-in-50 duration-300">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-green-500/10 text-green-500 rounded-full">
                            <CheckCircle size={32} />
                        </div>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Solicitud Enviada</h2>
                    <p className="text-zinc-400 mb-6 text-sm">
                        Si el correo <strong>{email}</strong> existe en nuestra base de datos, recibirás un enlace para restablecer tu contraseña.
                    </p>
                    <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded mb-6 text-xs text-amber-200/80">
                        <strong>Modo Demo:</strong> Se ha enviado una notificación al administrador (nelsondcarvajal@gmail.com).
                    </div>
                    <Link href="/login" className="text-brand hover:underline font-medium text-sm">
                        Volver al inicio de sesión
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-black">
            {/* Abstract bg */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand to-transparent opacity-50"></div>

            <div className="w-full max-w-md bg-zinc-900/50 backdrop-blur-md border border-white/10 p-8 rounded-xl shadow-2xl relative z-10">
                <Link href="/login" className="text-zinc-500 hover:text-white transition-colors flex items-center gap-1 mb-6 text-sm">
                    <ArrowLeft size={16} /> Volver
                </Link>

                <h1 className="text-2xl font-light text-white mb-2">Recuperar Contraseña</h1>
                <p className="text-zinc-400 text-xs mb-6">
                    Ingresa tu correo electrónico asociado a la cuenta.
                </p>

                {status === 'error' && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-200 text-xs rounded">
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Correo Electrónico</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                            <input
                                type="email"
                                required
                                className="w-full bg-black/50 border border-zinc-700 rounded px-4 pl-10 py-2.5 text-white focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all"
                                placeholder="tu@correo.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={status === 'loading'}
                        className="w-full bg-white text-black py-2.5 rounded font-medium hover:bg-zinc-200 transition-colors flex justify-center items-center gap-2"
                    >
                        {status === 'loading' && <Loader2 className="animate-spin" size={18} />}
                        Enviar Solicitud
                    </button>
                </form>
            </div>
        </div>
    );
}
