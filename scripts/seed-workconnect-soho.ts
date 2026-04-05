/**
 * Seed WorkConnect SOHO product page content to Sanity
 *
 * Usage: npx tsx scripts/seed-workconnect-soho.ts
 *
 * Requires: SANITY_API_TOKEN environment variable
 *
 * Product spec: products/connectivity/soho/CircleTel_WorkConnect_SOHO_Product_Portfolio_v1_1.md
 */

import { writeClient } from '../lib/sanity/client';

const WORKCONNECT_SOHO_PRODUCT = {
  _type: 'productPage',
  _id: 'productPage-workconnect-soho', // Deterministic ID for idempotent upserts
  name: 'WorkConnect SOHO',
  slug: { _type: 'slug', current: 'workconnect-soho' },
  category: 'soho',
  tagline: 'Professional-grade internet for freelancers, remote workers, and micro-businesses',
  pricing: {
    startingPrice: 799,
    priceNote: '/mo',
    showContactForPricing: false,
  },
  keyFeatures: [
    {
      _key: 'feature-1',
      title: 'VoIP QoS Included',
      description: 'Voice and video traffic is prioritised so your calls never break up — even during peak hours.',
      icon: 'phone',
    },
    {
      _key: 'feature-2',
      title: 'Cloud Backup Available',
      description: '25 GB included on Pro. Add 50–250 GB cloud backup to any plan from R79/mo.',
      icon: 'shield',
    },
    {
      _key: 'feature-3',
      title: 'Technology-Agnostic',
      description: 'We deliver via the best available technology at your address — FWB, fibre, or 5G/LTE.',
      icon: 'wifi',
    },
    {
      _key: 'feature-4',
      title: 'Extended Support Hours',
      description: 'Reach us Mon–Sat, 07:00–19:00. No call centre queues — direct WhatsApp support.',
      icon: 'message-circle',
    },
  ],
  specifications: [
    { _key: 'spec-1', label: 'Technology', value: 'FWB (Tarana G1) / FTTH (GPON) / 5G/LTE — best available at your address' },
    { _key: 'spec-2', label: 'Latency', value: '< 5 ms to major SA exchanges' },
    { _key: 'spec-3', label: 'Data', value: 'Uncapped, no FUP throttling' },
    { _key: 'spec-4', label: 'VoIP QoS', value: 'Traffic prioritisation on all plans' },
    { _key: 'spec-5', label: 'Support Hours', value: 'Mon–Sat, 07:00–19:00 SAST' },
    { _key: 'spec-6', label: 'Installation', value: 'Professional — from R900 once-off (Free on Pro 24-month)' },
    { _key: 'spec-7', label: 'Contract', value: 'Month-to-month, 12-month, or 24-month available' },
  ],
  blocks: [
    {
      _type: 'pricingBlock',
      _key: 'pricing-tiers',
      headline: 'Choose Your WorkConnect Plan',
      description: 'All plans include VoIP QoS and extended Mon–Sat support. Uncapped, no FUP. Cloud backup available as add-on from R79/mo.',
      plans: [
        {
          _key: 'tier-starter',
          name: 'WorkConnect Starter',
          speed: '50/12.5 Mbps',
          price: 799,
          period: 'mo',
          isPopular: false,
          features: [
            'Uncapped data — no FUP throttling',
            'VoIP QoS (voice & video prioritised)',
            '2 business email accounts',
            'Mon–Sat support, 07:00–19:00',
            'Month-to-month available',
            'Static IP available (+ R99/mo)',
            'Cloud backup add-on from R79/mo',
          ],
          ctaLabel: 'Check Coverage',
          ctaUrl: '/order/coverage?product=workconnect-soho&tier=starter',
        },
        {
          _key: 'tier-plus',
          name: 'WorkConnect Plus',
          speed: '100/25 Mbps',
          price: 1099,
          period: 'mo',
          isPopular: true,
          badge: 'Most Popular',
          features: [
            'Uncapped data — no FUP throttling',
            'VoIP QoS (voice & video prioritised)',
            '5 business email accounts',
            'VPN support (3 concurrent tunnels)',
            'Mon–Sat support, 07:00–19:00',
            'Month-to-month available',
            'Static IP available (+ R99/mo)',
            'Cloud backup add-on from R79/mo',
          ],
          ctaLabel: 'Check Coverage',
          ctaUrl: '/order/coverage?product=workconnect-soho&tier=plus',
        },
        {
          _key: 'tier-pro',
          name: 'WorkConnect Pro',
          speed: '200/50 Mbps',
          price: 1499,
          period: 'mo',
          isPopular: false,
          badge: 'Best Value',
          features: [
            'Uncapped data — no FUP throttling',
            'VoIP QoS with full traffic shaping',
            '25 GB cloud backup included',
            '10 business email accounts',
            'Static IP included (no add-on)',
            'VPN support (5 concurrent tunnels)',
            'RDP/Citrix optimised QoS',
            'Free installation (24-month, valued R1,500)',
            '4-hour response time SLA',
          ],
          ctaLabel: 'Check Coverage',
          ctaUrl: '/order/coverage?product=workconnect-soho&tier=pro',
        },
      ],
      footnote: 'All prices exclude VAT. Upload speeds: FWB = 4:1 asymmetric (e.g. 100/25 Mbps); FTTH = symmetrical; 5G/LTE = variable. Technology determined by your address coverage.',
    },
    {
      _type: 'faqBlock',
      _key: 'faq-section',
      headline: 'Frequently Asked Questions',
      faqs: [
        {
          _key: 'faq-1',
          question: 'What technology will I receive at my address?',
          answer: 'WorkConnect is technology-agnostic — we deliver via the best available technology at your specific address. This could be MTN Tarana G1 Fixed Wireless Broadband (FWB), MTN FTTH fibre, or 5G/LTE. Run a coverage check and we\'ll tell you exactly what\'s available at your address before you commit.',
        },
        {
          _key: 'faq-2',
          question: 'What does "upload speed" mean for the different technologies?',
          answer: 'Upload speed depends on delivery technology. MTN Tarana FWB operates at a 4:1 download-to-upload ratio (e.g. 100 Mbps down / 25 Mbps up). MTN FTTH offers symmetrical speeds (100/100 Mbps). 5G/LTE upload speeds are variable. If you require guaranteed symmetrical upload speeds, we\'d recommend checking availability for BizFibreConnect (DFA fibre) instead.',
        },
        {
          _key: 'faq-3',
          question: 'Is there a data cap or fair usage policy?',
          answer: 'No. All WorkConnect plans are truly uncapped with no Fair Usage Policy (FUP). Your speed will not be throttled during peak hours or after reaching any data threshold. Use as much as you need.',
        },
        {
          _key: 'faq-4',
          question: 'Do I need to sign a long-term contract?',
          answer: 'No lock-in required. All WorkConnect plans are available month-to-month. You can also choose 12-month or 24-month terms for better pricing. WorkConnect Pro on a 24-month term includes free installation (valued at R1,500).',
        },
        {
          _key: 'faq-5',
          question: 'What is VoIP QoS and why does it matter?',
          answer: 'VoIP QoS (Quality of Service) prioritises your voice and video call traffic on the network. This means Zoom, Teams, Google Meet, and traditional VoIP calls remain clear and stable even when other devices on your network are uploading large files or streaming. All WorkConnect plans include this at no extra cost.',
        },
        {
          _key: 'faq-6',
          question: 'Is cloud backup included?',
          answer: 'WorkConnect Pro includes 25 GB cloud backup at no extra cost. Starter and Plus customers can add cloud backup as an optional add-on — 50 GB for R79/mo, 100 GB for R99/mo, or 250 GB for R179/mo. All backup plans automatically back up your selected folders in the background and allow restores from any device.',
        },
        {
          _key: 'faq-7',
          question: 'Can I upgrade from WorkConnect to SkyFibre SMB later?',
          answer: 'Yes. WorkConnect is designed for solo operators and micro-businesses. As your team grows, you can upgrade to SkyFibre SMB (business-grade FWB with static IP and SLA modules) or BizFibreConnect (dedicated dark fibre). We\'ll help you transition with no installation fee on like-for-like technology upgrades.',
        },
      ],
    },
  ],
  seo: {
    title: 'WorkConnect SOHO — Home Office Internet from R799/mo | CircleTel',
    description: 'Professional internet for freelancers, remote workers, and micro-businesses. VoIP QoS and extended support included on all plans. Cloud backup add-on from R79/mo. Truly uncapped, no FUP. From R799/mo.',
  },
};

async function seedWorkConnectSOHO() {
  console.log('Seeding WorkConnect SOHO product to Sanity...');

  if (!process.env.SANITY_API_TOKEN) {
    console.error('ERROR: SANITY_API_TOKEN environment variable is required');
    process.exit(1);
  }

  try {
    const result = await writeClient.createOrReplace(WORKCONNECT_SOHO_PRODUCT);
    console.log('SUCCESS: WorkConnect SOHO product created/updated');
    console.log('Document ID:', result._id);
    console.log('View at: https://circletel.sanity.studio/structure/productPage;' + result._id);
    console.log('Live at: https://www.circletel.co.za/products/workconnect-soho');
  } catch (error) {
    console.error('ERROR: Failed to seed WorkConnect SOHO product');
    console.error(error);
    process.exit(1);
  }
}

seedWorkConnectSOHO();
