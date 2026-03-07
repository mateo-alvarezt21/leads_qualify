'use client'

import { useState } from 'react';
import { useLanguage } from '@/lib/i18n';
import { Language } from '@/lib/translations';

export function LanguageToggle() {
    const { lang, setLang, t } = useLanguage();
    const [pending, setPending] = useState<Language | null>(null);

    const handleClick = (newLang: Language) => {
        if (newLang === lang) return;
        setPending(newLang);
    };

    const confirm = () => {
        if (pending) {
            setLang(pending);
            setPending(null);
        }
    };

    const cancel = () => setPending(null);

    return (
        <>
            <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                <button
                    onClick={() => handleClick('es')}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                        lang === 'es'
                            ? 'bg-white dark:bg-zinc-700 text-brand shadow-sm'
                            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                    }`}
                >
                    ES
                </button>
                <button
                    onClick={() => handleClick('en')}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                        lang === 'en'
                            ? 'bg-white dark:bg-zinc-700 text-brand shadow-sm'
                            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                    }`}
                >
                    EN
                </button>
            </div>

            {pending && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 shadow-xl max-w-sm w-full mx-4">
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
                            {t.settings.langConfirm}
                        </p>
                        <p className="text-xs text-zinc-500 mb-5">
                            {lang === 'es' ? 'ES' : 'EN'} → {pending === 'en' ? 'EN' : 'ES'}
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={cancel}
                                className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                            >
                                {t.settings.langConfirmNo}
                            </button>
                            <button
                                onClick={confirm}
                                className="px-4 py-2 text-sm bg-brand text-white rounded hover:bg-amber-600 transition-colors font-medium"
                            >
                                {t.settings.langConfirmYes}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
