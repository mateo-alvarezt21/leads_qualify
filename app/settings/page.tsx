import { prisma } from '@/lib/prisma';
import { updateSettings } from '@/app/actions/settings';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Users } from 'lucide-react';
import { WhatsAppSettings } from '@/components/WhatsAppSettings';
import { BrandingSettings } from '@/components/BrandingSettings';
import { CustomFieldsSettings } from '@/components/CustomFieldsSettings';
import { LogoutButton } from '@/components/LogoutButton';
import { DEFAULT_SCORING_PROMPT } from '@/lib/constants';
import { LanguageToggle } from '@/components/LanguageToggle';
import { getServerTranslation } from '@/lib/server-lang';
import { LeadStatusSettings } from '@/components/LeadStatusSettings';
import { getLeadStatuses } from '@/app/actions/leadStatuses';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
    const session = await getSession();
    if (!session?.user?.organizationId) {
        redirect('/login');
    }

    const { t } = await getServerTranslation();
    const orgId = session.user.organizationId;

    const [promptConfig, welcomeConfig, waScoringConfig, bufferTimeoutConfig, organization, customFields, leadStatuses] = await Promise.all([
        prisma.systemConfig.findUnique({
            where: { organizationId_key: { organizationId: orgId, key: 'scoring_prompt' } }
        }),
        prisma.systemConfig.findUnique({
            where: { organizationId_key: { organizationId: orgId, key: 'whatsapp_welcome_message' } }
        }),
        prisma.systemConfig.findUnique({
            where: { organizationId_key: { organizationId: orgId, key: 'whatsapp_scoring_prompt' } }
        }),
        prisma.systemConfig.findUnique({
            where: { organizationId_key: { organizationId: orgId, key: 'whatsapp_buffer_timeout' } }
        }),
        prisma.organization.findUnique({
            where: { id: orgId },
            select: { name: true, logo: true, brandColor: true },
        }),
        prisma.customField.findMany({
            where: { organizationId: orgId },
            orderBy: { position: 'asc' },
        }),
        getLeadStatuses(orgId),
    ]);

    const currentPrompt = promptConfig?.value || DEFAULT_SCORING_PROMPT;
    const currentWelcome = welcomeConfig?.value ?? 'Hola {nombre}, hemos recibido tu mensaje. Un asesor te contactara pronto.';
    const currentWaScoringPrompt = waScoringConfig?.value ?? '';
    const currentBufferTimeout = bufferTimeoutConfig?.value ?? '2';

    async function action(formData: FormData) {
        'use server'
        await updateSettings(formData);
    }

    return (
        <main className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-brand transition-colors">
                        <ArrowLeft size={18} /> {t.nav.backToHome}
                    </Link>
                    <LogoutButton />
                </div>

                <h1 className="text-3xl font-light mb-8">{t.settings.title} <span className="text-brand font-semibold">{t.settings.titleHighlight}</span></h1>

                <div className="space-y-8">
                    {/* Main Config Form */}
                    <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 md:p-8 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-brand"></div>

                        <form action={action} className="space-y-8">

                            {/* Prompt Section */}
                            <div>
                                <h2 className="text-xl font-medium mb-4">{t.settings.systemPrompt}</h2>
                                <p className="text-zinc-500 mb-4 text-sm">
                                    {t.settings.systemPromptDesc}
                                </p>
                                <textarea
                                    name="prompt"
                                    className="w-full h-48 p-4 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-black font-mono text-sm outline-none focus:border-brand transition-colors resize-y"
                                    defaultValue={currentPrompt}
                                />
                            </div>

                            {/* WhatsApp Scoring Prompt */}
                            <div>
                                <h2 className="text-xl font-medium mb-4">{t.settings.whatsappScoringPrompt}</h2>
                                <p className="text-zinc-500 mb-2 text-sm">
                                    {t.settings.whatsappScoringPromptDesc}
                                </p>
                                <textarea
                                    name="whatsapp_scoring_prompt"
                                    className="w-full h-36 p-4 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-black font-mono text-sm outline-none focus:border-brand transition-colors resize-y"
                                    defaultValue={currentWaScoringPrompt}
                                    placeholder="Analiza la conversacion del contacto por WhatsApp..."
                                />
                            </div>

                            {/* WhatsApp Buffer Timeout */}
                            <div>
                                <h2 className="text-xl font-medium mb-4">{t.settings.whatsappBufferTimeout}</h2>
                                <p className="text-zinc-500 mb-2 text-sm">
                                    {t.settings.whatsappBufferTimeoutDesc}
                                </p>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="number"
                                        name="whatsapp_buffer_timeout"
                                        min="0.5"
                                        max="30"
                                        step="0.5"
                                        className="w-32 p-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-black text-sm outline-none focus:border-brand transition-colors"
                                        defaultValue={currentBufferTimeout}
                                    />
                                    <span className="text-zinc-500 text-sm">{t.settings.minutes}</span>
                                </div>
                            </div>

                            {/* WhatsApp Welcome Message */}
                            <div>
                                <h2 className="text-xl font-medium mb-4">{t.settings.whatsappWelcome}</h2>
                                <p className="text-zinc-500 mb-2 text-sm">
                                    {t.settings.whatsappWelcomeDesc1}
                                    <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded text-xs">{t.settings.whatsappWelcomeVar}</code>
                                    {t.settings.whatsappWelcomeDesc2}
                                </p>
                                <textarea
                                    name="whatsapp_welcome_message"
                                    className="w-full h-24 p-4 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-black font-mono text-sm outline-none focus:border-brand transition-colors resize-y"
                                    defaultValue={currentWelcome}
                                    placeholder="Hola {nombre}, gracias por escribirnos..."
                                />
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    className="flex items-center gap-2 bg-brand text-white px-6 py-2.5 rounded shadow hover:bg-amber-600 transition-colors font-medium"
                                >
                                    <Save size={18} />
                                    {t.settings.save}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Language */}
                    <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 md:p-8 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-brand"></div>
                        <h2 className="text-xl font-medium mb-2">{t.settings.language}</h2>
                        <p className="text-zinc-500 mb-4 text-sm">{t.settings.languageDescription}</p>
                        <LanguageToggle />
                    </div>

                    {/* WhatsApp Integration */}
                    <WhatsAppSettings />

                    {/* Branding - Admin only */}
                    {(session.user.role === 'admin' || session.user.role === 'superadmin') && (
                        <BrandingSettings
                            currentLogo={organization?.logo ?? null}
                            currentColor={organization?.brandColor ?? null}
                            orgName={organization?.name ?? 'Mi Organización'}
                        />
                    )}

                    {/* Lead Statuses */}
                    <LeadStatusSettings initialStatuses={leadStatuses} />

                    {/* Custom Fields - Admin only */}
                    {(session.user.role === 'admin' || session.user.role === 'superadmin') && (
                        <CustomFieldsSettings initialFields={customFields} />
                    )}
                </div>
            </div>

            {/* Users Section (Admin Only) */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link href="/settings/users" className="group block p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:border-brand transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full group-hover:bg-brand/10 group-hover:text-brand transition-colors">
                            <Users size={20} />
                        </div>
                        <h3 className="font-semibold text-lg">{t.settings.userManagement}</h3>
                    </div>
                    <p className="text-zinc-500 text-sm">
                        {t.settings.userManagementDesc}
                    </p>
                </Link>
            </div>
        </main>
    );
}
