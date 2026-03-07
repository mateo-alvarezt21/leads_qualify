import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { LeadTable } from '@/components/LeadTable';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { NavHeader } from '@/components/NavHeader';
import { Prisma } from '@prisma/client';
import { getSession } from '@/lib/auth';
import { getLeadStatuses } from '@/app/actions/leadStatuses';

export const dynamic = 'force-dynamic';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams.page) || 1;
  const pageSize = 10;
  const skip = (page - 1) * pageSize;

  const search = typeof resolvedSearchParams.search === 'string' ? resolvedSearchParams.search : undefined;
  const status = typeof resolvedSearchParams.status === 'string' && resolvedSearchParams.status !== 'Todos' ? resolvedSearchParams.status : undefined;
  const source = typeof resolvedSearchParams.source === 'string' && resolvedSearchParams.source !== 'Todos' ? resolvedSearchParams.source : undefined;

  const session = await getSession();
  if (!session || !session.user || !session.user.organizationId) {
    redirect('/login');
  }

  const where: Prisma.LeadWhereInput = {
    organizationId: session.user.organizationId,
    ...(search && {
      OR: [
        { name: { contains: search } },
        { email: { contains: search } },
        { company: { contains: search } }
      ]
    }),
    ...(status && { status }),
    ...(source && { source }),
  };

  const [leads, totalCount, organization, customFields, leadStatuses] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      include: {
        whatsappInstance: {
          select: { id: true, name: true, phone: true }
        }
      }
    }),
    prisma.lead.count({ where }),
    prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      select: { logo: true, brandColor: true, name: true, appNameFirst: true, appNameSecond: true },
    }),
    prisma.customField.findMany({
      where: { organizationId: session.user.organizationId },
      orderBy: { position: 'asc' },
    }),
    getLeadStatuses(session.user.organizationId),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const customColor = organization?.brandColor || null;
  const customLogo = organization?.logo || null;

  return (
    <main className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-zinc-100"
      {...(customColor ? { style: { '--color-brand': customColor, '--color-primary': customColor, '--color-accent': customColor } as React.CSSProperties } : {})}
    >
      <NavHeader
        role={session.user.role}
        customLogo={customLogo}
        orgName={organization?.name ?? null}
        appNameFirst={organization?.appNameFirst ?? null}
        appNameSecond={organization?.appNameSecond ?? null}
      />

      <div className="max-w-7xl mx-auto p-6 md:p-8">
        <LeadTable
          initialLeads={leads}
          totalPages={totalPages}
          currentPage={page}
          totalCount={totalCount}
          customFields={customFields}
          leadStatuses={leadStatuses}
        />

        <AnalyticsDashboard organizationId={session.user.organizationId} />
      </div>
    </main>
  );
}
