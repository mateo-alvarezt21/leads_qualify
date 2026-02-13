'use client'

import { useEffect, useState, useCallback } from 'react';
import { getAdminStats, getAllOrganizations, getAllLicenseCodes } from '@/app/actions/admin';
import { GenerateLicenseButton } from '@/components/admin/GenerateLicenseButton';
import Link from 'next/link';
import { ArrowLeft, Building2, Users, FileText, Key, Loader2 } from 'lucide-react';

type Stats = Awaited<ReturnType<typeof getAdminStats>>;
type Org = Awaited<ReturnType<typeof getAllOrganizations>>[number];
type License = Awaited<ReturnType<typeof getAllLicenseCodes>>[number];

export default function AdminPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [orgs, setOrgs] = useState<Org[]>([]);
    const [licenses, setLicenses] = useState<License[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        const [s, o, l] = await Promise.all([
            getAdminStats(),
            getAllOrganizations(),
            getAllLicenseCodes(),
        ]);
        setStats(s);
        setOrgs(o);
        setLicenses(l);
        setLoading(false);
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
                <Loader2 className="animate-spin text-brand" size={32} />
            </div>
        );
    }

    const statCards = [
        { label: 'Organizaciones', value: stats?.organizations ?? 0, icon: Building2 },
        { label: 'Usuarios', value: stats?.users ?? 0, icon: Users },
        { label: 'Leads', value: stats?.leads ?? 0, icon: FileText },
        { label: 'Licencias Disponibles', value: stats?.availableLicenses ?? 0, icon: Key },
    ];

    return (
        <main className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 p-8">
            <div className="max-w-6xl mx-auto">
                <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-brand mb-8 transition-colors">
                    <ArrowLeft size={18} /> Volver al Inicio
                </Link>

                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-light">Panel <span className="text-brand font-semibold">Superadmin</span></h1>
                    <GenerateLicenseButton onGenerated={loadData} />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                    {statCards.map(({ label, value, icon: Icon }) => (
                        <div key={label} className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5">
                            <div className="flex items-center gap-2 text-zinc-500 mb-2">
                                <Icon size={16} />
                                <span className="text-xs uppercase tracking-wider">{label}</span>
                            </div>
                            <p className="text-2xl font-semibold">{value}</p>
                        </div>
                    ))}
                </div>

                {/* Organizations Table */}
                <div className="mb-10">
                    <h2 className="text-xl font-medium mb-4">Organizaciones</h2>
                    <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-zinc-200 dark:border-zinc-800 text-left">
                                        <th className="px-4 py-3 font-medium text-zinc-500">Nombre</th>
                                        <th className="px-4 py-3 font-medium text-zinc-500">Slug</th>
                                        <th className="px-4 py-3 font-medium text-zinc-500 text-center">Usuarios</th>
                                        <th className="px-4 py-3 font-medium text-zinc-500 text-center">Leads</th>
                                        <th className="px-4 py-3 font-medium text-zinc-500">Creada</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orgs.map(org => (
                                        <tr key={org.id} className="border-b border-zinc-200 dark:border-zinc-800 last:border-0">
                                            <td className="px-4 py-3 font-medium">{org.name}</td>
                                            <td className="px-4 py-3 text-zinc-500 font-mono text-xs">{org.slug}</td>
                                            <td className="px-4 py-3 text-center">{org.usersCount}</td>
                                            <td className="px-4 py-3 text-center">{org.leadsCount}</td>
                                            <td className="px-4 py-3 text-zinc-500">{new Date(org.createdAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* License Codes Table */}
                <div>
                    <h2 className="text-xl font-medium mb-4">Códigos de Licencia</h2>
                    <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-zinc-200 dark:border-zinc-800 text-left">
                                        <th className="px-4 py-3 font-medium text-zinc-500">Código</th>
                                        <th className="px-4 py-3 font-medium text-zinc-500">Estado</th>
                                        <th className="px-4 py-3 font-medium text-zinc-500">Usado por</th>
                                        <th className="px-4 py-3 font-medium text-zinc-500">Organización</th>
                                        <th className="px-4 py-3 font-medium text-zinc-500">Creado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {licenses.map(lic => (
                                        <tr key={lic.id} className="border-b border-zinc-200 dark:border-zinc-800 last:border-0">
                                            <td className="px-4 py-3 font-mono text-xs">{lic.code}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${lic.used
                                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                                    : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                    }`}>
                                                    {lic.used ? 'Usado' : 'Disponible'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-zinc-500">{lic.usedByEmail || '—'}</td>
                                            <td className="px-4 py-3 text-zinc-500">{lic.organizationName || '—'}</td>
                                            <td className="px-4 py-3 text-zinc-500">{new Date(lic.createdAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                    {licenses.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-8 text-center text-zinc-400">
                                                No hay códigos de licencia. Genera algunos con el botón de arriba.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
