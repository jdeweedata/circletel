/**
 * Product-line lifecycle gates. Pure functions — no I/O.
 * DRAFT → ACTIVE requires CPS (always), BRD/FSD when flagged, finance sign-off, and pricing.
 */

import type {
  LifecycleGateResult,
  ProductLine,
  ProductLineLifecycle,
} from '@/lib/types/product-lines';

const ALLOWED: Record<ProductLineLifecycle, ProductLineLifecycle[]> = {
  idea: ['draft'],
  draft: ['active', 'archived'],
  active: ['inactive'],
  inactive: ['active', 'archived'],
  archived: ['draft'],
};

export function canTransition(
  from: ProductLineLifecycle,
  to: ProductLineLifecycle
): boolean {
  return ALLOWED[from]?.includes(to) ?? false;
}

export function isSalesQuotePackLine(
  line: Pick<ProductLine, 'gate1_eligible' | 'sellability'>
): boolean {
  return line.gate1_eligible && line.sellability !== 'not_gate_1';
}

export function evaluateDraftToActive(line: ProductLine): LifecycleGateResult {
  const items = [
    {
      label: 'CPS current',
      ok: line.cps_status === 'current',
      blocking: true,
      detail: line.cps_status === 'current' ? line.cps_path ?? undefined : 'Attach a current commercial spec',
    },
    {
      label: 'BRD current',
      ok: !line.brd_required || line.brd_status === 'current',
      blocking: line.brd_required,
      detail: line.brd_required && line.brd_status !== 'current' ? 'Business rules required for this line' : undefined,
    },
    {
      label: 'FSD current',
      ok: !line.fsd_required || line.fsd_status === 'current',
      blocking: line.fsd_required,
      detail: line.fsd_required && line.fsd_status !== 'current' ? 'Functional spec required (new system behaviour)' : undefined,
    },
    {
      label: 'Finance approved',
      ok: Boolean(line.finance_approved_at),
      blocking: true,
      detail: line.finance_approved_at ? undefined : 'Finance must sign off pricing and margin',
    },
    {
      label: 'List ARPU set',
      ok: line.list_arpu_zar != null && line.list_arpu_zar > 0,
      blocking: true,
      detail: line.list_arpu_zar ? undefined : 'Set excl-VAT list ARPU',
    },
  ];

  return {
    allowed: items.filter((i) => i.blocking).every((i) => i.ok),
    items,
  };
}

export function evaluateTransition(
  line: ProductLine,
  to: ProductLineLifecycle,
  extras?: { reason?: string; openQuotes?: number }
): LifecycleGateResult {
  if (!canTransition(line.lifecycle_stage, to)) {
    return {
      allowed: false,
      items: [
        {
          label: `Cannot move ${line.lifecycle_stage} → ${to}`,
          ok: false,
          blocking: true,
        },
      ],
    };
  }

  if (line.lifecycle_stage === 'draft' && to === 'active') {
    return evaluateDraftToActive(line);
  }

  if (line.lifecycle_stage === 'active' && to === 'inactive') {
    const ok = Boolean(extras?.reason?.trim());
    return {
      allowed: ok,
      items: [
        {
          label: 'Reason required',
          ok,
          blocking: true,
          detail: ok ? extras?.reason : 'Document why this line is pausing',
        },
      ],
    };
  }

  if (to === 'archived') {
    const open = extras?.openQuotes ?? 0;
    const ok = open === 0;
    return {
      allowed: ok,
      items: [
        {
          label: 'No open quotes',
          ok,
          blocking: true,
          detail: ok ? undefined : `${open} open quote(s) still reference this line`,
        },
      ],
    };
  }

  return { allowed: true, items: [] };
}
