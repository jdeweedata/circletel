/**
 * Seed script for WorkConnect SOHO products
 *
 * Creates 3 productPage documents in Sanity:
 * - WorkConnect Starter (R799)
 * - WorkConnect Plus (R1,099)
 * - WorkConnect Pro (R1,499)
 *
 * Usage:
 *   cd /home/circletel/sanity-studio
 *   npx ts-node scripts/seed-workconnect-products.ts
 */

import { createClient } from '@sanity/client';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const projectId = '7iqq2t7l';
const dataset = 'production';
const apiVersion = '2024-01-01';
const token = process.env.SANITY_API_TOKEN;

if (!token) {
  console.error('Error: SANITY_API_TOKEN environment variable is required');
  console.error('Run with: SANITY_API_TOKEN=<token> npx ts-node scripts/seed-workconnect-products.ts');
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token,
});

// Image paths (relative to project root)
const imageBasePath = '/home/circletel/public/images/workconnect';

// Product definitions based on CircleTel_WorkConnect_SOHO_Product_Portfolio_v1_1.md
const products = [
  {
    _id: 'workconnect-starter',
    _type: 'productPage',
    name: 'WorkConnect Starter',
    slug: { _type: 'slug', current: 'workconnect-starter' },
    category: 'soho',
    tagline: 'Start Working Smarter',
    pricing: {
      startingPrice: 799,
      priceNote: 'per month',
      showContactForPricing: false,
    },
    keyFeatures: [
      {
        _key: 'speed',
        title: '50 Mbps Speed',
        description: 'Fast enough for video calls, cloud apps, and streaming.',
        icon: 'Zap',
      },
      {
        _key: 'voip',
        title: 'VoIP QoS',
        description: 'Crystal-clear voice calls with traffic prioritization.',
        icon: 'Phone',
      },
      {
        _key: 'backup',
        title: '25GB Cloud Backup',
        description: 'Your files, safe and accessible from anywhere.',
        icon: 'Cloud',
      },
      {
        _key: 'email',
        title: '2 Email Accounts',
        description: 'Professional @yourdomain.co.za email addresses.',
        icon: 'Mail',
      },
      {
        _key: 'support',
        title: 'Business Hours Support',
        description: 'Mon-Sat 07:00-19:00, 12-hour response time.',
        icon: 'Headphones',
      },
      {
        _key: 'uncapped',
        title: 'Uncapped Data',
        description: 'No limits, no throttling, work without worry.',
        icon: 'Infinity',
      },
    ],
    specifications: [
      { _key: 'download', label: 'Download Speed', value: '50 Mbps' },
      { _key: 'upload-ftth', label: 'Upload (FTTH)', value: '50 Mbps' },
      { _key: 'upload-fwb', label: 'Upload (FWB)', value: '12.5 Mbps' },
      { _key: 'data', label: 'Data Cap', value: 'Uncapped' },
      { _key: 'cloud', label: 'Cloud Backup', value: '25 GB' },
      { _key: 'email', label: 'Email Accounts', value: '2' },
      { _key: 'vpn', label: 'VPN Tunnels', value: '-' },
      { _key: 'static-ip', label: 'Static IP', value: 'Add-on R99/mo' },
      { _key: 'support', label: 'Support Hours', value: 'Mon-Sat 07:00-19:00' },
      { _key: 'response', label: 'Response Time', value: '12 hours' },
    ],
    seo: {
      metaTitle: 'WorkConnect Starter - R799/mo | CircleTel',
      metaDescription: 'Start working smarter with 50 Mbps internet, VoIP QoS, and 25GB cloud backup. Perfect for freelancers and entry-level work from home. R799/month.',
    },
    heroImagePath: `${imageBasePath}/workconnect-starter-hero.jpg`,
  },
  {
    _id: 'workconnect-plus',
    _type: 'productPage',
    name: 'WorkConnect Plus',
    slug: { _type: 'slug', current: 'workconnect-plus' },
    category: 'soho',
    tagline: 'Power Your Productivity',
    pricing: {
      startingPrice: 1099,
      priceNote: 'per month',
      showContactForPricing: false,
    },
    keyFeatures: [
      {
        _key: 'speed',
        title: '100 Mbps Speed',
        description: 'Handle multiple video calls and large file transfers.',
        icon: 'Zap',
      },
      {
        _key: 'voip',
        title: 'VoIP QoS',
        description: 'Crystal-clear voice calls with traffic prioritization.',
        icon: 'Phone',
      },
      {
        _key: 'backup',
        title: '50GB Cloud Backup',
        description: 'Your files, safe and accessible from anywhere.',
        icon: 'Cloud',
      },
      {
        _key: 'email',
        title: '5 Email Accounts',
        description: 'Professional @yourdomain.co.za email addresses.',
        icon: 'Mail',
      },
      {
        _key: 'vpn',
        title: '3 VPN Tunnels',
        description: 'Secure connections to your office network.',
        icon: 'Shield',
      },
      {
        _key: 'support',
        title: 'Extended Support',
        description: 'Mon-Sat 07:00-19:00, 8-hour response time.',
        icon: 'Headphones',
      },
    ],
    specifications: [
      { _key: 'download', label: 'Download Speed', value: '100 Mbps' },
      { _key: 'upload-ftth', label: 'Upload (FTTH)', value: '100 Mbps*' },
      { _key: 'upload-fwb', label: 'Upload (FWB)', value: '25 Mbps' },
      { _key: 'data', label: 'Data Cap', value: 'Uncapped' },
      { _key: 'cloud', label: 'Cloud Backup', value: '50 GB' },
      { _key: 'email', label: 'Email Accounts', value: '5' },
      { _key: 'vpn', label: 'VPN Tunnels', value: '3' },
      { _key: 'static-ip', label: 'Static IP', value: 'Add-on R99/mo' },
      { _key: 'support', label: 'Support Hours', value: 'Mon-Sat 07:00-19:00' },
      { _key: 'response', label: 'Response Time', value: '8 hours' },
    ],
    seo: {
      metaTitle: 'WorkConnect Plus - R1,099/mo | CircleTel',
      metaDescription: 'Power your productivity with 100 Mbps internet, 50GB cloud backup, and 3 VPN tunnels. Perfect for remote workers and micro-businesses. R1,099/month.',
    },
    heroImagePath: `${imageBasePath}/workconnect-plus-hero.jpg`,
  },
  {
    _id: 'workconnect-pro',
    _type: 'productPage',
    name: 'WorkConnect Pro',
    slug: { _type: 'slug', current: 'workconnect-pro' },
    category: 'soho',
    tagline: 'Built for Ambition',
    pricing: {
      startingPrice: 1499,
      priceNote: 'per month',
      showContactForPricing: false,
    },
    keyFeatures: [
      {
        _key: 'speed',
        title: '200 Mbps Speed',
        description: 'Blazing fast for content creation and multi-user households.',
        icon: 'Zap',
      },
      {
        _key: 'static',
        title: 'Static IP Included',
        description: 'Host servers, access your network remotely, no extra cost.',
        icon: 'Globe',
      },
      {
        _key: 'backup',
        title: '100GB Cloud Backup',
        description: 'Your files, safe and accessible from anywhere.',
        icon: 'Cloud',
      },
      {
        _key: 'email',
        title: '10 Email Accounts',
        description: 'Professional @yourdomain.co.za email addresses.',
        icon: 'Mail',
      },
      {
        _key: 'vpn',
        title: '5 VPN Tunnels',
        description: 'Secure connections for your entire team.',
        icon: 'Shield',
      },
      {
        _key: 'support',
        title: 'Priority Support',
        description: '4-hour response, WhatsApp priority access.',
        icon: 'Headphones',
      },
    ],
    specifications: [
      { _key: 'download', label: 'Download Speed', value: '200 Mbps' },
      { _key: 'upload-ftth', label: 'Upload (FTTH)', value: '200 Mbps' },
      { _key: 'upload-fwb', label: 'Upload (FWB)', value: '50 Mbps' },
      { _key: 'data', label: 'Data Cap', value: 'Uncapped' },
      { _key: 'cloud', label: 'Cloud Backup', value: '100 GB' },
      { _key: 'email', label: 'Email Accounts', value: '10' },
      { _key: 'vpn', label: 'VPN Tunnels', value: '5' },
      { _key: 'static-ip', label: 'Static IP', value: 'Included' },
      { _key: 'support', label: 'Support Hours', value: 'Mon-Sat 07:00-19:00' },
      { _key: 'response', label: 'Response Time', value: '4 hours' },
      { _key: 'whatsapp', label: 'WhatsApp Priority', value: 'Yes' },
    ],
    seo: {
      metaTitle: 'WorkConnect Pro - R1,499/mo | CircleTel',
      metaDescription: 'Built for ambition. 200 Mbps internet, static IP included, 100GB cloud backup, WhatsApp priority support. Perfect for content creators and power users. R1,499/month.',
    },
    heroImagePath: `${imageBasePath}/workconnect-pro-hero.jpg`,
  },
];

