/**
 * Seed script for BizFibreConnect product page
 *
 * Creates the productPage document for /products/bizfibreconnect in Sanity.
 * Hero image is NOT seeded — upload manually in Sanity Studio afterward.
 *
 * Usage:
 *   cd /home/circletel
 *   SANITY_API_TOKEN=<token> npx ts-node --project tsconfig.json scripts/seed-bizfibreconnect.ts
 */

import { createClient } from '@sanity/client';

const projectId = '7iqq2t7l';
const dataset = 'production';
const apiVersion = '2024-01-01';
const token = process.env.SANITY_API_TOKEN;

if (!token) {
  console.error('Error: SANITY_API_TOKEN environment variable is required');
  process.exit(1);
}

const client = createClient({ projectId, dataset, apiVersion, useCdn: false, token });

// ─── Related product lookup ────────────────────────────────────────────────
async function resolveRelatedProducts(slugs: string[]): Promise<{ _type: 'reference'; _ref: string }[]> {
  const query = `*[_type == "productPage" && slug.current in $slugs]{ _id, "slug": slug.current }`;
  const results: { _id: string; slug: string }[] = await client.fetch(query, { slugs });

  if (results.length === 0) {
    console.warn('  Warning: No related products found. They may not be seeded yet.');
  } else {
    results.forEach((r) => console.log(`  Found related product: ${r.slug} (${r._id})`));
  }

  return results.map((r) => ({ _type: 'reference' as const, _ref: r._id }));
}

