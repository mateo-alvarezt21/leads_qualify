import { prisma } from '@/lib/prisma';
import { updateSettings } from '@/app/actions/settings';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Users, ExternalLink } from 'lucide-react';
import { WhatsAppSettings } from '@/components/WhatsAppSettings';
import { WhatsAppCloudSettings } from '@/components/WhatsAppCloudSettings';
import { BrandingSettings } from '@/components/BrandingSettings';
import { CustomFieldsSettings } from '@/components/CustomFieldsSettings';
import { LogoutButton } from '@/components/LogoutButton';
import { DEFAULT_SCORING_PROMPT } from '@/lib/constants';
import { LanguageToggle } from '@/components/LanguageToggle';
import { getServerTranslation } from '@/lib/server-lang';
import { LeadStatusSettings } from '@/components/LeadStatusSettings';
import { getLeadStatuses } from '@/app/actions/leadStatuses';
import { SettingsShell } from '@/components/SettingsShell';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
    const session = await getSession();
    if (!session?.user?.organizationId) {
        redirect('/login');
    }

    const { t } = await getServerTranslation();
    const orgId = session.user.organizationId;
    const isAdmin = session.user.role === 'admin' || session.user.role === 'superadmin';

    const [
        promptConfig, welcomeConfig, waScoringConfig, bufferTimeoutConfig,
        organization, customFields, leadStatuses,
    ] = await Promise.all([
        prisma.systemConfig.findUnique({ where: { organizationId_key: { organizationId: orgId, key: 'scoring_prompt' } } }),
        prisma.systemConfig.findUnique({ where: { organizationId_key: { organizationId: orgId, key: 'whatsapp_welcome_message' } } }),
        prisma.systemConfig.findUnique({ where: { organizationId_key: { organizationId: orgId, key: 'whatsapp_scoring_prompt' } } }),
        prisma.systemConfig.findUnique({ where: { organizationId_key: { organizationId: orgId, key: 'whatsapp_buffer_timeout' } } }),
        prisma.organization.findUnique({ where: { id: orgId }, select: { name: true, logo: true, brandColor: true } }),
        prisma.customField.findMany({ where: { organizationId: orgId }, orderBy: { position: 'asc' } }),
        getLeadStatuses(orgId),
    ]);

    const currentPrompt = promptConfig?.value || DEFAULT_SCORING_PROMPT;
    const currentWelcome = welcomeConfig?.value ?? 'Hola {nombre}, hemos recibido tu mensaje. Un asesor te contactara pronto.';
    const currentWaScoringPrompt = waScoringConfig?.value ?? '';
    const currentBufferTimeout = bufferTimeoutConfig?.value ?? '2';

    async function saveIASettings(formData: FormData) {
        'use server';
        await updateSettings(formData);
    }

    async function saveWhatsAppSettings(formData: FormData) {
        'use server';
        await updateSettings(formData);
    }

    /* ── Section contents ─────────────────────────────────────── */

    const iaSection = (
        <div className="space-y-6">
            <SectionHeader
                title="IA & Calificación"
                description="Configura cómo la IA evalúa y puntúa los leads entrantes de 0 a 100."
            />
            <form action={saveIASettings} className="space-y-6">
                <Field
                    label={t.settings.systemPrompt}
                    description={t.settings.systemPromptDesc}
                >
                    <textarea
                        name="prompt"
                        rows={10}
                        className="w-full p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900/50 font-mono text-sm outline-none focus:border-brand transition-colors resize-y"
                        defaultValue={currentPrompt}
                    />
                </Field>
                <SaveRow />
            </form>
        </div>
    );

    const whatsappSection = (
        <div className="space-y-8">
            <SectionHeader
                title="WhatsApp"
                description="Configura los parámetros de conversación y conecta tus líneas de WhatsApp."
            />

            {/* Config form */}
            <form action={saveWhatsAppSettings} className="space-y-6">
                <Field
                    label={t.settings.whatsappScoringPrompt}
                    description={t.settings.whatsappScoringPromptDesc}
                >
                    <textarea
                        name="whatsapp_scoring_prompt"
                        rows={5}
                        className="w-full p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900/50 font-mono text-sm outline-none focus:border-brand transition-colors resize-y"
                        defaultValue={currentWaScoringPrompt}
                        placeholder="Analiza la conversacion del contacto por WhatsApp..."
                    />
                </Field>

                <Field
                    label={t.settings.whatsappBufferTimeout}
                    description={t.settings.whatsappBufferTimeoutDesc}
                >
                    <div className="flex items-center gap-3">
                        <input
                            type="number"
                            name="whatsapp_buffer_timeout"
                            min="0.5"
                            max="30"
                            step="0.5"
                            className="w-28 px-3 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900/50 text-sm outline-none focus:border-brand transition-colors"
                            defaultValue={currentBufferTimeout}
                        />
                        <span className="text-zinc-500 text-sm">{t.settings.minutes}</span>
                    </div>
                </Field>

                <Field
                    label={t.settings.whatsappWelcome}
                    description={
                        <span>
                            {t.settings.whatsappWelcomeDesc1}
                            <code className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-xs font-mono mx-1">{t.settings.whatsappWelcomeVar}</code>
                            {t.settings.whatsappWelcomeDesc2}
                        </span>
                    }
                >
                    <textarea
                        name="whatsapp_welcome_message"
                        rows={3}
                        className="w-full p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900/50 font-mono text-sm outline-none focus:border-brand transition-colors resize-y"
                        defaultValue={currentWelcome}
                        placeholder="Hola {nombre}, gracias por escribirnos..."
                    />
                </Field>

                <SaveRow />
            </form>

            {/* WhatsApp Baileys */}
            <WhatsAppSettings />

            {/* WhatsApp Cloud API */}
            <WhatsAppCloudSettings />
        </div>
    );

    const aparienciaSection = (
        <div className="space-y-6">
            <SectionHeader
                title="Idioma & Marca"
                description="Personaliza el idioma de la interfaz y la identidad visual de tu organización."
            />

            <Card>
                <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">{t.settings.language}</h3>
                <p className="text-xs text-zinc-500 mb-4">{t.settings.languageDescription}</p>
                <LanguageToggle />
            </Card>

            {isAdmin && (
                <BrandingSettings
                    currentLogo={organization?.logo ?? null}
                    currentColor={organization?.brandColor ?? null}
                    orgName={organization?.name ?? 'Mi Organización'}
                />
            )}
        </div>
    );

    const pipelineSection = (
        <div className="space-y-6">
            <SectionHeader
                title="Estados del Pipeline"
                description="Define los estados por los que pasan tus leads y personaliza su color e identificador."
            />
            <LeadStatusSettings initialStatuses={leadStatuses} />
        </div>
    );

    const camposSection = (
        <div className="space-y-6">
            <SectionHeader
                title="Campos personalizados"
                description="Agrega campos extra a tus leads para capturar información específica de tu negocio."
            />
            {isAdmin
                ? <CustomFieldsSettings initialFields={customFields} />
                : <p className="text-zinc-500 text-sm">Solo los administradores pueden gestionar campos personalizados.</p>
            }
        </div>
    );

    const usuariosSection = (
        <div className="space-y-6">
            <SectionHeader
                title="Usuarios"
                description="Gestiona los miembros de tu organización y sus roles de acceso."
            />
            <Link
                href="/settings/users"
                className="group flex items-center justify-between p-5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900/50 hover:border-brand transition-colors"
            >
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-brand/10 group-hover:text-brand transition-colors">
                        <Users size={18} />
                    </div>
                    <div>
                        <p className="font-semibold text-sm">{t.settings.userManagement}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">{t.settings.userManagementDesc}</p>
                    </div>
                </div>
                <ExternalLink size={16} className="text-zinc-400 group-hover:text-brand transition-colors" />
            </Link>
        </div>
    );

    /* ── Render ───────────────────────────────────────────────── */

    return (
        <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
            {/* Top bar */}
            <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 px-6 py-4">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <Link href="/" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-brand transition-colors">
                        <ArrowLeft size={16} />
                        {t.nav.backToHome}
                    </Link>
                    <h1 className="text-base font-semibold hidden sm:block">
                        {t.settings.title} <span className="text-brand">{t.settings.titleHighlight}</span>
                    </h1>
                    <LogoutButton />
                </div>
            </div>

            {/* Body */}
            <div className="max-w-6xl mx-auto px-6 py-8">
                <SettingsShell
                    sections={{
                        ia: iaSection,
                        whatsapp: whatsappSection,
                        apariencia: aparienciaSection,
                        pipeline: pipelineSection,
                        campos: camposSection,
                        usuarios: usuariosSection,
                    }}
                />
            </div>
        </main>
    );
}

/* ── Small helpers ──────────────────────────────────────────────── */

function SectionHeader({ title, description }: { title: string; description: string }) {
    return (
        <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800">
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="text-sm text-zinc-500 mt-1">{description}</p>
        </div>
    );
}

function Field({ label, description, children }: { label: string; description: React.ReactNode; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{label}</label>
            {description && <p className="text-xs text-zinc-500 mb-3">{description}</p>}
            {children}
        </div>
    );
}

function Card({ children }: { children: React.ReactNode }) {
    return (
        <div className="p-5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900/50">
            {children}
        </div>
    );
}

function SaveRow() {
    return (
        <div className="flex justify-end pt-2">
            <button
                type="submit"
                className="flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-lg shadow-sm hover:bg-amber-600 transition-colors text-sm font-medium"
            >
                <Save size={15} />
                Guardar
            </button>
        </div>
    );
}
