#!/usr/bin/env node
/**
 * Create Sanity product pages for CircleTel Arlan bundles
 * Usage: node scripts/create-sanity-product-pages.js
 */

const { createClient } = require('@sanity/client');
const fs = require('fs');
const path = require('path');

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '7iqq2t7l',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
});

const products = [
  {
    name: 'Business Complete',
    slug: 'business-complete',
    category: 'business',
    tagline: 'Zero downtime. Zero excuses.',
    imagePath: 'public/images/products/business-complete-hero.jpg',
    pricing: {
      startingPrice: 1798,
      priceNote: 'per month excl. VAT',
      showContactForPricing: false,
    },
    keyFeatures: [
      {
        title: 'Automatic Failover',
        description: 'When your primary connection drops, 5G backup kicks in within 30 seconds. Your clients won\'t notice.',
        icon: 'shield',
      },
      {
        title: 'Business Voice',
        description: 'MTN business voice line included with unlimited local calls. One bill, one vendor.',
        icon: 'phone',
      },
      {
        title: 'Static IP Included',
        description: 'Remote access, VPN, and hosted services work seamlessly with your dedicated IP address.',
        icon: 'globe',
      },
      {
        title: 'WhatsApp Support',
        description: 'Skip the call centre queue. Message us directly on WhatsApp for instant assistance.',
        icon: 'message-circle',
      },
    ],
    specifications: [
      { label: 'Primary Connection', value: 'SkyFibre Fixed Wireless (4:1)' },
      { label: 'Backup Connection', value: 'MTN 5G (500GB-Uncapped)' },
      { label: 'Speed Tiers', value: '50 / 100 / 200 Mbps' },
      { label: 'Contract', value: '24 months (MTM +10%)' },
      { label: 'Installation', value: 'Free on 24-month contract' },
      { label: 'Support', value: 'Mon-Fri 8am-5pm + WhatsApp' },
    ],
    seo: {
      title: 'Business Complete - SME Connectivity Bundle | CircleTel',
      description: 'Enterprise-grade connectivity for growing businesses. SkyFibre fixed wireless with automatic 5G failover, business voice, and WhatsApp support. From R1,798/month.',
    },
  },
  {
    name: 'Remote+',
    slug: 'remote-plus',
    category: 'soho',
    tagline: 'Never drop a client call again.',
    imagePath: 'public/images/products/remote-plus-hero.jpg',
    pricing: {
      startingPrice: 968,
      priceNote: 'per month excl. VAT',
      showContactForPricing: false,
    },
    keyFeatures: [
      {
        title: 'Automatic Backup',
        description: 'Your Zoom stays connected even when your main internet fails. 5G/LTE failover happens automatically.',
        icon: 'wifi',
      },
      {
        title: 'Business-Grade WiFi',
        description: 'WiFi 6 router included - not consumer junk. Handles video calls and family streaming simultaneously.',
        icon: 'router',
      },
      {
        title: 'One Simple Bill',
        description: 'Stop managing multiple vendors. Primary connection, backup SIM, and support in one package.',
        icon: 'receipt',
      },
      {
        title: 'Pro Upgrade Path',
        description: 'Need a business voice line? Upgrade to Pro tier with MTN voice included.',
        icon: 'arrow-up',
      },
    ],
    specifications: [
      { label: 'Primary Connection', value: 'WorkConnect FTTH/FWB' },
      { label: 'Backup Connection', value: 'LTE (15GB) or 5G (500GB)' },
      { label: 'Speed Tiers', value: '50 / 100 / 200 Mbps' },
      { label: 'Router', value: 'WiFi 6 included' },
      { label: 'Contract', value: '24 months (MTM +10%)' },
      { label: 'Installation', value: 'Free on 24-month contract' },
    ],
    seo: {
      title: 'Remote+ - Work From Home Bundle | CircleTel',
      description: 'Professional home office connectivity with automatic 5G failover. Never lose a client call to "connection issues" again. From R968/month.',
    },
  },
  {
    name: 'Venue+',
    slug: 'venue-plus',
    category: 'business',
    tagline: 'One vendor for your venue.',
    imagePath: 'public/images/products/venue-plus-hero.jpg',
    pricing: {
      startingPrice: 1999,
      priceNote: 'per month excl. VAT',
      showContactForPricing: false,
    },
    keyFeatures: [
      {
        title: 'Managed WiFi',
        description: 'We own the hardware, manage the network, and you get one number to call when anything needs fixing.',
        icon: 'wifi',
      },
      {
        title: 'IoT SIMs Included',
        description: 'Your card machines, kitchen displays, and sensors stay connected with included MTN IoT SIMs.',
        icon: 'sim-card',
      },
      {
        title: 'Custom Captive Portal',
        description: 'Guest WiFi with your branding. Collect emails, show promotions, monetise with ads.',
        icon: 'layout',
      },
      {
        title: 'Guest Analytics',
        description: 'Understand foot traffic, dwell time, and return visitors. Data-driven venue management.',
        icon: 'chart',
      },
    ],
    specifications: [
      { label: 'Coverage', value: '< 300m² to 2,000m²' },
      { label: 'Access Points', value: '1-12 Reyee WiFi 6' },
      { label: 'IoT SIMs', value: '5-25 MTN IoT SIMs' },
      { label: 'Management', value: 'Ruijie Cloud' },
      { label: 'Installation', value: 'R2,500-R12,500 (50% launch discount)' },
      { label: 'Support', value: 'WhatsApp + On-site' },
    ],
    seo: {
      title: 'Venue+ - Commercial WiFi & IoT Bundle | CircleTel',
      description: 'Managed WiFi-as-a-Service with IoT SIMs for POS, sensors, and devices. One vendor, one bill, zero headaches. From R1,999/month.',
    },
  },
];

