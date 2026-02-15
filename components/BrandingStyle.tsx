import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function BrandingStyle() {
    const session = await getSession();
    if (!session?.user?.organizationId) return null;

    const org = await prisma.organization.findUnique({
        where: { id: session.user.organizationId },
        select: { brandColor: true },
    });

    if (!org?.brandColor) return null;

    return (
        <style dangerouslySetInnerHTML={{
            __html: `:root { --color-brand: ${org.brandColor} !important; --color-primary: ${org.brandColor} !important; --color-accent: ${org.brandColor} !important; }`
        }} />
    );
}
