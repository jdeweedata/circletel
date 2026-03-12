/**
 * Seed Managed IT Services product page content to Sanity
 *
 * Usage: npx tsx scripts/seed-managed-it-services.ts
 *
 * Requires: SANITY_API_TOKEN environment variable
 */

import { writeClient } from '../lib/sanity/client';
import { readFileSync } from 'fs';
import { basename } from 'path';

const HERO_IMAGE_PATH = 'public/images/products/managed-it-services-hero.jpg';

interface SanityImageAsset {
  _id: string;
  _type: string;
}

const MANAGED_IT_SERVICES_PRODUCT = {
  _type: 'productPage',
  _id: 'productPage-managed-it-services',
  name: 'Managed IT Services',
  slug: { _type: 'slug', current: 'managed-it-services' },
  category: 'business',
  tagline: 'Connectivity + IT Services. Single Provider. Single Bill.',
  pricing: {
    startingPrice: 2999,
    priceNote: '/mo',
    showContactForPricing: false,
  },
  keyFeatures: [
    {
      _key: 'feature-1',
      title: 'Single Provider Solution',
      description: 'Connectivity and IT services from one trusted partner. One bill, one point of contact.',
      icon: 'globe',
    },
    {
      _key: 'feature-2',
      title: '30-40% Cost Savings',
      description: 'Bundled pricing beats engaging separate providers. See the comparison below.',
      icon: 'receipt',
    },
    {
      _key: 'feature-3',
      title: 'Microsoft Certified Team',
      description: 'AZ-104 Azure Administrator and AZ-140 Azure Virtual Desktop certified experts.',
      icon: 'shield',
    },
    {
      _key: 'feature-4',
      title: 'Direct WhatsApp Support',
      description: 'No call centre queues. Message our technicians directly for faster resolution.',
      icon: 'message-circle',
    },
  ],
  specifications: [
    { _key: 'spec-1', label: 'Activation', value: '3 business days' },
    { _key: 'spec-2', label: 'Contracts', value: 'Month-to-month (no lock-in)' },
    { _key: 'spec-3', label: 'SLA', value: '99.5% uptime guarantee' },
    { _key: 'spec-4', label: 'Support', value: '24/7 helpdesk available' },
    { _key: 'spec-5', label: 'On-site Response', value: '4-hour SLA (Premium+)' },
    { _key: 'spec-6', label: 'Microsoft 365', value: 'Full ecosystem management' },
  ],
  blocks: [
    {
      _type: 'pricingBlock',
      _key: 'pricing-tiers',
      headline: 'Choose Your IT Recipe',
      description: 'All plans include business-grade connectivity, IT support, and Microsoft 365 management. Additional users available at per-seat pricing.',
      plans: [
        {
          _key: 'tier-essential',
          name: 'Essential',
          speed: '50Mbps SkyFibre',
          price: 2999,
          description: 'SOHO & Startups (1-10 employees)',
          isPopular: false,
          features: [
            '50Mbps business internet + static IP',
            'Helpdesk support (Mon-Fri 8-5)',
            '5 Microsoft 365 Business Basic licences',
            'Email security included',
            'Monthly health check',
            'Additional users: R179/mo each',
          ],
          ctaLabel: 'Get Started',
          ctaUrl: '/order/coverage?product=managed-it-services&tier=essential',
        },
        {
          _key: 'tier-professional',
          name: 'Professional',
          speed: '100Mbps + Failover',
          price: 5999,
          description: 'Small Business (10-25 employees)',
          isPopular: true,
          features: [
            '100Mbps internet + LTE failover',
            'Extended support (Mon-Sat 7am-7pm)',
            '10 Microsoft 365 Business Standard licences',
            'Managed firewall + cloud backup (500GB)',
            'Quarterly on-site visit',
            'Additional users: R329/mo each',
          ],
          ctaLabel: 'Get Started',
          ctaUrl: '/order/coverage?product=managed-it-services&tier=professional',
        },
        {
          _key: 'tier-premium',
          name: 'Premium',
          speed: '200Mbps + LTE Backup',
          price: 12999,
          description: 'Growing SME (25-50 employees)',
          isPopular: false,
          features: [
            '200Mbps internet + automatic LTE backup',
            '24/7 support with 4-hour SLA',
            '15 Microsoft 365 Business Premium licences',
            'Complete security suite + 1TB backup',
            'Monthly on-site visit + security training',
            'Additional users: R549/mo each',
          ],
          ctaLabel: 'Get Started',
          ctaUrl: '/order/coverage?product=managed-it-services&tier=premium',
        },
        {
          _key: 'tier-enterprise',
          name: 'Enterprise',
          speed: '500Mbps+ Dedicated',
          price: 35000,
          description: 'Mid-Market (50-100+ employees)',
          isPopular: false,
          features: [
            'Dedicated connectivity (500Mbps+)',
            '24/7 priority support (2-hour SLA)',
            '20+ Microsoft 365 E3 licences',
            'Enterprise security + unlimited backup',
            'Dedicated account manager + weekly presence',
            'Custom pricing based on requirements',
          ],
          ctaLabel: 'Contact Sales',
          ctaUrl: 'https://wa.me/27824873900?text=Hi%2C%20I%27m%20interested%20in%20the%20Enterprise%20Managed%20IT%20package%20for%20my%20business',
        },
      ],
      footnote: 'All prices exclude VAT. Each tier includes a set number of Microsoft 365 licences — additional users charged per seat. Custom solutions available for 100+ employees.',
    },
    {
      _type: 'comparisonBlock',
      _key: 'cost-comparison',
      eyebrow: 'Cost Comparison',
      headline: 'Save 34% vs Separate Providers',
      description: 'Example for a 25-user SME business',
    },
  ],
  seo: {
    title: 'Managed IT Services - Connectivity + IT Support | CircleTel',
    description: 'Complete IT solutions from R2,999/mo. Connectivity, Microsoft 365, security, backup, and 24/7 support in one bundle. 30-40% savings vs separate providers. No lock-in contracts.',
  },
};

async function seedManagedITServices() {
  console.log('Seeding Managed IT Services product to Sanity...');

  if (!process.env.SANITY_API_TOKEN) {
    console.error('ERROR: SANITY_API_TOKEN environment variable is required');
    process.exit(1);
  }

  try {
    // Step 1: Upload hero image
    console.log('Uploading hero image...');
    const imageBuffer = readFileSync(HERO_IMAGE_PATH);
    const imageAsset = await writeClient.assets.upload('image', imageBuffer, {
      filename: basename(HERO_IMAGE_PATH),
    }) as SanityImageAsset;
    console.log('Image uploaded:', imageAsset._id);

    // Step 2: Create product with image reference
    const productWithImage = {
      ...MANAGED_IT_SERVICES_PRODUCT,
      heroImage: {
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: imageAsset._id,
        },
      },
    };

    const result = await writeClient.createOrReplace(productWithImage);
    console.log('SUCCESS: Managed IT Services product created/updated');
    console.log('Document ID:', result._id);
    console.log('View at: https://circletel.sanity.studio/structure/productPage;' + result._id);
    console.log('\nProduct page URL: /products/managed-it-services');
  } catch (error) {
    console.error('ERROR: Failed to seed Managed IT Services product');
    console.error(error);
    process.exit(1);
  }
}

seedManagedITServices();
