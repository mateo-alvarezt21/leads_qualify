'use client'

import { useEffect, useState, useCallback } from 'react';
import { getAdminStats, getAllOrganizations, getAllLicenseCodes, deleteOrganization } from '@/app/actions/admin';
import { GenerateLicenseButton } from '@/components/admin/GenerateLicenseButton';
import Link from 'next/link';
import { ArrowLeft, Building2, Users, FileText, Key, Loader2, Trash2, AlertTriangle, X } from 'lucide-react';

type Stats = Awaited<ReturnType<typeof getAdminStats>>;
type Org = Awaited<ReturnType<typeof getAllOrganizations>>[number];
type License = Awaited<ReturnType<typeof getAllLicenseCodes>>[number];

export default function AdminPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [orgs, setOrgs] = useState<Org[]>([]);
    const [licenses, setLicenses] = useState<License[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteTarget, setDeleteTarget] = useState<Org | null>(null);
    const [confirmName, setConfirmName] = useState('');
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    const handleDeleteOrg = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        setDeleteError('');
        const res = await deleteOrganization(deleteTarget.id, confirmName);
        setDeleting(false);
        if (res.success) {
            setDeleteTarget(null);
            setConfirmName('');
            loadData();
        } else {
            setDeleteError(res.error || 'Error al eliminar');
        }
    };

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
                                        <th className="px-4 py-3 font-medium text-zinc-500 text-center w-16"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orgs.map(org => (
                                        <tr key={org.id} className="border-b border-zinc-200 dark:border-zinc-800 last:border-0 group">
                                            <td className="px-4 py-3 font-medium">
                                                <Link href={`/admin/${org.id}`} className="hover:text-brand transition-colors underline-offset-2 hover:underline">
                                                    {org.name}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3 text-zinc-500 font-mono text-xs">{org.slug}</td>
                                            <td className="px-4 py-3 text-center">{org.usersCount}</td>
                                            <td className="px-4 py-3 text-center">{org.leadsCount}</td>
                                            <td className="px-4 py-3 text-zinc-500">{new Date(org.createdAt).toLocaleDateString()}</td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => { setDeleteTarget(org); setConfirmName(''); setDeleteError(''); }}
                                                    className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Eliminar organización"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
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

            {/* Delete Organization Confirmation Dialog */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
                            <h3 className="font-semibold text-red-600 flex items-center gap-2">
                                <AlertTriangle size={18} /> Eliminar Organización
                            </h3>
                            <button onClick={() => setDeleteTarget(null)} className="text-zinc-400 hover:text-zinc-600">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="px-6 py-5 space-y-4">
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                                <p className="text-sm text-red-700 dark:text-red-400 font-medium mb-2">Esta acción es irreversible y eliminará:</p>
                                <ul className="text-xs text-red-600 dark:text-red-400 space-y-1 list-disc list-inside">
                                    <li>{deleteTarget.usersCount} usuario(s)</li>
                                    <li>{deleteTarget.leadsCount} lead(s)</li>
                                    <li>Todas las configuraciones del sistema</li>
                                    <li>Todas las instancias de WhatsApp</li>
                                </ul>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Escribe <span className="font-bold text-red-600">{deleteTarget.name}</span> para confirmar:
                                </label>
                                <input
                                    type="text"
                                    value={confirmName}
                                    onChange={e => setConfirmName(e.target.value)}
                                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-black text-sm outline-none focus:border-red-500"
                                    placeholder={deleteTarget.name}
                                    autoFocus
                                />
                            </div>

                            {deleteError && (
                                <p className="text-sm text-red-600">{deleteError}</p>
                            )}

                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={() => setDeleteTarget(null)}
                                    className="flex-1 px-4 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleDeleteOrg}
                                    disabled={confirmName !== deleteTarget.name || deleting}
                                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                    {deleting ? 'Eliminando...' : 'Eliminar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
