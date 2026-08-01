import { PiFileTextBold } from 'react-icons/pi';

import { UsageReportBuilder } from '@/components/admin/network/usage-reports/UsageReportBuilder';
// PROTOTYPE (#688) — throwaway; lives only on prototype/usage-reports-dashboard.
import { PrototypeShell } from '@/components/admin/network/usage-reports/prototype/PrototypeShell';
import type { ProtoVariantKey } from '@/components/admin/network/usage-reports/prototype/PrototypeSwitcher';
import { ChartPrototypeShell } from '@/components/admin/network/usage-reports/prototype/ChartPrototypeShell';
import type { ChartVariantKey } from '@/components/admin/network/usage-reports/prototype/ChartVariants';

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

  // PROTOTYPE (#692) — ?chart=A|B|C renders the throwaway chart variants.
  const chart = firstParam(params.chart)?.toUpperCase();
  if (chart === 'A' || chart === 'B' || chart === 'C') {
    return <ChartPrototypeShell variant={chart as ChartVariantKey} />;
  }

  // PROTOTYPE (#688) — ?variant=A|B|C renders the throwaway dashboard variants.
  const variant = firstParam(params.variant)?.toUpperCase();
  if (variant === 'A' || variant === 'B' || variant === 'C') {
    return <PrototypeShell variant={variant as ProtoVariantKey} />;
  }

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
