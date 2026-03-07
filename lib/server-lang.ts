import { cookies } from 'next/headers';
import { Language, getTranslation, Translations } from './translations';

export async function getServerTranslation(): Promise<{ lang: Language; t: Translations }> {
    const cookieStore = await cookies();
    const lang = (cookieStore.get('lang')?.value as Language) ?? 'es';
    return { lang, t: getTranslation(lang) };
}
