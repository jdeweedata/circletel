import { PiFileTextBold } from 'react-icons/pi';

import { UsageReportBuilder } from '@/components/admin/network/usage-reports/UsageReportBuilder';

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
  const initialSiteId = firstParam(params.siteId);
  const initialUnjaniOnly = firstParam(params.unjani) === '1';

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
          <PiFileTextBold className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Site Usage Reports</h1>
          <p className="mt-1 text-sm text-slate-600">
            Generate CircleTel-branded network usage reports for eligible corporate
            sites.
          </p>
        </div>
      </div>

      <UsageReportBuilder
        initialSiteId={initialSiteId}
        initialUnjaniOnly={initialUnjaniOnly}
      />
    </div>
  );
}
