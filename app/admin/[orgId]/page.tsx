'use client'

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getOrganizationDetail, updateOrgAppName } from '@/app/actions/admin';
import { ConversionByScoreChart, StatusDistributionChart, SourceChart, GrowthChart } from '@/components/analytics/Charts';
import { ArrowLeft, Users, FileText, Thermometer, TrendingDown, Loader2, Wifi, Type, Check, RotateCcw } from 'lucide-react';

type OrgDetail = NonNullable<Awaited<ReturnType<typeof getOrganizationDetail>>>;

export default function OrgDetailPage() {
    const params = useParams();
    const orgId = params.orgId as string;
    const [data, setData] = useState<OrgDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [nameFirst, setNameFirst] = useState('');
    const [nameSecond, setNameSecond] = useState('');
    const [savingName, setSavingName] = useState(false);
    const [nameMsg, setNameMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        getOrganizationDetail(orgId).then(res => {
            if (!res) {
                setNotFound(true);
            } else {
                setData(res);
                setNameFirst(res.appNameFirst || '');
                setNameSecond(res.appNameSecond || '');
            }
            setLoading(false);
        });
    }, [orgId]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
                <Loader2 className="animate-spin text-brand" size={32} />
            </div>
        );
    }

    if (notFound || !data) {
        return (
            <main className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 p-8">
                <div className="max-w-6xl mx-auto">
                    <Link href="/admin" className="inline-flex items-center gap-2 text-zinc-500 hover:text-brand mb-8 transition-colors">
                        <ArrowLeft size={18} /> Volver al Panel
                    </Link>
                    <p className="text-zinc-500">Organización no encontrada.</p>
                </div>
            </main>
        );
    }

    const handleSaveName = async () => {
        setSavingName(true);
        setNameMsg(null);
        try {
            await updateOrgAppName(data.id, nameFirst, nameSecond);
            setNameMsg({ type: 'success', text: 'Nombre actualizado' });
            setTimeout(() => setNameMsg(null), 3000);
        } catch {
            setNameMsg({ type: 'error', text: 'Error al guardar' });
        }
        setSavingName(false);
    };

    const displayFirst = nameFirst || 'LEAD';
    const displaySecond = nameSecond || 'QUALITY';
    const nameHasChanges = nameFirst !== (data.appNameFirst || '') || nameSecond !== (data.appNameSecond || '');

    const statCards = [
        { label: 'Total Leads', value: data.leadsCount, icon: FileText },
        { label: 'Usuarios', value: data.usersCount, icon: Users },
        { label: 'Temp. Promedio Inicial', value: `${data.avgInitialScore}%`, icon: Thermometer },
        { label: 'Temp. Promedio Actual', value: `${data.avgCurrentScore}%`, icon: TrendingDown },
    ];

    const getTempBarColor = (range: string) => {
        switch (range) {
            case '0-20': return 'bg-red-500';
            case '21-40': return 'bg-orange-500';
            case '41-60': return 'bg-yellow-500';
            case '61-80': return 'bg-lime-500';
            case '81-100': return 'bg-green-500';
            default: return 'bg-zinc-500';
        }
    };

    const maxTempCount = Math.max(...data.temperatureDistribution.map(t => t.count), 1);
    const maxTempCountInitial = Math.max(...data.temperatureDistributionInitial.map(t => t.count), 1);

    return (
        <main className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 p-8">
            <div className="max-w-6xl mx-auto">
                <Link href="/admin" className="inline-flex items-center gap-2 text-zinc-500 hover:text-brand mb-8 transition-colors">
                    <ArrowLeft size={18} /> Volver al Panel
                </Link>

                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    {data.logo && (
                        <img src={data.logo} alt={data.name} className="w-12 h-12 rounded-lg object-cover border border-zinc-200 dark:border-zinc-700" />
                    )}
                    <div>
                        <h1 className="text-3xl font-light">
                            {data.name}
                        </h1>
                        <p className="text-sm text-zinc-500">
                            {data.slug} &middot; Creada {new Date(data.createdAt).toLocaleDateString()}
                            {data.whatsappCount > 0 && (
                                <span className="inline-flex items-center gap-1 ml-3">
                                    <Wifi size={12} /> {data.whatsappCount} instancia(s) WhatsApp
                                </span>
                            )}
                        </p>
                    </div>
                </div>

                {/* App Name Customization */}
                <div className="mb-10 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5">
                    <h3 className="text-sm font-medium text-zinc-500 mb-4 flex items-center gap-2">
                        <Type size={16} /> Nombre de la App
                    </h3>
                    <div className="flex flex-col md:flex-row items-start md:items-end gap-4">
                        <div className="flex-1 w-full">
                            <label className="text-xs text-zinc-400 mb-1 block">Primera parte (reemplaza LEAD)</label>
                            <input
                                type="text"
                                value={nameFirst}
                                onChange={e => setNameFirst(e.target.value.toUpperCase())}
                                placeholder="LEAD"
                                maxLength={20}
                                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-black text-sm font-mono tracking-wider outline-none focus:border-brand"
                            />
                        </div>
                        <div className="flex-1 w-full">
                            <label className="text-xs text-zinc-400 mb-1 block">Segunda parte (reemplaza QUALITY)</label>
                            <input
                                type="text"
                                value={nameSecond}
                                onChange={e => setNameSecond(e.target.value.toUpperCase())}
                                placeholder="QUALITY"
                                maxLength={20}
                                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-black text-sm font-mono tracking-wider outline-none focus:border-brand"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            {(nameFirst || nameSecond) && (
                                <button
                                    onClick={() => { setNameFirst(''); setNameSecond(''); }}
                                    className="p-2 text-zinc-400 hover:text-zinc-600 transition-colors"
                                    title="Restaurar nombre original"
                                >
                                    <RotateCcw size={16} />
                                </button>
                            )}
                            <button
                                onClick={handleSaveName}
                                disabled={savingName || !nameHasChanges}
                                className="px-4 py-2 bg-brand hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                            >
                                {savingName ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                Guardar
                            </button>
                        </div>
                    </div>
                    {/* Live Preview */}
                    <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                        <p className="text-xs text-zinc-400 mb-2">Vista previa:</p>
                        <p className="text-xl font-light tracking-wide">
                            {displayFirst}<span className="font-bold text-brand">{displaySecond}</span>
                        </p>
                    </div>
                    {nameMsg && (
                        <p className={`mt-3 text-sm ${nameMsg.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                            {nameMsg.text}
                        </p>
                    )}
                </div>

                {/* Stats Cards */}
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

                {/* Charts Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                    <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5">
                        <h3 className="text-sm font-medium text-zinc-500 mb-4">Distribución por Estado</h3>
                        <StatusDistributionChart data={data.analytics.statusDistribution} />
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5">
                        <h3 className="text-sm font-medium text-zinc-500 mb-4">Distribución por Fuente</h3>
                        <SourceChart data={data.analytics.sourceDistribution} />
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5">
                        <h3 className="text-sm font-medium text-zinc-500 mb-4">Conversión vs Score</h3>
                        <ConversionByScoreChart data={data.analytics.conversionByScore} />
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5">
                        <h3 className="text-sm font-medium text-zinc-500 mb-4">Crecimiento Últimos 7 Días</h3>
                        <GrowthChart data={data.analytics.growth} />
                    </div>
                </div>

                {/* Temperature Distribution */}
                <div className="mb-10">
                    <h2 className="text-xl font-medium mb-4">Distribución por Temperatura</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5">
                            <h3 className="text-sm font-medium text-zinc-500 mb-4">Temperatura Actual</h3>
                            <div className="space-y-3">
                                {data.temperatureDistribution.map(({ range, count }) => (
                                    <div key={range} className="flex items-center gap-4">
                                        <span className="text-sm font-mono w-16 text-zinc-500">{range}%</span>
                                        <div className="flex-1 bg-zinc-200 dark:bg-zinc-800 rounded-full h-6 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${getTempBarColor(range)} transition-all`}
                                                style={{ width: `${(count / maxTempCount) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-sm font-semibold w-12 text-right">{count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5">
                            <h3 className="text-sm font-medium text-zinc-500 mb-4">Temperatura Inicial</h3>
                            <div className="space-y-3">
                                {data.temperatureDistributionInitial.map(({ range, count }) => (
                                    <div key={`init-${range}`} className="flex items-center gap-4">
                                        <span className="text-sm font-mono w-16 text-zinc-500">{range}%</span>
                                        <div className="flex-1 bg-zinc-200 dark:bg-zinc-800 rounded-full h-6 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${getTempBarColor(range)} transition-all`}
                                                style={{ width: `${(count / maxTempCountInitial) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-sm font-semibold w-12 text-right">{count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Users Table */}
                <div className="mb-10">
                    <h2 className="text-xl font-medium mb-4">Usuarios</h2>
                    <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-zinc-200 dark:border-zinc-800 text-left">
                                        <th className="px-4 py-3 font-medium text-zinc-500">Nombre</th>
                                        <th className="px-4 py-3 font-medium text-zinc-500">Email</th>
                                        <th className="px-4 py-3 font-medium text-zinc-500">Rol</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.users.map(user => (
                                        <tr key={user.id} className="border-b border-zinc-200 dark:border-zinc-800 last:border-0">
                                            <td className="px-4 py-3 font-medium">{user.name || '—'}</td>
                                            <td className="px-4 py-3 text-zinc-500">{user.email}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                                                    user.role === 'admin'
                                                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                                                        : user.role === 'superadmin'
                                                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                                                }`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {data.users.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="px-4 py-8 text-center text-zinc-400">
                                                No hay usuarios en esta organización.
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
