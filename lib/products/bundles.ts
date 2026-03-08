/**
 * Arlan MTN Bundle Product Configuration
 * Business Complete, Remote+, Venue+ - combining CircleTel connectivity with MTN mobile services
 */

import { BundleProductSlug } from '@/lib/order/types';

export interface BundleTier {
  id: string;
  name: string;
  speed: string;
  speedDown: number;
  speedUp: number;
  monthlyPrice: number;
  description: string;
  features: string[];
  primaryConnection: string;
  backupConnection: string;
  recommended?: boolean;
}

export interface BundleProductConfig {
  slug: BundleProductSlug;
  name: string;
  tagline: string;
  category: 'business' | 'soho';
  coverageType: 'business' | 'residential';
  description: string;
  tiers: BundleTier[];
  addOns: AddOn[];
}

export interface AddOn {
  id: string;
  name: string;
  monthlyPrice: number;
  description: string;
}

export const BUNDLE_PRODUCTS: Record<BundleProductSlug, BundleProductConfig> = {
  'business-complete': {
    slug: 'business-complete',
    name: 'Business Complete',
    tagline: 'Zero downtime. Zero excuses.',
    category: 'business',
    coverageType: 'business',
    description: 'Enterprise-grade connectivity for growing businesses with automatic 5G failover.',
    tiers: [
      {
        id: 'bc-essential',
        name: 'Essential',
        speed: '50 Mbps',
        speedDown: 50,
        speedUp: 25,
        monthlyPrice: 1798,
        description: 'Perfect for small teams needing reliable connectivity',
        primaryConnection: 'SkyFibre Fixed Wireless (4:1)',
        backupConnection: 'MTN 5G (500GB)',
        features: [
          'Automatic 5G failover (<30 sec)',
          'Static IP included',
          '500GB backup data',
          'WhatsApp support',
          'Free installation (24-month)',
        ],
      },
      {
        id: 'bc-professional',
        name: 'Professional',
        speed: '100 Mbps',
        speedDown: 100,
        speedUp: 50,
        monthlyPrice: 2547,
        description: 'Ideal for cloud-dependent businesses',
        primaryConnection: 'SkyFibre Fixed Wireless (4:1)',
        backupConnection: 'MTN 5G (500GB)',
        recommended: true,
        features: [
          'Automatic 5G failover (<30 sec)',
          'Static IP included',
          '500GB backup data',
          'MTN Business Voice line',
          'WhatsApp support',
          'Free installation (24-month)',
        ],
      },
      {
        id: 'bc-enterprise',
        name: 'Enterprise',
        speed: '200 Mbps',
        speedDown: 200,
        speedUp: 100,
        monthlyPrice: 3822,
        description: 'Maximum performance with premium support',
        primaryConnection: 'SkyFibre Fixed Wireless (2:1)',
        backupConnection: 'MTN 5G Enterprise (Uncapped)',
        features: [
          'Automatic 5G failover (<30 sec)',
          'Static IP included',
          'Uncapped 5G backup',
          'Premium MTN Voice',
          '24/7 priority support',
          'Free installation (24-month)',
        ],
      },
    ],
    addOns: [
      { id: 'fleet-sim', name: 'Fleet M2M SIM', monthlyPrice: 199, description: 'Vehicle tracking connectivity' },
      { id: 'extra-voice', name: 'Extra Voice Line', monthlyPrice: 349, description: 'Additional business line' },
      { id: 'iot-pack', name: 'IoT Sensor Pack', monthlyPrice: 399, description: '5x IoT SIMs for sensors' },
      { id: 'ms365', name: 'Microsoft 365', monthlyPrice: 179, description: 'Business productivity suite' },
    ],
  },

  'remote-plus': {
    slug: 'remote-plus',
    name: 'Remote+',
    tagline: 'Never drop a client call again.',
    category: 'soho',
    coverageType: 'residential',
    description: 'Professional home office connectivity with automatic backup.',
    tiers: [
      {
        id: 'rp-starter',
        name: 'Starter',
        speed: '50 Mbps',
        speedDown: 50,
        speedUp: 25,
        monthlyPrice: 968,
        description: 'Essential backup for video calls',
        primaryConnection: 'WorkConnect FTTH/FWB',
        backupConnection: 'LTE Backup (15GB)',
        features: [
          'Automatic LTE failover',
          '15GB backup data',
          'WiFi 6 router included',
          'WhatsApp support',
          'Free installation (24-month)',
        ],
      },
      {
        id: 'rp-plus',
        name: 'Plus',
        speed: '100 Mbps',
        speedDown: 100,
        speedUp: 50,
        monthlyPrice: 1618,
        description: 'Full 5G backup for uninterrupted work',
        primaryConnection: 'WorkConnect FTTH/FWB',
        backupConnection: 'MTN 5G (500GB)',
        recommended: true,
        features: [
          'Automatic 5G failover (<30 sec)',
          '500GB backup data',
          'WiFi 6 router included',
          'WhatsApp support',
          'Free installation (24-month)',
        ],
      },
      {
        id: 'rp-pro',
        name: 'Pro',
        speed: '200 Mbps',
        speedDown: 200,
        speedUp: 100,
        monthlyPrice: 2367,
        description: 'Maximum performance with voice',
        primaryConnection: 'WorkConnect FTTH/FWB',
        backupConnection: 'MTN 5G (500GB)',
        features: [
          'Automatic 5G failover (<30 sec)',
          '500GB backup data',
          'WiFi 6 router included',
          'MTN Voice line included',
          'WhatsApp support',
          'Free installation (24-month)',
        ],
      },
    ],
    addOns: [
      { id: 'static-ip', name: 'Static IP', monthlyPrice: 99, description: 'For VPN and remote access' },
      { id: 'backup-boost', name: 'Backup Boost', monthlyPrice: 99, description: '+100GB backup data' },
      { id: 'extra-sim', name: 'Extra LTE SIM', monthlyPrice: 199, description: 'Second device backup' },
      { id: 'ms365', name: 'Microsoft 365', monthlyPrice: 179, description: 'Productivity suite' },
    ],
  },

  'venue-plus': {
    slug: 'venue-plus',
    name: 'Venue+',
    tagline: 'One vendor for your venue.',
    category: 'business',
    coverageType: 'business',
    description: 'Managed WiFi-as-a-Service with IoT SIMs for commercial venues.',
    tiers: [
      {
        id: 'vp-retail',
        name: 'Retail',
        speed: '< 300 m²',
        speedDown: 100,
        speedUp: 50,
        monthlyPrice: 1999,
        description: 'Small retail spaces and cafes',
        primaryConnection: '1-2 Reyee WiFi 6 APs',
        backupConnection: '5x MTN IoT SIMs',
        features: [
          'Managed WiFi (1-2 APs)',
          '5 IoT SIMs for POS/sensors',
          'Custom captive portal',
          'Guest analytics dashboard',
          'WhatsApp + on-site support',
        ],
      },
      {
        id: 'vp-hospitality',
        name: 'Hospitality',
        speed: '300-800 m²',
        speedDown: 200,
        speedUp: 100,
        monthlyPrice: 4499,
        description: 'Restaurants, hotels, and medium venues',
        primaryConnection: '3-5 Reyee WiFi 6 APs',
        backupConnection: '10x MTN IoT SIMs',
        recommended: true,
        features: [
          'Managed WiFi (3-5 APs)',
          '10 IoT SIMs for POS/sensors',
          'Custom captive portal',
          'Guest analytics dashboard',
          'WhatsApp + on-site support',
        ],
      },
      {
        id: 'vp-campus',
        name: 'Campus',
        speed: '800-2,000 m²',
        speedDown: 500,
        speedUp: 200,
        monthlyPrice: 9999,
        description: 'Large venues and multi-tenant spaces',
        primaryConnection: '6-12 Reyee WiFi 6 APs',
        backupConnection: '25x MTN IoT SIMs',
        features: [
          'Managed WiFi (6-12 APs)',
          '25 IoT SIMs for POS/sensors',
          'Custom captive portal',
          'Advanced analytics',
          '24/7 support',
          'Multi-tenant VLAN support',
        ],
      },
    ],
    addOns: [
      { id: 'extra-iot', name: 'Additional IoT SIM', monthlyPrice: 79, description: 'Per additional SIM' },
      { id: 'venue-backup', name: '5G Venue Backup', monthlyPrice: 599, description: 'Failover for primary backhaul' },
      { id: 'signage-vlan', name: 'Digital Signage VLAN', monthlyPrice: 350, description: 'Isolated signage network' },
      { id: 'content-filter', name: 'Content Filtering', monthlyPrice: 250, description: 'Guest network filtering' },
      { id: 'advanced-analytics', name: 'Advanced Analytics', monthlyPrice: 500, description: 'Detailed visitor insights' },
    ],
  },
};

export function getBundleProduct(slug: string): BundleProductConfig | null {
  return BUNDLE_PRODUCTS[slug as BundleProductSlug] || null;
}

export function isValidBundleSlug(slug: string): slug is BundleProductSlug {
  return slug in BUNDLE_PRODUCTS;
}
