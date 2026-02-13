'use client'

import { useState } from 'react';
import { registerAction } from '@/app/actions/auth';
import { Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        organizationName: '',
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        licenseCode: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        setLoading(true);

        const res = await registerAction({
            organizationName: formData.organizationName,
            name: formData.name,
            email: formData.email,
            password: formData.password,
            licenseCode: formData.licenseCode,
        });

        if (!res.success) {
            setError(res.error || 'Error al registrar');
            setLoading(false);
        } else {
            window.location.href = '/';
        }
    };

    const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setFormData({ ...formData, [field]: e.target.value });

    const inputClass = "w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-white placeholder-zinc-500 focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all";
    const labelClass = "block text-xs font-medium text-zinc-300 mb-1 ml-1 uppercase tracking-wider";

    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* Background Video */}
            <video
                autoPlay loop muted playsInline
                className="absolute z-0 w-auto min-w-full min-h-full max-w-none object-cover opacity-60"
            >
                <source src="/login-bg.mp4" type="video/mp4" />
            </video>

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/60 z-10" />

            {/* Register Card */}
            <div className="relative z-20 w-full max-w-md p-8 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl animate-in fade-in zoom-in duration-500">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-light text-white mb-2 tracking-wide">Crear Cuenta</h1>
                    <p className="text-zinc-400 text-sm">Registra tu organización en la plataforma</p>
                </div>

                {error && (
                    <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded mb-6 flex items-center gap-2 text-sm">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className={labelClass}>Nombre de Organización</label>
                        <input type="text" required className={inputClass} placeholder="Mi Empresa"
                            value={formData.organizationName} onChange={update('organizationName')} />
                    </div>
                    <div>
                        <label className={labelClass}>Tu Nombre</label>
                        <input type="text" required className={inputClass} placeholder="Juan Pérez"
                            value={formData.name} onChange={update('name')} />
                    </div>
                    <div>
                        <label className={labelClass}>Correo Electrónico</label>
                        <input type="email" required className={inputClass} placeholder="nombre@empresa.com"
                            value={formData.email} onChange={update('email')} />
                    </div>
                    <div>
                        <label className={labelClass}>Contraseña</label>
                        <input type="password" required className={inputClass} placeholder="Mínimo 8 caracteres"
                            value={formData.password} onChange={update('password')} />
                    </div>
                    <div>
                        <label className={labelClass}>Confirmar Contraseña</label>
                        <input type="password" required className={inputClass} placeholder="••••••••"
                            value={formData.confirmPassword} onChange={update('confirmPassword')} />
                    </div>
                    <div>
                        <label className={labelClass}>Código de Licencia</label>
                        <input type="text" required className={inputClass} placeholder="XXXX-XXXX-XXXX-XXXX"
                            value={formData.licenseCode} onChange={update('licenseCode')} />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-brand hover:bg-amber-600 text-white font-medium py-3 rounded transition-colors shadow-lg shadow-brand/20 flex justify-center items-center gap-2 mt-6"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : 'Registrarse'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <Link
                        href="/login"
                        className="text-xs text-zinc-400 hover:text-brand transition-colors border-b border-transparent hover:border-brand pb-0.5"
                    >
                        ¿Ya tienes cuenta? Inicia Sesión
                    </Link>
                </div>
            </div>

            <div className="absolute bottom-4 text-center w-full z-20 text-xs text-white/30">
                Creado con ❤ en Medellín, Colombia
            </div>
        </div>
    );
}
