import { UsageReportDashboard } from '@/components/admin/network/usage-reports/dashboard/UsageReportDashboard';

interface UsageReportsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function UsageReportsPage({
  searchParams,
}: UsageReportsPageProps) {
  const params = await searchParams;

  return (
    <UsageReportDashboard
      initialSiteId={firstParam(params.siteId)}
      initialUnjaniOnly={firstParam(params.unjani) === '1'}
    />
  );
}
