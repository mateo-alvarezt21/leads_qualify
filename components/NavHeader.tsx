'use client'

import Link from 'next/link';
import { Settings, BarChart3, Globe, Shield } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';

interface NavHeaderProps {
    role: string;
    customLogo: string | null;
    orgName: string | null;
    appNameFirst: string | null;
    appNameSecond: string | null;
}

export function NavHeader({ role, customLogo, orgName, appNameFirst, appNameSecond }: NavHeaderProps) {
    const { t } = useLanguage();

    return (
        <header className="border-b border-brand/20 bg-zinc-50/50 dark:bg-zinc-900/50 backdrop-blur-md sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    {customLogo ? (
                        <img src={customLogo} alt={orgName || 'Logo'} className="h-8 w-auto" />
                    ) : (
                        <div className="flex items-center">
                            <img src="/logo-cntxt.png" alt="CNTXT" className="h-8 w-auto" />
                            <sup className="text-[10px] text-zinc-400 ml-0.5">®</sup>
                        </div>
                    )}
                    <div className="w-px h-6 bg-zinc-300 dark:bg-zinc-700"></div>
                    <h1 className="text-xl font-light tracking-wide">
                        {appNameFirst || 'LEAD'}<span className="font-bold text-brand">{appNameSecond || 'QUALITY'}</span>
                    </h1>
                </div>

                <nav className="flex gap-4 items-center">
                    {role === 'superadmin' && (
                        <Link href="/admin" className="flex items-center gap-2 text-sm hover:text-brand transition-colors">
                            <Shield size={16} /> {t.nav.admin}
                        </Link>
                    )}
                    <Link href="/webhooks" className="flex items-center gap-2 text-sm hover:text-brand transition-colors">
                        <Globe size={16} /> {t.nav.webhooks}
                    </Link>
                    <Link href="/analysis" className="flex items-center gap-2 text-sm hover:text-brand transition-colors">
                        <BarChart3 size={16} /> {t.nav.analysis}
                    </Link>
                    <Link href="/settings" className="flex items-center gap-2 text-sm hover:text-brand transition-colors">
                        <Settings size={16} /> {t.nav.settings}
                    </Link>
                </nav>
            </div>
        </header>
    );
}
