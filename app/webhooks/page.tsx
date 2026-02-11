import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Copy, Globe, Share2, Activity, Workflow, Webhook, Save } from 'lucide-react';
import { CopyButton } from '@/components/CopyButton';
import { updateSettings } from '@/app/actions/settings';

export const dynamic = 'force-dynamic';

export default async function WebhooksPage() {
    const session = await getSession();
    if (!session?.user?.organizationId) {
        redirect('/login');
    }

    const [webhookConfig, organization] = await Promise.all([
        prisma.systemConfig.findUnique({
            where: {
                organizationId_key: {
                    organizationId: session.user.organizationId,
                    key: 'n8n_webhook_url'
                }
            }
        }),
        prisma.organization.findUnique({
            where: { id: session.user.organizationId },
            select: { apiKey: true }
        })
    ]);

    const currentWebhook = webhookConfig?.value || "";
    const apiKey = organization?.apiKey || '';

    async function action(formData: FormData) {
        'use server'
        await updateSettings(formData);
    }

    const sources = [
        { name: 'n8n Automation', id: 'n8n', icon: Workflow },
        { name: 'Meta / Facebook Ads', id: 'facebook', icon: Globe },
        { name: 'TikTok Ads', id: 'tiktok', icon: Share2 },
        { name: 'Google Ads', id: 'google', icon: Activity },
        { name: 'Formulario Web', id: 'web', icon: Globe },
    ];

    // Get base URL (assuming localhost or deployed url)
    // In production we should use process.env.NEXT_PUBLIC_APP_URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    return (
        <main className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 p-8">
            <div className="max-w-4xl mx-auto">
                <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-brand mb-8 transition-colors">
                    <ArrowLeft size={18} /> Volver al Inicio
                </Link>

                <header className="mb-10">
                    <h1 className="text-3xl font-light mb-4 flex items-center gap-3">
                        Integración de <span className="text-brand font-semibold">Webhooks</span>
                    </h1>
                    <p className="text-zinc-500">
                        Conecta tus fuentes de leads externas enviando peticiones POST a las siguientes URLs.
                        El sistema calificará automáticamente cada lead entrante.
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                    {sources.map(source => {
                        const webhookUrl = `${baseUrl}/api/webhooks`;
                        const urlWithSource = `${webhookUrl}?source=${source.id}&apiKey=${apiKey}`;
                        const Icon = source.icon;

                        return (
                            <div key={source.id} className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-white dark:bg-black rounded-full border border-zinc-100 dark:border-zinc-800 text-brand">
                                        <Icon size={20} />
                                    </div>
                                    <h3 className="font-semibold text-lg">{source.name}</h3>
                                </div>

                                <div className="bg-zinc-100 dark:bg-black p-4 rounded border border-zinc-200 dark:border-zinc-800 font-mono text-xs md:text-sm text-zinc-600 dark:text-zinc-400 break-all flex justify-between items-center gap-4">
                                    <span>{urlWithSource}</span>
                                    <CopyButton text={urlWithSource} />
                                </div>

                                <div className="mt-4 text-xs text-zinc-500">
                                    <p className="mb-1"><span className="font-semibold">Método:</span> POST</p>
                                    <p><span className="font-semibold">Body (JSON):</span> {`{ "name": "...", "email": "...", "phone": "..." }`}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-12 pt-10 border-t border-zinc-100 dark:border-zinc-800">
                    <header className="mb-6">
                        <h2 className="text-2xl font-light mb-2 flex items-center gap-3">
                            Webhook de <span className="text-brand font-semibold">Salida</span>
                        </h2>
                        <p className="text-zinc-500">
                            Envía los datos procesados de vuelta a n8n, Zapier, o tu CRM.
                        </p>
                    </header>

                    <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 md:p-8 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-brand"></div>

                        <form action={action}>
                            <div className="mb-6">
                                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                                    <Webhook size={18} /> URL de Destino (POST)
                                </label>
                                <p className="text-xs text-zinc-500 mb-2">
                                    El sistema enviará el JSON del lead a esta dirección inmediatamente después de calificarlo.
                                </p>
                                <input
                                    type="url"
                                    name="n8n_webhook_url"
                                    placeholder="https://g1.n8n.cloud/webhook/..."
                                    className="w-full p-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-black text-sm outline-none focus:border-brand transition-colors"
                                    defaultValue={currentWebhook}
                                />
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    className="flex items-center gap-2 bg-brand text-white px-6 py-2 rounded shadow hover:bg-amber-600 transition-colors font-medium text-sm"
                                >
                                    <Save size={16} />
                                    Guardar Configuración
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Structure Reference Section */}
                <div className="mt-12 pt-10 border-t border-zinc-100 dark:border-zinc-800">
                    <header className="mb-6">
                        <h2 className="text-lg font-medium mb-2">Estructura del Payload (JSON)</h2>
                        <p className="text-zinc-500 text-sm">
                            Este es el formato de los datos que recibirás en tu webhook. Úsalo para mapear los campos en tu plataforma de destino.
                        </p>
                    </header>

                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 overflow-x-auto">
                        <pre className="text-xs md:text-sm font-mono text-zinc-300">
                            {`{
  "id": "cm...unique_id",
  "name": "Juan Pérez",
  "email": "juan@empresa.com",
  "phone": "+57 300 123 4567",
  "company": "Tech Solutions SAS",
  "role": "CTO",
  "initialScore": 85,
  "status": "Nuevo",
  "notes": "Lead calificado positivamente. Cumple con criterio corporativo...",
  "source": "web",
  "rawData": "{\\"name\\":\\"Juan Pérez\\", ...}",
  "createdAt": "2024-02-02T10:00:00.000Z"
}`}
                        </pre>
                    </div>
                </div>

            </div>
        </main>
    );
}
