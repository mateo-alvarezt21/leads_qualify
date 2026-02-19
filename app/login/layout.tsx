import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Iniciar Sesión',
    description:
        'Accede a tu cuenta de LeadQuality para calificar y gestionar tus leads con inteligencia artificial.',
    robots: { index: true, follow: false },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
    return children;
}
