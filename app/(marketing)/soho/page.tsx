import { client } from '@/lib/sanity/client';
import { WORKCONNECT_ALL_QUERY } from '@/lib/sanity/queries';
import SOHOContent from './SOHOContent';

export const revalidate = 3600; // Revalidate every hour

// Types for Sanity data
interface SanityWorkConnectPlan {
  _id: string;
  name: string;
  tagline: string;
  slug: string;
  heroImage?: {
    asset?: {
      _id: string;
      url: string;
    };
  };
  pricing: {
    startingPrice: number;
    priceNote?: string;
  };
  keyFeatures: Array<{
    title: string;
    description: string;
  }>;
}

// Transform Sanity data to match existing Plan interface
interface Plan {
  id: string;
  name: string;
  price: number;
  speed: string;
  type: 'fibre' | '5g';
  description: string;
  features: string[];
  badge?: string;
  featured?: boolean;
  slug?: string;
}

// Speed mapping based on product name
function getSpeedFromName(name: string): { speed: string; type: 'fibre' | '5g' } {
  if (name.includes('Pro')) {
    return { speed: '200Mbps', type: '5g' };
  } else if (name.includes('Plus')) {
    return { speed: '100Mbps', type: 'fibre' };
  }
  return { speed: '50Mbps', type: 'fibre' };
}

// Badge mapping
function getBadgeFromName(name: string): { badge?: string; featured?: boolean } {
  if (name.includes('Plus')) {
    return { badge: 'Most Popular', featured: true };
  } else if (name.includes('Pro')) {
    return { badge: 'Best Value', featured: false };
  }
  return {};
}

// Transform Sanity plan to existing Plan interface
function transformPlan(sanityPlan: SanityWorkConnectPlan): Plan {
  const { speed, type } = getSpeedFromName(sanityPlan.name);
  const { badge, featured } = getBadgeFromName(sanityPlan.name);

  return {
    id: sanityPlan._id,
    name: sanityPlan.name.replace('WorkConnect ', ''), // "WorkConnect Starter" -> "Starter"
    price: sanityPlan.pricing.startingPrice,
    speed,
    type,
    description: sanityPlan.tagline,
    features: sanityPlan.keyFeatures.slice(0, 7).map((f) => f.title),
    badge,
    featured,
    slug: sanityPlan.slug,
  };
}

// Fallback hardcoded plans if Sanity is unavailable
const FALLBACK_PLANS: Plan[] = [
  {
    id: 'wc-starter',
    name: 'Starter',
    price: 799,
    speed: '50Mbps',
    type: 'fibre',
    description: 'Start Working Smarter',
    features: [
      '50 Mbps Speed',
      'VoIP QoS',
      '2 Email Accounts',
      'Business Hours Support',
      'Uncapped Data',
      'Backup add-on from R79/mo',
    ],
    slug: 'workconnect-starter',
  },
  {
    id: 'wc-plus',
    name: 'Plus',
    price: 1099, // Corrected from R999 to R1,099
    speed: '100Mbps',
    type: 'fibre',
    description: 'Power Your Productivity',
    features: [
      '100 Mbps Speed',
      'VoIP QoS',
      '5 Email Accounts',
      '3 VPN Tunnels',
      'Extended Support',
      'Backup add-on from R79/mo',
    ],
    badge: 'Most Popular',
    featured: true,
    slug: 'workconnect-plus',
  },
  {
    id: 'wc-pro',
    name: 'Pro',
    price: 1499,
    speed: '200Mbps',
    type: '5g',
    description: 'Built for Ambition',
    features: [
      '200 Mbps Speed',
      'Static IP Included',
      '25GB Cloud Backup Included',
      '10 Email Accounts',
      '5 VPN Tunnels',
      'Priority Support',
    ],
    badge: 'Best Value',
    slug: 'workconnect-pro',
  },
];

export default async function SOHOPage() {
  let plans: Plan[] = FALLBACK_PLANS;

  try {
    const sanityPlans: SanityWorkConnectPlan[] = await client.fetch(WORKCONNECT_ALL_QUERY);

    if (sanityPlans && sanityPlans.length > 0) {
      plans = sanityPlans.map(transformPlan);
    }
  } catch (error) {
    console.error('Failed to fetch WorkConnect plans from Sanity:', error);
    // Fall back to hardcoded plans
  }

  return <SOHOContent plans={plans} />;
}
