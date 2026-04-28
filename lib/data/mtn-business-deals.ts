// lib/data/mtn-business-deals.ts
// Source: MTN_Helios_iLula_Business_Promos_April_2026_v1_0.md (contracts)
//         MTN_EBU_Outright_Pricing_April_2026_v1_0.md (outright / EBU cash prices)
// All prices incl. 15% VAT. Valid 6 April – 6 May 2026.

export interface BusinessPlanTile {
  id: string
  name: string
  monthly_incl_vat: number
  term_months: 24 | 36
  data_gb: number | 'Uncapped'
  badge?: string
  features: string[]
}

export interface FeaturedDevice {
  id: string
  name: string
  category: 'phone' | 'router' | 'tablet'
  image_path: string
  contract_from?: {
    monthly_incl_vat: number
    plan_label: string
    term_months: 24 | 36
  }
  outright_incl_vat: number
  status: 'CTB' | 'NEW' | 'SEL' | 'B2B'
  badge?: string
}

export interface HardwareAddOn {
  id: string
  outright_incl_vat: number
  device_name: string
  tagline: string
  image_path: string
}

// ── Plan Tiles ────────────────────────────────────────────────────────────────
// Prices verbatim from section 4 plan table (Helios/iLula catalogue, April 2026)
export const PLAN_TILES: BusinessPlanTile[] = [
  {
    id: 'bb-lte-30gb',
    name: 'MTN Business Broadband LTE 30GB',
    monthly_incl_vat: 129,
    term_months: 36,
    data_gb: 30,
    features: [
      '30GB LTE data per month',
      'Shared across all devices',
      'No lock-in on data rollover',
      'Priority business support',
    ],
  },
  {
    id: 'mfb-s-plus',
    name: 'Made For Business S+',
    monthly_incl_vat: 169,
    term_months: 36,
    data_gb: 'Uncapped',
    badge: 'Most Popular',
    features: [
      'Uncapped voice & data',
      'Multi-SIM enabled',
      'Business priority network access',
      'Available on 24 or 36 month terms',
    ],
  },
  {
    id: 'uncapped-10mbps',
    name: 'MTN Business Uncapped 10Mbps',
    monthly_incl_vat: 449,
    term_months: 24,
    data_gb: 'Uncapped',
    features: [
      'Uncapped LTE at 10Mbps',
      'Fixed-speed business broadband',
      'Single static APN',
      '24-month contract term',
    ],
  },
]

// ── Featured Devices ──────────────────────────────────────────────────────────
// Outright prices verbatim from MTN_EBU_Outright_Pricing_April_2026_v1_0.md
// Contract "from" prices reference plan table minimums (Helios/iLula section 4)
export const FEATURED_DEVICES: FeaturedDevice[] = [
  {
    id: 'iphone-17-256gb',
    name: 'Apple iPhone 17 256GB',
    category: 'phone',
    image_path: '/images/business-deals/iphone-17-256gb.png',
    contract_from: {
      monthly_incl_vat: 169,
      plan_label: 'Made For Business S+ × 36m',
      term_months: 36,
    },
    outright_incl_vat: 21359,
    status: 'CTB',
    badge: 'Limited Stock',
  },
  {
    id: 'samsung-s26-ultra-256gb',
    name: 'Samsung Galaxy S26 Ultra 256GB',
    category: 'phone',
    image_path: '/images/business-deals/samsung-s26-ultra-256gb.png',
    contract_from: {
      monthly_incl_vat: 169,
      plan_label: 'Made For Business S+ × 36m',
      term_months: 36,
    },
    outright_incl_vat: 28769,
    status: 'CTB',
  },
  {
    id: 'huawei-mate-80-pro',
    name: 'Huawei Mate 80 Pro',
    category: 'phone',
    image_path: '/images/business-deals/huawei-mate-80-pro.png',
    contract_from: {
      monthly_incl_vat: 169,
      plan_label: 'Made For Business S+ × 36m',
      term_months: 36,
    },
    outright_incl_vat: 27329,
    status: 'NEW',
    badge: 'Coming Soon',
  },
  {
    id: 'huawei-matepad-se-11',
    name: 'Huawei MatePad SE 11" 128GB LTE',
    category: 'tablet',
    image_path: '/images/business-deals/huawei-matepad-se-11.png',
    contract_from: {
      monthly_incl_vat: 129,
      plan_label: 'Business Broadband LTE 30GB × 36m',
      term_months: 36,
    },
    outright_incl_vat: 6669,
    status: 'CTB',
    badge: 'Limited Stock',
  },
  {
    id: 'tozed-zlt-x100-pro-5g',
    name: 'Tozed ZLT X100 Pro 5G CPE',
    category: 'router',
    image_path: '/images/business-deals/tozed-zlt-x100-pro-5g.png',
    outright_incl_vat: 1729,
    status: 'CTB',
  },
  {
    id: 'huawei-e5576-321',
    name: 'Huawei E5576-321 4G MiFi',
    category: 'router',
    image_path: '/images/business-deals/huawei-e5576.png',
    outright_incl_vat: 459,
    status: 'CTB',
    badge: 'Limited Stock',
  },
]

// ── Hardware Add-Ons ──────────────────────────────────────────────────────────
// Outright prices verbatim from MTN_EBU_Outright_Pricing_April_2026_v1_0.md
export const HARDWARE_ADDONS: HardwareAddOn[] = [
  {
    id: 'huawei-e5576-addon',
    outright_incl_vat: 459,
    device_name: 'Huawei E5576-321',
    tagline: '4G MiFi — connect up to 16 devices',
    image_path: '/images/business-deals/huawei-e5576.png',
  },
  {
    id: 'tozed-zlt-m36-addon',
    outright_incl_vat: 199,
    device_name: 'Tozed ZLT M36',
    tagline: '4G MiFi — compact & portable',
    image_path: '/images/business-deals/tozed-zlt-m36.png',
  },
]
