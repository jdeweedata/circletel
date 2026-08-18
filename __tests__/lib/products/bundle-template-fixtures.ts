import type { BundleTemplate } from '@/lib/products/bundle-pricing';

/** Test-only seed of the two original flyers. Runtime code must not import this. */
export const FIXTURE_OTG: BundleTemplate = {
  code: 'otg',
  name: 'OTG — On the Go',
  productLineCode: 'otg',
  billedInclVat: 399,
  defaultTermMonths: 12,
  defaultHeliosIncludesCpe: false,
  defaultM365Seats: 1,
  defaultConnectivityCostExcl: 174,
};

export const FIXTURE_CIRCLECONNECT: BundleTemplate = {
  code: 'circleconnect-5g-essential',
  name: 'CircleConnect 5G Essential',
  productLineCode: 'circleconnect-5g-essential',
  billedInclVat: 489,
  defaultTermMonths: 24,
  defaultHeliosIncludesCpe: true,
  defaultM365Seats: 0,
  defaultConnectivityCostExcl: 390.43,
  catalogueListExcl: 449,
  packageSku: 'CC-5G-CON-035',
};

export const FIXTURE_SOHO_MIFI: BundleTemplate = {
  code: 'soho-mifi',
  name: 'SOHO MiFi',
  productLineCode: 'soho-mifi',
  billedInclVat: 499,
  defaultTermMonths: 12,
  defaultHeliosIncludesCpe: false,
  defaultM365Seats: 0,
  defaultConnectivityCostExcl: 174,
};