// ─── Document definition ───────────────────────────────────────────────────
async function buildDocument() {
  const relatedProducts = await resolveRelatedProducts([
    'skyfibre-smb',
    'workconnect-soho',
    'cloudwifi',
  ]);

  return {
    _id: 'bizfibreconnect',
    _type: 'productPage',
    name: 'BizFibreConnect',
    slug: { _type: 'slug', current: 'bizfibreconnect' },
    category: 'business',
    tagline: 'Dedicated dark fibre for businesses that demand reliability',
    pricing: {
      startingPrice: 1899,
      priceNote: 'per month',
      showContactForPricing: false,
    },
    keyFeatures: [
      {
        _key: 'symmetric',
        title: 'Symmetric Speeds',
        description: 'Upload equals download on every tier — no throttling, no surprises.',
        icon: 'arrow-up',
      },
      {
        _key: 'sla',
        title: '99.9% SLA Guarantee',
        description: 'Guaranteed uptime backed by DFA infrastructure and a binding SLA.',
        icon: 'shield',
      },
      {
        _key: 'dedicated',
        title: 'Dedicated Fibre',
        description: 'Your own fibre connection via DFA — not shared with neighbours.',
        icon: 'globe',
      },
      {
        _key: 'support',
        title: 'Business-Grade Support',
        description: 'Priority NOC monitoring, static IP included, and a dedicated account manager.',
        icon: 'phone',
      },
    ],
    specifications: [
      { _key: 'tech', label: 'Technology', value: 'DFA Dark Fibre' },
      { _key: 'tiers', label: 'Speed Tiers', value: '25/25 · 50/50 · 100/100 · 200/200 Mbps' },
      { _key: 'type', label: 'Speed Type', value: 'Symmetric (equal upload & download)' },
      { _key: 'sla', label: 'Uptime SLA', value: '99.9%' },
      { _key: 'ip', label: 'IP Addressing', value: 'Static IP included' },
      { _key: 'contract', label: 'Contract Terms', value: '12 or 24 months' },
    ],
    seo: {
      _type: 'seo',
      metaTitle: 'BizFibreConnect — Dedicated Dark Fibre for Business | CircleTel',
      metaDescription:
        'Symmetric dark fibre connectivity via DFA infrastructure. 99.9% SLA, static IP, 25–200 Mbps tiers from R1,899/mo.',
    },
    blocks: [
      // Block 1: Trust Strip
      {
        _key: 'trust-strip',
        _type: 'trustStripBlock',
        badges: [
          { _key: 'b1', icon: 'verified', text: '99.9% Uptime SLA' },
          { _key: 'b2', icon: 'speed', text: '<10ms Latency' },
          { _key: 'b3', icon: 'support_agent', text: '24/7 NOC Monitoring' },
          { _key: 'b4', icon: 'swap_vert', text: 'Symmetric Speeds' },
        ],
      },

      // Block 2: Pricing Grid
      {
        _key: 'pricing-grid',
        _type: 'pricingBlock',
        headline: 'Choose Your BizFibreConnect Plan',
        description: 'Symmetric dark fibre at every speed tier. All prices exclude VAT.',
        plans: [
          {
            _key: 'biz25',
            name: 'BizFibre 25',
            speed: '25/25 Mbps',
            price: 1899,
            description: 'Ideal for small offices and light cloud workloads.',
            features: [
              '25 Mbps upload & download',
              'Static IP included',
              '99.9% uptime SLA',
              'Priority support',
              'No throttling',
            ],
            ctaLabel: 'Get Started',
            ctaUrl: '/',
          },
          {
            _key: 'biz50',
            name: 'BizFibre 50',
            speed: '50/50 Mbps',
            price: 2499,
            description: 'Handles multiple video calls and large file transfers.',
            features: [
              '50 Mbps upload & download',
              'Static IP included',
              '99.9% uptime SLA',
              'Priority support',
              'No throttling',
            ],
            ctaLabel: 'Get Started',
            ctaUrl: '/',
          },
          {
            _key: 'biz100',
            name: 'BizFibre 100',
            speed: '100/100 Mbps',
            price: 2999,
            isPopular: true,
            badge: 'Most Popular',
            description: 'The sweet spot for growing businesses and remote teams.',
            features: [
              '100 Mbps upload & download',
              'Static IP included',
              '99.9% uptime SLA',
              'Priority support',
              'No throttling',
            ],
            ctaLabel: 'Get Started',
            ctaUrl: '/',
          },
          {
            _key: 'biz200',
            name: 'BizFibre 200',
            speed: '200/200 Mbps',
            price: 4499,
            description: 'High-bandwidth operations, multi-site connectivity.',
            features: [
              '200 Mbps upload & download',
              'Static IP included',
              '99.9% uptime SLA',
              'Dedicated account manager',
              'No throttling',
            ],
            ctaLabel: 'Get Started',
            ctaUrl: '/',
          },
          {
            _key: 'biz-enterprise',
            name: 'Enterprise',
            speed: '1Gbps+',
            price: 7999,
            isEnterprise: true,
            description: 'Custom 1Gbps+ solutions for enterprise and multi-site deployments. Pricing from R7,999/mo — contact us for a tailored quote.',
            features: [
              '1Gbps+ symmetric speeds',
              'Multiple static IPs',
              '99.99% uptime SLA',
              'Dedicated NOC engineer',
              'Custom SLA terms',
            ],
            ctaLabel: 'Contact Sales',
            ctaUrl: 'https://wa.me/27824873900',
          },
        ],
        footnote: 'All prices exclude VAT. Installation included on 24-month contracts.',
      },

      // Block 3: WhatsApp Quote
      {
        _key: 'whatsapp-quote',
        _type: 'whatsappQuoteBlock',
        eyebrow: 'Get a Quote in 2 Minutes',
        headline: 'Need a Custom Enterprise Solution?',
        description:
          "Our business team will tailor a BizFibreConnect plan for your requirements. We'll reply within 1 business hour.",
        bundleOptions: [
          'BizFibre 25 — 25/25 Mbps (R1,899/mo)',
          'BizFibre 50 — 50/50 Mbps (R2,499/mo)',
          'BizFibre 100 — 100/100 Mbps (R2,999/mo)',
          'BizFibre 200 — 200/200 Mbps (R4,499/mo)',
          'Enterprise — 1Gbps+ (custom pricing)',
        ],
      },
    ],
    relatedProducts,
  };
}

// ─── Main ──────────────────────────────────────────────────────────────────
async function main() {
  console.log('Seeding BizFibreConnect product page...\n');
  console.log(`Project: ${projectId} | Dataset: ${dataset}\n`);

  const doc = await buildDocument();

  try {
    const result = await client.createOrReplace(doc);
    console.log(`\n✅ Created: ${result._id}`);
    console.log(`   Page will render at: /products/bizfibreconnect`);
    console.log(`\n   Next step: Upload a hero image in Sanity Studio`);
    console.log(`   Studio URL: https://7iqq2t7l.sanity.studio/structure/productPage`);
  } catch (error) {
    console.error('Failed to seed document:', error);
    process.exit(1);
  }
}

main().catch(console.error);
