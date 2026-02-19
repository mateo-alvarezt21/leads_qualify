import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BrandingStyle } from "@/components/BrandingStyle";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.leadquality.co';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'LeadQuality — Calificación Inteligente de Leads',
    template: '%s | LeadQuality',
  },
  description:
    'Plataforma SaaS para calificar y gestionar leads con inteligencia artificial. Recibe leads por webhook, califícalos automáticamente con GPT-4o y gestiona tu embudo de ventas.',
  keywords: [
    'lead scoring',
    'calificación de leads',
    'CRM',
    'inteligencia artificial',
    'GPT-4',
    'ventas',
    'leads',
    'webhook',
    'calificación automática',
  ],
  authors: [{ name: 'LeadQuality' }],
  creator: 'LeadQuality',
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    url: APP_URL,
    siteName: 'LeadQuality',
    title: 'LeadQuality — Calificación Inteligente de Leads',
    description:
      'Plataforma SaaS para calificar y gestionar leads con inteligencia artificial.',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'LeadQuality' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LeadQuality — Calificación Inteligente de Leads',
    description:
      'Plataforma SaaS para calificar y gestionar leads con inteligencia artificial.',
    images: ['/opengraph-image'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <BrandingStyle />
        {children}

        <footer className="mt-12 py-8 text-center border-t border-zinc-100 dark:border-zinc-900">
          <p className="text-xs text-zinc-400 font-medium">
            Creado con <span className="text-red-500">❤</span> en Medellín, Colombia
          </p>
        </footer>
      </body>
    </html>
  );
}