async function uploadImage(imagePath) {
  const absolutePath = path.resolve(imagePath);
  const imageBuffer = fs.readFileSync(absolutePath);
  const filename = path.basename(imagePath);

  console.log(`  Uploading ${filename}...`);

  const asset = await client.assets.upload('image', imageBuffer, {
    filename,
    contentType: 'image/jpeg',
  });

  return {
    _type: 'image',
    asset: {
      _type: 'reference',
      _ref: asset._id,
    },
  };
}

async function createProductPage(product) {
  console.log(`\nCreating ${product.name}...`);

  // Upload hero image
  const heroImage = await uploadImage(product.imagePath);

  // Generate portable text for description
  const description = [
    {
      _type: 'block',
      _key: 'intro',
      style: 'normal',
      children: [
        {
          _type: 'span',
          _key: 'span1',
          text: `${product.tagline} ${product.name} bundles CircleTel connectivity with MTN mobile services for reliable, hassle-free connectivity.`,
          marks: [],
        },
      ],
      markDefs: [],
    },
  ];

  const doc = {
    _type: 'productPage',
    _id: `product-${product.slug}`,
    name: product.name,
    slug: { _type: 'slug', current: product.slug },
    category: product.category,
    tagline: product.tagline,
    description,
    heroImage,
    pricing: product.pricing,
    keyFeatures: product.keyFeatures.map((f, i) => ({
      _key: `feature-${i}`,
      ...f,
    })),
    specifications: product.specifications.map((s, i) => ({
      _key: `spec-${i}`,
      ...s,
    })),
    seo: {
      title: product.seo.title,
      description: product.seo.description,
    },
    blocks: [],
    relatedProducts: [],
  };

  const result = await client.createOrReplace(doc);
  console.log(`  Created: ${result._id}`);
  return result;
}

async function main() {
  console.log('Creating Sanity product pages for Arlan bundles...\n');

  if (!process.env.SANITY_API_TOKEN) {
    console.error('ERROR: SANITY_API_TOKEN environment variable not set');
    process.exit(1);
  }

  for (const product of products) {
    try {
      await createProductPage(product);
    } catch (error) {
      console.error(`  ERROR: ${error.message}`);
    }
  }

  console.log('\n✅ All product pages created!');
  console.log('View in Sanity Studio: https://studio.circletel.co.za');
}

main().catch(console.error);