async function uploadImage(imagePath: string, filename: string): Promise<string | null> {
  try {
    if (!fs.existsSync(imagePath)) {
      console.log(`  Warning: Image not found at ${imagePath}`);
      return null;
    }

    const imageBuffer = fs.readFileSync(imagePath);
    const asset = await client.assets.upload('image', imageBuffer, {
      filename,
      contentType: 'image/jpeg',
    });

    console.log(`  Uploaded: ${filename} -> ${asset._id}`);
    return asset._id;
  } catch (error) {
    console.error(`  Failed to upload ${filename}:`, error);
    return null;
  }
}

async function createProduct(product: typeof products[0], imageAssetId: string | null) {
  // Remove heroImagePath from the document
  const { heroImagePath, ...productData } = product;

  // Add heroImage reference if we have an asset
  const doc = {
    ...productData,
    ...(imageAssetId && {
      heroImage: {
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: imageAssetId,
        },
        alt: `${product.name} hero image - professional work from home setup`,
      },
    }),
  };

  try {
    const result = await client.createOrReplace(doc);
    console.log(`  Created: ${product.name} (${result._id})`);
    return result;
  } catch (error) {
    console.error(`  Failed to create ${product.name}:`, error);
    throw error;
  }
}

async function main() {
  console.log('Starting WorkConnect product seeding...\n');
  console.log(`Project: ${projectId}`);
  console.log(`Dataset: ${dataset}\n`);

  for (const product of products) {
    console.log(`\nProcessing: ${product.name}`);

    // Upload hero image
    const filename = path.basename(product.heroImagePath);
    const imageAssetId = await uploadImage(product.heroImagePath, filename);

    // Create product document
    await createProduct(product, imageAssetId);
  }

  console.log('\n✅ WorkConnect product seeding complete!');
  console.log('\nCreated products:');
  products.forEach((p) => {
    console.log(`  - ${p.name}: /workconnect/${p.slug.current}`);
  });
}

main().catch(console.error);
