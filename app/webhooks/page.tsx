import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Globe, Share2, Activity, Workflow, Webhook, Save } from 'lucide-react';
import { CopyButton } from '@/components/CopyButton';
import { updateSettings } from '@/app/actions/settings';
import { getServerTranslation } from '@/lib/server-lang';

export const dynamic = 'force-dynamic';

export default async function WebhooksPage() {
    const session = await getSession();
    if (!session?.user?.organizationId) {
        redirect('/login');
    }

    const { t } = await getServerTranslation();

    const [webhookConfig, organization, customFields] = await Promise.all([
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
        }),
        prisma.customField.findMany({
            where: { organizationId: session.user.organizationId },
            orderBy: { position: 'asc' },
        }),
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
        { name: t.webhooks.formularioWeb, id: 'web', icon: Globe },
    ];

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    return (
        <main className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 p-8">
            <div className="max-w-4xl mx-auto">
                <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-brand mb-8 transition-colors">
                    <ArrowLeft size={18} /> {t.nav.backToHome}
                </Link>

                <header className="mb-10">
                    <h1 className="text-3xl font-light mb-4 flex items-center gap-3">
                        {t.webhooks.title} <span className="text-brand font-semibold">{t.webhooks.titleHighlight}</span>
                    </h1>
                    <p className="text-zinc-500">
                        {t.webhooks.subtitle}
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
                                    <p className="mb-1"><span className="font-semibold">{t.webhooks.method}:</span> POST</p>
                                    <p><span className="font-semibold">Body (JSON):</span> {`{ "name": "...", "email": "...", "phone": "..." }`}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-12 pt-10 border-t border-zinc-100 dark:border-zinc-800">
                    <header className="mb-6">
                        <h2 className="text-2xl font-light mb-2 flex items-center gap-3">
                            {t.webhooks.outgoingTitle} <span className="text-brand font-semibold">{t.webhooks.outgoingTitleHighlight}</span>
                        </h2>
                        <p className="text-zinc-500">
                            {t.webhooks.outgoingDesc}
                        </p>
                    </header>

                    <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 md:p-8 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-brand"></div>

                        <form action={action}>
                            <div className="mb-6">
                                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                                    <Webhook size={18} /> {t.webhooks.destinationUrl}
                                </label>
                                <p className="text-xs text-zinc-500 mb-2">
                                    {t.webhooks.destinationUrlDesc}
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
                                    {t.webhooks.save}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Custom Fields Documentation */}
                {customFields.length > 0 && (
                    <div className="mt-12 pt-10 border-t border-zinc-100 dark:border-zinc-800">
                        <header className="mb-6">
                            <h2 className="text-lg font-medium mb-2">{t.webhooks.orgFields}</h2>
                            <p className="text-zinc-500 text-sm">
                                {t.webhooks.orgFieldsDesc}
                            </p>
                        </header>

                        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase">{t.webhooks.jsonKey}</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase">{t.webhooks.label}</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase">{t.webhooks.type}</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase">{t.webhooks.fieldStatus}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                    {customFields.map(cf => (
                                        <tr key={cf.id} className="bg-white dark:bg-black">
                                            <td className="px-4 py-3 font-mono text-brand">{cf.fieldName}</td>
                                            <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{cf.fieldLabel}</td>
                                            <td className="px-4 py-3 text-zinc-500">{cf.fieldType}</td>
                                            <td className="px-4 py-3">
                                                {cf.required ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                                                        {t.webhooks.required}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                                                        {t.webhooks.optional}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-6">
                            <p className="text-sm text-zinc-500 mb-3">{t.webhooks.exampleRequest}</p>
                            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 overflow-x-auto">
                                <pre className="text-xs md:text-sm font-mono text-zinc-300 whitespace-pre-wrap">
{`curl -X POST ${process.env.NEXT_PUBLIC_APP_URL || 'https://tu-dominio.com'}/api/webhooks \\
  -H "x-api-key: ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Juan Pérez",
    "email": "juan@empresa.com",
    "phone": "+57 300 123 4567",
    "company": "Tech Solutions SAS",${customFields.map(cf => `
    "${cf.fieldName}": ""  ← ${cf.fieldLabel}${cf.required ? ` (${t.webhooks.required.toLowerCase()})` : ` (${t.webhooks.optional.toLowerCase()})`}`).join(',')}
  }'`}
                                </pre>
                            </div>
                        </div>
                    </div>
                )}

                {/* Structure Reference Section */}
                <div className="mt-12 pt-10 border-t border-zinc-100 dark:border-zinc-800">
                    <header className="mb-6">
                        <h2 className="text-lg font-medium mb-2">{t.webhooks.payloadTitle}</h2>
                        <p className="text-zinc-500 text-sm">
                            {t.webhooks.payloadDesc}
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
