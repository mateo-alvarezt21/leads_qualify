'use client';

import { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { RefreshCw, LogOut, Smartphone, Phone, CheckCircle, AlertCircle, Plus, Trash2, Wifi, WifiOff } from 'lucide-react';

interface WhatsAppInstanceData {
    id: string;
    name: string;
    phone: string | null;
    pushName: string | null;
    liveStatus: 'disconnected' | 'connecting' | 'scanning' | 'connected';
    account: { phone: string; name: string } | null;
    qr: string | null;
}

export function WhatsAppSettings() {
    const [instances, setInstances] = useState<WhatsAppInstanceData[]>([]);
    const [loading, setLoading] = useState(true);
    const [newName, setNewName] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [creating, setCreating] = useState(false);
    const [pollingInstanceIds, setPollingInstanceIds] = useState<Set<string>>(new Set());

    const fetchInstances = useCallback(async () => {
        try {
            const res = await fetch('/api/whatsapp?action=instances');
            const data = await res.json();
            if (data.instances) {
                setInstances(data.instances);

                // Update polling: poll for any instance that's connecting/scanning
                const needsPolling = new Set<string>();
                for (const inst of data.instances) {
                    if (inst.liveStatus === 'connecting' || inst.liveStatus === 'scanning') {
                        needsPolling.add(inst.id);
                    }
                }
                setPollingInstanceIds(needsPolling);
            }
        } catch (error) {
            console.error('Error fetching instances:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchInstances();
    }, [fetchInstances]);

    // Polling for instances that are connecting/scanning
    useEffect(() => {
        if (pollingInstanceIds.size === 0) return;
        const interval = setInterval(fetchInstances, 3000);
        return () => clearInterval(interval);
    }, [pollingInstanceIds, fetchInstances]);

    const handleCreate = async () => {
        const name = newName.trim();
        if (!name) return;
        setCreating(true);
        try {
            const res = await fetch('/api/whatsapp', {
                method: 'POST',
                body: JSON.stringify({ action: 'create', name }),
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (data.success) {
                setNewName('');
                setShowAddForm(false);
                await fetchInstances();
            }
        } finally {
            setCreating(false);
        }
    };

    const handleConnect = async (instanceId: string) => {
        await fetch('/api/whatsapp', {
            method: 'POST',
            body: JSON.stringify({ action: 'connect', instanceId }),
            headers: { 'Content-Type': 'application/json' }
        });
        // Start polling
        setPollingInstanceIds(prev => new Set(prev).add(instanceId));
        setTimeout(fetchInstances, 1000);
    };

    const handleLogout = async (instanceId: string) => {
        if (!confirm('Desconectar este numero de WhatsApp?')) return;
        await fetch('/api/whatsapp', {
            method: 'POST',
            body: JSON.stringify({ action: 'logout', instanceId }),
            headers: { 'Content-Type': 'application/json' }
        });
        await fetchInstances();
    };

    const handleDelete = async (instanceId: string) => {
        if (!confirm('Eliminar esta linea? Se perdera la sesion y los datos de conexion.')) return;
        await fetch('/api/whatsapp', {
            method: 'POST',
            body: JSON.stringify({ action: 'delete', instanceId }),
            headers: { 'Content-Type': 'application/json' }
        });
        await fetchInstances();
    };

    return (
        <div className="p-6 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Smartphone className="text-brand" />
                    WhatsApp - Lineas conectadas
                </h2>
                {!showAddForm && (
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="px-4 py-2 bg-brand hover:bg-brand/90 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <Plus size={16} />
                        Agregar numero
                    </button>
                )}
            </div>

            {/* Add new instance form */}
            {showAddForm && (
                <div className="mb-6 p-4 border-2 border-dashed border-brand/30 rounded-lg bg-brand/5">
                    <p className="text-sm font-medium mb-3">Nueva linea de WhatsApp</p>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Nombre (ej: Ventas, Soporte, Personal)"
                            className="flex-1 px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleCreate()}
                            autoFocus
                        />
                        <button
                            onClick={handleCreate}
                            disabled={creating || !newName.trim()}
                            className="px-4 py-2 bg-brand hover:bg-brand/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                            {creating ? 'Creando...' : 'Crear'}
                        </button>
                        <button
                            onClick={() => { setShowAddForm(false); setNewName(''); }}
                            className="px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex flex-col items-center justify-center p-12 text-zinc-500">
                    <RefreshCw className="animate-spin mb-2" />
                    <span>Cargando lineas...</span>
                </div>
            ) : instances.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-lg text-center">
                    <Smartphone size={40} className="text-zinc-300 mb-3" />
                    <p className="text-zinc-600 dark:text-zinc-400 mb-2">No hay lineas configuradas</p>
                    <p className="text-sm text-zinc-400 mb-4">Agrega un numero de WhatsApp para empezar a recibir leads automaticamente.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {instances.map(inst => (
                        <InstanceCard
                            key={inst.id}
                            instance={inst}
                            onConnect={handleConnect}
                            onLogout={handleLogout}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}

            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-100 dark:border-blue-800 flex gap-3 text-sm text-blue-700 dark:text-blue-300">
                <AlertCircle className="shrink-0 mt-0.5" size={16} />
                <p>
                    <strong>Nota:</strong> Cada linea funciona como una sesion independiente de WhatsApp Web.
                    Si reinicias el servidor, las conexiones se reestablecen automaticamente.
                </p>
            </div>
        </div>
    );
}

function InstanceCard({ instance, onConnect, onLogout, onDelete }: {
    instance: WhatsAppInstanceData;
    onConnect: (id: string) => void;
    onLogout: (id: string) => void;
    onDelete: (id: string) => void;
}) {
    const { id, name, liveStatus, account, qr } = instance;

    const statusBadge = () => {
        switch (liveStatus) {
            case 'connected':
                return (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/30 px-2.5 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        Conectado
                    </span>
                );
            case 'connecting':
            case 'scanning':
                return (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30 px-2.5 py-1 rounded-full">
                        <RefreshCw size={10} className="animate-spin" />
                        {liveStatus === 'scanning' ? 'Esperando QR' : 'Conectando'}
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full">
                        <WifiOff size={10} />
                        Desconectado
                    </span>
                );
        }
    };

    return (
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900/50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${liveStatus === 'connected' ? 'bg-green-100 dark:bg-green-900/40 text-green-600' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}>
                        <Smartphone size={16} />
                    </div>
                    <div>
                        <p className="font-medium text-sm">{name}</p>
                        {account && (
                            <p className="text-xs text-zinc-500">+{account.phone} {account.name ? `(${account.name})` : ''}</p>
                        )}
                        {!account && instance.phone && liveStatus !== 'connected' && (
                            <p className="text-xs text-zinc-400">+{instance.phone}</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {statusBadge()}
                </div>
            </div>

            {/* Body */}
            <div className="p-4">
                {liveStatus === 'disconnected' && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-zinc-500">Conecta este numero para empezar a recibir mensajes.</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => onConnect(id)}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                            >
                                <Wifi size={14} />
                                Conectar
                            </button>
                            <button
                                onClick={() => onDelete(id)}
                                className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Eliminar linea"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                )}

                {liveStatus === 'connecting' && (
                    <div className="flex items-center justify-center py-4 text-zinc-500 gap-2">
                        <RefreshCw className="animate-spin" size={16} />
                        <span className="text-sm">Conectando con WhatsApp...</span>
                    </div>
                )}

                {liveStatus === 'scanning' && qr && (
                    <div className="flex flex-col items-center gap-4 py-2">
                        <div className="bg-white p-3 rounded-lg shadow-sm">
                            <QRCodeSVG value={qr} size={200} level="L" includeMargin />
                        </div>
                        <div className="text-center text-zinc-600 dark:text-zinc-400">
                            <p className="font-medium text-sm">Escanea el codigo con tu celular</p>
                            <p className="text-xs mt-1">WhatsApp &gt; Configuracion &gt; Dispositivos vinculados</p>
                        </div>
                    </div>
                )}

                {liveStatus === 'connected' && (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <CheckCircle size={18} className="text-green-500" />
                            <div>
                                {account && (
                                    <div className="flex items-center gap-4 text-sm">
                                        {account.name && (
                                            <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                                                <Smartphone size={12} className="text-zinc-400" />
                                                {account.name}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 font-mono">
                                            <Phone size={12} className="text-zinc-400" />
                                            +{account.phone}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={() => onLogout(id)}
                            className="px-3 py-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                        >
                            <LogOut size={14} />
                            Desconectar
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
