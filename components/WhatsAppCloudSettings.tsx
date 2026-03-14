'use client';

import { useState, useEffect, useCallback } from 'react';
import { Cloud, Plus, Trash2, CheckCircle, AlertCircle, Copy, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

interface CloudAccount {
    id: string;
    displayName: string;
    phoneNumberId: string;
    wabaId: string;
    apiVersion: string;
    phone: string | null;
    active: boolean;
    verifyToken: string;
    createdAt: string;
}

const WEBHOOK_PATH = '/api/whatsapp-cloud/webhook';

function generateToken(): string {
    const arr = new Uint8Array(18);
    crypto.getRandomValues(arr);
    return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function WhatsAppCloudSettings() {
    const [accounts, setAccounts] = useState<CloudAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [creating, setCreating] = useState(false);
    const [testResults, setTestResults] = useState<Record<string, { success: boolean; displayPhone?: string; verifiedName?: string; error?: string } | null>>({});
    const [testingId, setTestingId] = useState<string | null>(null);

    const [form, setForm] = useState({
        displayName: '',
        phoneNumberId: '',
        wabaId: '',
        accessToken: '',
        appSecret: '',
        verifyToken: generateToken(),
        apiVersion: 'v21.0',
    });

    const [webhookUrl, setWebhookUrl] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setWebhookUrl(window.location.origin + WEBHOOK_PATH);
        }
    }, []);

    const fetchAccounts = useCallback(async () => {
        try {
            const res = await fetch('/api/whatsapp-cloud?action=accounts');
            const data = await res.json();
            if (data.accounts) setAccounts(data.accounts);
        } catch (err) {
            console.error('Error fetching cloud accounts:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

    const handleCreate = async () => {
        if (!form.displayName.trim() || !form.phoneNumberId.trim() || !form.accessToken.trim() || !form.wabaId.trim() || !form.appSecret.trim() || !form.verifyToken.trim()) {
            alert('Por favor completa todos los campos requeridos.');
            return;
        }
        setCreating(true);
        try {
            const res = await fetch('/api/whatsapp-cloud', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'create', ...form }),
            });
            const data = await res.json();
            if (data.success) {
                setForm({ displayName: '', phoneNumberId: '', wabaId: '', accessToken: '', appSecret: '', verifyToken: generateToken(), apiVersion: 'v21.0' });
                setShowForm(false);
                await fetchAccounts();
            } else {
                alert(data.error ?? 'Error al crear la cuenta');
            }
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (accountId: string, name: string) => {
        if (!confirm(`Eliminar cuenta "${name}"? Los leads asociados no se eliminarán.`)) return;
        await fetch('/api/whatsapp-cloud', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete', accountId }),
        });
        await fetchAccounts();
    };

    const handleTest = async (accountId: string) => {
        setTestingId(accountId);
        setTestResults(prev => ({ ...prev, [accountId]: null }));
        try {
            const res = await fetch('/api/whatsapp-cloud', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'test', accountId }),
            });
            const data = await res.json();
            setTestResults(prev => ({ ...prev, [accountId]: data }));
            if (data.success) await fetchAccounts();
        } finally {
            setTestingId(null);
        }
    };

    const copyWebhookUrl = async () => {
        await navigator.clipboard.writeText(webhookUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const copyVerifyToken = async (token: string) => {
        await navigator.clipboard.writeText(token);
    };

    return (
        <div className="p-6 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Cloud className="text-brand" size={22} />
                    WhatsApp Cloud API
                </h2>
                {!showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="px-4 py-2 bg-brand hover:bg-brand/90 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <Plus size={16} />
                        Agregar cuenta
                    </button>
                )}
            </div>

            {/* Webhook URL banner */}
            <div className="mb-5 p-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs text-zinc-500 mb-0.5">URL del Webhook (copiar a Meta Developer Portal)</p>
                    <p className="text-xs font-mono text-zinc-700 dark:text-zinc-300 truncate">{webhookUrl}</p>
                </div>
                <button
                    onClick={copyWebhookUrl}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 border border-zinc-300 dark:border-zinc-600 rounded-md text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                >
                    <Copy size={12} />
                    {copied ? 'Copiado' : 'Copiar'}
                </button>
            </div>

            {/* Add form */}
            {showForm && (
                <div className="mb-6 p-5 border-2 border-dashed border-brand/30 rounded-lg bg-brand/5 space-y-4">
                    <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Nueva cuenta Cloud API</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Nombre / Etiqueta *</label>
                            <input
                                type="text"
                                placeholder="Ej: Ventas Cloud"
                                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-sm focus:border-brand outline-none"
                                value={form.displayName}
                                onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Phone Number ID *</label>
                            <input
                                type="text"
                                placeholder="Ej: 123456789012345"
                                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-sm focus:border-brand outline-none font-mono"
                                value={form.phoneNumberId}
                                onChange={e => setForm(f => ({ ...f, phoneNumberId: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">WABA ID *</label>
                            <input
                                type="text"
                                placeholder="WhatsApp Business Account ID"
                                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-sm focus:border-brand outline-none font-mono"
                                value={form.wabaId}
                                onChange={e => setForm(f => ({ ...f, wabaId: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">API Version</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-sm focus:border-brand outline-none font-mono"
                                value={form.apiVersion}
                                onChange={e => setForm(f => ({ ...f, apiVersion: e.target.value }))}
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Access Token (System User Token) *</label>
                            <input
                                type="password"
                                placeholder="EAAxxxxxxxxxx..."
                                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-sm focus:border-brand outline-none font-mono"
                                value={form.accessToken}
                                onChange={e => setForm(f => ({ ...f, accessToken: e.target.value }))}
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">App Secret *</label>
                            <input
                                type="password"
                                placeholder="App Secret de Meta Developer Portal"
                                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-sm focus:border-brand outline-none font-mono"
                                value={form.appSecret}
                                onChange={e => setForm(f => ({ ...f, appSecret: e.target.value }))}
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Verify Token *</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-sm focus:border-brand outline-none font-mono"
                                    value={form.verifyToken}
                                    onChange={e => setForm(f => ({ ...f, verifyToken: e.target.value }))}
                                />
                                <button
                                    type="button"
                                    onClick={() => setForm(f => ({ ...f, verifyToken: generateToken() }))}
                                    className="px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                                >
                                    Generar
                                </button>
                            </div>
                            <p className="text-xs text-zinc-400 mt-1">Copia este token al campo "Verify Token" al configurar el webhook en Meta.</p>
                        </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                        <button
                            onClick={() => { setShowForm(false); }}
                            className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleCreate}
                            disabled={creating}
                            className="px-4 py-2 bg-brand hover:bg-brand/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                            {creating ? 'Guardando...' : 'Guardar cuenta'}
                        </button>
                    </div>
                </div>
            )}

            {/* Accounts list */}
            {loading ? (
                <div className="flex flex-col items-center justify-center p-12 text-zinc-500">
                    <RefreshCw className="animate-spin mb-2" size={20} />
                    <span className="text-sm">Cargando cuentas...</span>
                </div>
            ) : accounts.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-lg text-center">
                    <Cloud size={40} className="text-zinc-300 mb-3" />
                    <p className="text-zinc-600 dark:text-zinc-400 mb-1">No hay cuentas Cloud API configuradas</p>
                    <p className="text-sm text-zinc-400">Conecta tu número de Meta Business para recibir leads por WhatsApp Cloud.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {accounts.map(acc => (
                        <AccountCard
                            key={acc.id}
                            account={acc}
                            testResult={testResults[acc.id]}
                            testing={testingId === acc.id}
                            onDelete={handleDelete}
                            onTest={handleTest}
                            onCopyToken={copyVerifyToken}
                        />
                    ))}
                </div>
            )}

            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-100 dark:border-blue-800 flex gap-3 text-sm text-blue-700 dark:text-blue-300">
                <AlertCircle className="shrink-0 mt-0.5" size={16} />
                <p>
                    <strong>Nota:</strong> Configura el webhook en Meta Developer Portal con la URL mostrada arriba y el Verify Token de cada cuenta. No es necesario escanear QR — Meta entrega los mensajes directamente al servidor.
                </p>
            </div>
        </div>
    );
}

function AccountCard({
    account, testResult, testing, onDelete, onTest, onCopyToken,
}: {
    account: CloudAccount;
    testResult?: { success: boolean; displayPhone?: string; verifiedName?: string; error?: string } | null;
    testing: boolean;
    onDelete: (id: string, name: string) => void;
    onTest: (id: string) => void;
    onCopyToken: (token: string) => void;
}) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50">
                <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${account.active ? 'bg-green-100 dark:bg-green-900/40 text-green-600' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}>
                        <Cloud size={15} />
                    </div>
                    <div className="min-w-0">
                        <p className="font-medium text-sm">{account.displayName}</p>
                        <p className="text-xs text-zinc-500 truncate">
                            {account.phone ? account.phone : `ID: ${account.phoneNumberId}`}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${account.active ? 'text-green-600 bg-green-50 dark:bg-green-900/30' : 'text-zinc-500 bg-zinc-100 dark:bg-zinc-800'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${account.active ? 'bg-green-500 animate-pulse' : 'bg-zinc-400'}`} />
                        {account.active ? 'Activo' : 'Inactivo'}
                    </span>
                    <button
                        onClick={() => setExpanded(e => !e)}
                        className="p-1.5 rounded text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                        title="Ver detalles"
                    >
                        {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>
                    <button
                        onClick={() => onDelete(account.id, account.displayName)}
                        className="p-1.5 rounded text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Eliminar"
                    >
                        <Trash2 size={15} />
                    </button>
                </div>
            </div>

            {expanded && (
                <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                        <div>
                            <span className="text-zinc-400">Phone Number ID</span>
                            <p className="font-mono text-zinc-700 dark:text-zinc-300 truncate">{account.phoneNumberId}</p>
                        </div>
                        <div>
                            <span className="text-zinc-400">WABA ID</span>
                            <p className="font-mono text-zinc-700 dark:text-zinc-300 truncate">{account.wabaId}</p>
                        </div>
                        <div>
                            <span className="text-zinc-400">API Version</span>
                            <p className="font-mono text-zinc-700 dark:text-zinc-300">{account.apiVersion}</p>
                        </div>
                        <div>
                            <span className="text-zinc-400">Verify Token</span>
                            <div className="flex items-center gap-1.5">
                                <p className="font-mono text-zinc-700 dark:text-zinc-300 truncate">{account.verifyToken}</p>
                                <button
                                    onClick={() => onCopyToken(account.verifyToken)}
                                    className="text-zinc-400 hover:text-zinc-600 transition-colors shrink-0"
                                    title="Copiar"
                                >
                                    <Copy size={11} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onTest(account.id)}
                            disabled={testing}
                            className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-300 dark:border-zinc-600 rounded-lg text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
                        >
                            {testing ? <RefreshCw size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                            {testing ? 'Probando...' : 'Probar conexión'}
                        </button>
                        {testResult && (
                            <span className={`flex items-center gap-1 text-xs ${testResult.success ? 'text-green-600' : 'text-red-500'}`}>
                                {testResult.success ? (
                                    <>
                                        <CheckCircle size={12} />
                                        {testResult.displayPhone ? `${testResult.displayPhone}${testResult.verifiedName ? ` (${testResult.verifiedName})` : ''}` : 'Credenciales válidas'}
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle size={12} />
                                        {testResult.error ?? 'Error de credenciales'}
                                    </>
                                )}
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
