/**
 * Seed SkyFibre SMB product page content to Sanity
 *
 * Usage: npx tsx scripts/seed-skyfibre-smb.ts
 *
 * Requires: SANITY_API_TOKEN environment variable
 */

import { writeClient } from '../lib/sanity/client';

const SKYFIBRE_SMB_PRODUCT = {
  _type: 'productPage',
  _id: 'productPage-skyfibre-smb', // Deterministic ID for idempotent upserts
  name: 'SkyFibre SMB',
  slug: { _type: 'slug', current: 'skyfibre-smb' },
  category: 'business',
  tagline: 'Business-grade wireless broadband that works as hard as you do',
  pricing: {
    startingPrice: 1299,
    priceNote: '/mo',
    showContactForPricing: false,
  },
  keyFeatures: [
    {
      _key: 'feature-1',
      title: 'Truly Uncapped',
      description: 'No fair usage throttling. Use as much as you need without speed reductions.',
      icon: 'wifi',
    },
    {
      _key: 'feature-2',
      title: 'Static IP Included',
      description: 'Public static IP for remote access, VPNs, and hosted services.',
      icon: 'globe',
    },
    {
      _key: 'feature-3',
      title: 'No Lock-in',
      description: 'Month-to-month flexibility. No 24-month contracts required.',
      icon: 'receipt',
    },
    {
      _key: 'feature-4',
      title: 'Business SLA',
      description: 'Named account manager and guaranteed response times.',
      icon: 'shield',
    },
  ],
  specifications: [
    { _key: 'spec-1', label: 'Technology', value: 'MTN Tarana G1 Fixed Wireless' },
    { _key: 'spec-2', label: 'Spectrum', value: 'Licensed (MTN managed)' },
    { _key: 'spec-3', label: 'Latency', value: '< 5 ms typical' },
    { _key: 'spec-4', label: 'Speed Ratio', value: '4:1 download to upload' },
    { _key: 'spec-5', label: 'Coverage', value: '6 million+ homes nationally' },
    { _key: 'spec-6', label: 'Contention', value: '8:1 (business grade)' },
  ],
  blocks: [
    {
      _type: 'pricingBlock',
      _key: 'pricing-tiers',
      headline: 'Choose Your Speed',
      description: 'All plans include static IP, truly uncapped data, and business support.',
      plans: [
        {
          _key: 'tier-50',
          name: 'Business 50',
          speed: '50/12.5 Mbps',
          price: 1299,
          isPopular: false,
          features: [
            'Static IP included',
            'Truly uncapped (no FUP)',
            'Basic business support',
            'Month-to-month',
          ],
          ctaLabel: 'Get Started',
          ctaUrl: '/order/coverage?product=skyfibre-smb&tier=50',
        },
        {
          _key: 'tier-100',
          name: 'Business 100',
          speed: '100/25 Mbps',
          price: 1499,
          isPopular: true,
          features: [
            'Static IP included',
            'Truly uncapped (no FUP)',
            'Basic business support',
            'Month-to-month',
          ],
          ctaLabel: 'Get Started',
          ctaUrl: '/order/coverage?product=skyfibre-smb&tier=100',
        },
        {
          _key: 'tier-200',
          name: 'Business 200',
          speed: '200/50 Mbps',
          price: 1899,
          isPopular: false,
          features: [
            'Static IP included',
            'Truly uncapped (no FUP)',
            'Basic business support',
            'Month-to-month',
          ],
          ctaLabel: 'Get Started',
          ctaUrl: '/order/coverage?product=skyfibre-smb&tier=200',
        },
      ],
      footnote: 'All prices exclude VAT. Installation included on 12+ month terms.',
    },
  ],
  seo: {
    title: 'SkyFibre SMB - Business Wireless Broadband | CircleTel',
    description: 'Business-grade fixed wireless broadband from R1,299/mo. Truly uncapped, static IP included, no lock-in contracts. Powered by MTN Tarana G1.',
  },
};

async function seedSkyFibreSMB() {
  console.log('Seeding SkyFibre SMB product to Sanity...');

  if (!process.env.SANITY_API_TOKEN) {
    console.error('ERROR: SANITY_API_TOKEN environment variable is required');
    process.exit(1);
  }

  try {
    const result = await writeClient.createOrReplace(SKYFIBRE_SMB_PRODUCT);
    console.log('SUCCESS: SkyFibre SMB product created/updated');
    console.log('Document ID:', result._id);
    console.log('View at: https://circletel.sanity.studio/structure/productPage;' + result._id);
  } catch (error) {
    console.error('ERROR: Failed to seed SkyFibre SMB product');
    console.error(error);
    process.exit(1);
  }
}

seedSkyFibreSMB();
