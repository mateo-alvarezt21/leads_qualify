'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, Translations, getTranslation } from './translations';

interface LanguageContextType {
    lang: Language;
    setLang: (lang: Language) => void;
    t: Translations;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

function getCookie(name: string): string | undefined {
    if (typeof document === 'undefined') return undefined;
    const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : undefined;
}

function setCookie(name: string, value: string, days: number) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [lang, setLangState] = useState<Language>('es');

    useEffect(() => {
        const saved = getCookie('lang');
        if (saved === 'en' || saved === 'es') {
            setLangState(saved);
        }
    }, []);

    const setLang = (newLang: Language) => {
        setLangState(newLang);
        setCookie('lang', newLang, 365);
    };

    return (
        <LanguageContext.Provider value={{ lang, setLang, t: getTranslation(lang) }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const ctx = useContext(LanguageContext);
    if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
    return ctx;
}
