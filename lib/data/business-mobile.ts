// CircleTel Business Mobile product data
// Connectivity products solving specific SME pain points — managed and delivered by CircleTel.

export interface BizMobileBundleFeature {
  text: string;
}

export interface BizMobileBundle {
  id: string;
  name: string;
  tagline: string;
  badge: string;
  badgeVariant: 'primary' | 'secondary' | 'navy' | 'purple';
  icon: string; // Material Symbols icon name
  priceFrom: string;
  priceSuffix: string;
  features: BizMobileBundleFeature[];
  ctaLabel: string;
  href: string;
  featured?: boolean;
}

export const BIZ_MOBILE_BUNDLES: BizMobileBundle[] = [
  {
    id: 'businessmobile',
    name: 'BusinessMobile',
    tagline: 'Device upgrades for your team — we handle the contracts, you hand out the phones.',
    badge: 'DEVICE PLANS',
    badgeVariant: 'primary',
    icon: 'smartphone',
    priceFrom: 'From R455',
    priceSuffix: '/mo',
    features: [
      { text: 'Latest devices on business plans' },
      { text: 'We handle all the paperwork' },
      { text: 'One CircleTel invoice per month' },
    ],
    ctaLabel: 'Choose a Device',
    href: '/business/mobile/businessmobile',
  },
  {
    id: 'officeconnect',
    name: 'OfficeConnect',
    tagline: 'High-speed internet, a free 5G router, and voice lines — one bill, one account.',
    badge: 'MOST POPULAR',
    badgeVariant: 'primary',
    icon: 'corporate_fare',
    priceFrom: 'From R1,269',
    priceSuffix: '/mo',
    features: [
      { text: 'Free 5G router included' },
      { text: 'Uncapped high-speed internet' },
      { text: '3 business voice lines' },
    ],
    ctaLabel: 'Connect My Office',
    href: '/business/mobile/officeconnect',
    featured: true,
  },
  {
    id: 'workconnect-mobile',
    name: 'WorkConnect Mobile',
    tagline: 'Your fixed wireless broadband bundled with a business mobile plan — one account.',
    badge: 'BROADBAND + MOBILE',
    badgeVariant: 'secondary',
    icon: 'home_work',
    priceFrom: 'R1,800–R2,500',
    priceSuffix: '/mo',
    features: [
      { text: 'Fixed wireless broadband access' },
      { text: 'Business mobile add-on' },
      { text: 'Dedicated support line' },
    ],
    ctaLabel: 'Bundle My Plans',
    href: '/business/mobile/workconnect-mobile',
  },
  {
    id: 'fleetconnect',
    name: 'FleetConnect',
    tagline: 'IoT SIM cards for vehicle tracking — 5, 10, or 20 lines, one invoice.',
    badge: 'FLEET & IoT',
    badgeVariant: 'purple',
    icon: 'local_shipping',
    priceFrom: 'From R375',
    priceSuffix: '/mo',
    features: [
      { text: 'Industrial IoT SIM cards' },
      { text: 'Real-time fleet visibility' },
      { text: 'Nationwide 4G/5G coverage' },
    ],
    ctaLabel: 'Connect My Fleet',
    href: '/business/mobile/fleetconnect',
  },
];

export const BIZ_MOBILE_TRUST_BADGES = [
  { icon: 'signal_cellular_alt', text: '4G/5G Nationwide Coverage' },
  { icon: 'verified', text: 'ICASA Licensed' },
  { icon: 'bolt', text: 'Zero CAPEX' },
  { icon: 'receipt_long', text: 'One Invoice' },
  { icon: 'support_agent', text: 'Mon–Fri Support' },
];
