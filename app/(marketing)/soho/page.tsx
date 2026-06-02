import { products as allProducts } from '@/lib/data/payload-products';
import SOHOContent from './SOHOContent';

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

function getSpeedFromName(name: string): { speed: string; type: 'fibre' | '5g' } {
  if (name.includes('Pro')) return { speed: '200Mbps', type: '5g' };
  if (name.includes('Plus')) return { speed: '100Mbps', type: 'fibre' };
  return { speed: '50Mbps', type: 'fibre' };
}

function getBadgeFromName(name: string): { badge?: string; featured?: boolean } {
  if (name.includes('Plus')) return { badge: 'Most Popular', featured: true };
  if (name.includes('Pro')) return { badge: 'Best Value', featured: false };
  return {};
}

const workconnectSlugs = ['workconnect-starter', 'workconnect-plus', 'workconnect-pro'];

export default function SOHOPage() {
  const plans: Plan[] = allProducts
    .filter((p) => workconnectSlugs.includes(p.slug))
    .map((p) => {
      const { speed, type } = getSpeedFromName(p.name);
      const { badge, featured } = getBadgeFromName(p.name);
      return {
        id: p._id,
        name: p.name.replace('WorkConnect ', ''),
        price: p.pricing?.startingPrice ?? 0,
        speed,
        type,
        description: p.tagline || '',
        features: (p.keyFeatures || []).slice(0, 7).map((f) => f.title),
        badge,
        featured,
        slug: p.slug,
      };
    });

  return <SOHOContent plans={plans} productSlugs={workconnectSlugs} />;
}
