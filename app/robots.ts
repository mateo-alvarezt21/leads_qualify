import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.leadquality.co';

    return {
        rules: [
            {
                userAgent: '*',
                allow: ['/login', '/register', '/forgot-password'],
                disallow: [
                    '/',
                    '/settings',
                    '/webhooks',
                    '/analysis',
                    '/admin',
                    '/api/',
                ],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
