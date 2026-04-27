// lib/data/entertainment-bundles.ts

export interface EntertainmentBundle {
  id: string
  badge?: string
  device: {
    name: string
    sku: string
    tagline: string
    price_incl_vat: number
    image_path: string
  }
  internet: {
    name: string
    speed_mbps: number
    technology: 'LTE' | '5G' | 'Fibre'
    monthly_incl_vat: number
  }
  bundle_monthly_incl_vat: number
  features: string[]
}

export const ENTERTAINMENT_BUNDLES: EntertainmentBundle[] = [
  {
    id: 'kd3-lte-10',
    device: {
      name: 'Mecool KD3',
      sku: 'MECOOL-KD3',
      tagline: 'Android TV Stick',
      price_incl_vat: 919,
      image_path: '/images/entertainment/mecool-kd3.jpg',
    },
    internet: {
      name: 'CircleTel LTE 10Mbps',
      speed_mbps: 10,
      technology: 'LTE',
      monthly_incl_vat: 399,
    },
    bundle_monthly_incl_vat: 499,
    features: [
      '10Mbps LTE — smooth HD streaming',
      'No lock-in contract',
      'Free delivery on device',
    ],
  },
  {
    id: 'km7plus-lte-25',
    badge: 'Most Popular',
    device: {
      name: 'Mecool KM7 Plus',
      sku: 'MECOOL-KM7PLUS',
      tagline: 'Google TV Box',
      price_incl_vat: 1034,
      image_path: '/images/entertainment/mecool-km7plus.jpg',
    },
    internet: {
      name: 'CircleTel LTE 25Mbps',
      speed_mbps: 25,
      technology: 'LTE',
      monthly_incl_vat: 549,
    },
    bundle_monthly_incl_vat: 699,
    features: [
      '25Mbps LTE — 4K-ready streaming',
      'No lock-in contract',
      'Free delivery on device',
    ],
  },
  {
    id: 'km7plus-lte-50',
    device: {
      name: 'Mecool KM7 Plus',
      sku: 'MECOOL-KM7PLUS',
      tagline: 'Google TV Box',
      price_incl_vat: 1034,
      image_path: '/images/entertainment/mecool-km7plus.jpg',
    },
    internet: {
      name: 'CircleTel LTE 50Mbps',
      speed_mbps: 50,
      technology: 'LTE',
      monthly_incl_vat: 749,
    },
    bundle_monthly_incl_vat: 899,
    features: [
      '50Mbps LTE — multi-device 4K',
      'No lock-in contract',
      'Free delivery on device',
    ],
  },
  {
    id: 'ks3-lte-50',
    device: {
      name: 'Mecool KS3',
      sku: 'MECOOL-KS3',
      tagline: 'OTT Soundbar + Subwoofer',
      price_incl_vat: 6899,
      image_path: '/images/entertainment/mecool-ks3.jpg',
    },
    internet: {
      name: 'CircleTel LTE 50Mbps',
      speed_mbps: 50,
      technology: 'LTE',
      monthly_incl_vat: 749,
    },
    bundle_monthly_incl_vat: 1399,
    features: [
      '50Mbps LTE — cinema-quality audio',
      'No lock-in contract',
      'Free delivery on device',
    ],
  },
  {
    id: 'ks3-km7plus-lte-100',
    badge: 'Ultimate',
    device: {
      name: 'KS3 Soundbar + KM7 Plus',
      sku: 'MECOOL-KS3-KM7PLUS',
      tagline: 'Full Home Entertainment System',
      price_incl_vat: 7933,
      image_path: '/images/entertainment/mecool-ks3-km7plus.jpg',
    },
    internet: {
      name: 'CircleTel LTE 100Mbps',
      speed_mbps: 100,
      technology: 'LTE',
      monthly_incl_vat: 1099,
    },
    bundle_monthly_incl_vat: 1799,
    features: [
      '100Mbps LTE — unlimited 4K on every screen',
      'No lock-in contract',
      'Free delivery on device',
    ],
  },
]
