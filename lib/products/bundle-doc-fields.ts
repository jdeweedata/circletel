import type { FlyerTermMonths } from '@/lib/types/product-lines';

export type FlyerBuyerType = 'soho' | 'smb' | 'either';

export interface FlyerWizardFields {
  name: string;
  code: string;
  tagline: string;
  buyerType: FlyerBuyerType;
  salesBlurb: string;
  billedInclVat: number;
  termMonths: FlyerTermMonths;
  connectivityName: string;
  connectivityCostExcl: number;
  heliosIncludesCpe: boolean;
  cpeName: string;
  cpeCostExcl: number;
  m365Seats: number;
  needsSiteCheck: boolean;
  supportHours: string;
  fairUse: string;
  needsNewIt: boolean;
}

export function slugifyFlyerCode(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 48);
}

export function documentRef(kind: 'CPS' | 'BRD', code: string, year = 2026): string {
  const compact = code.replace(/[^A-Za-z0-9]+/g, '-').toUpperCase();
  return `CT-${kind}-${compact}-${year}-001`;
}
