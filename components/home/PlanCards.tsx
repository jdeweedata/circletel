'use client';
import { PiArrowRightBold, PiBatteryChargingBold, PiBuildingsBold, PiCellSignalFullBold, PiClockBold, PiLightningBold, PiShieldBold, PiWifiHighBold } from 'react-icons/pi';

import React from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { SegmentType } from './SegmentTabs';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
} as const;

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
} as const;

interface HeroPlan {
  id: string;
  name: string;
  price: number;
  speed: string;
  type: 'fibre' | '5g' | 'lte' | 'fwa';
  description: string;
  badge?: string;
  badgeColor?: 'orange' | 'green' | 'blue';
  featured?: boolean;
  features?: string[];
}

// Consumer/Home Plans - SkyFibre Home (MTN Tarana G1 FWA - 4:1 contention)
// Updated pricing March 2026 - competitive response to MTN AirFibre
const HOME_PLANS: HeroPlan[] = [
  {
    id: 'skyfibre-home-plus',
    name: 'SkyFibre Home Plus',
    price: 799,
    speed: '50/12.5Mbps',
    type: 'fwa',
    description: 'Stream your favourite shows without buffering.',
    badge: 'Entry',
    badgeColor: 'green',
    features: ['No contracts', 'Uncapped data', 'Free installation'],
  },
  {
    id: 'skyfibre-home-max',
    name: 'SkyFibre Home Max',
    price: 999,
    speed: '100/25Mbps',
    type: 'fwa',
    description: 'Everyone streams. Nobody buffers.',
    badge: 'Popular',
    badgeColor: 'orange',
    featured: true,
    features: ['No contracts', 'Uncapped data', 'Free installation'],
  },
  {
    id: 'skyfibre-home-ultra',
    name: 'SkyFibre Home Ultra',
    price: 1299,
    speed: '200/50Mbps',
    type: 'fwa',
    description: 'Enough bandwidth for the whole house.',
    badge: 'Best Value',
    badgeColor: 'orange',
    features: ['No contracts', 'Uncapped data', 'Free installation'],
  },
  {
    id: 'skyfibre-home-pro-100',
    name: 'SkyFibre Home Pro',
    price: 1199,
    speed: '100/25Mbps',
    type: 'fwa',
    description: 'Work from home without the connection anxiety.',
    badge: 'WFH Ready',
    badgeColor: 'blue',
    features: ['No contracts', 'Managed WiFi', 'Support until 9pm'],
  },
];

// SOHO/Work from Home Plans
// Source: products/connectivity/soho/CircleTel_WorkConnect_SOHO_Product_Portfolio_v1_1.md
const WFH_PLANS: HeroPlan[] = [
  {
    id: 'wc-starter',
    name: 'WorkConnect Starter',
    price: 799,
    speed: '50Mbps',
    type: 'fibre',
    description: 'Never say "sorry, my internet dropped" again.',
    features: ['No contracts', '25GB cloud backup', 'VoIP ready'],
  },
  {
    id: 'wc-plus',
    name: 'WorkConnect Plus',
    price: 1099, // Corrected: was 999, spec says R1,099
    speed: '100Mbps',
    type: 'fibre',
    description: 'Stable enough for back-to-back video calls.',
    badge: 'Popular',
    badgeColor: 'orange',
    featured: true,
    features: ['No contracts', '50GB cloud backup', 'Priority support'],
  },
  {
    id: 'wc-pro',
    name: 'WorkConnect Pro',
    price: 1499,
    speed: '200Mbps',
    type: '5g',
    description: 'Upload large files in minutes, not hours.',
    badge: 'Uncapped',
    badgeColor: 'orange',
    features: ['No contracts', '100GB cloud backup', 'Static IP'],
  },
  {
    id: 'wfh-backup',
    name: '5G Failover',
    price: 399,
    speed: '5G',
    type: '5g',
    description: 'Stay online even when your primary connection fails.',
    badge: 'Add-on',
    badgeColor: 'green',
  },
];

// Business/SME Plans - SkyFibre Business (MTN Tarana G1 FWA)
// Source: products/connectivity/fixed-wireless/SkyFibre_SMB_Commercial_Product_Spec_v2_0.md
const BUSINESS_PLANS: HeroPlan[] = [
  {
    id: 'skyfibre-biz-50',
    name: 'SkyFibre Business 50',
    price: 1299,
    speed: '50/12.5Mbps',
    type: 'fwa',
    description: 'Stable for always-on operations. Zero downtime guarantee.',
    features: ['No contracts', 'Static IP included', 'Truly uncapped'],
  },
  {
    id: 'skyfibre-biz-100',
    name: 'SkyFibre Business 100',
    price: 1499,
    speed: '100/25Mbps',
    type: 'fwa',
    description: 'Run your business without worrying about connectivity.',
    badge: 'Popular',
    badgeColor: 'orange',
    featured: true,
    features: ['No contracts', 'Static IP included', 'Truly uncapped'],
  },
  {
    id: 'skyfibre-biz-200',
    name: 'SkyFibre Business 200',
    price: 1899,
    speed: '200/50Mbps',
    type: 'fwa',
    description: 'Handle demanding workloads without slowdowns.',
    badge: 'Enterprise',
    badgeColor: 'blue',
    features: ['No contracts', 'Static IP included', 'Truly uncapped'],
  },
  {
    id: 'biz-failover',
    name: '5G Failover',
    price: 399,
    speed: '5G',
    type: '5g',
    description: 'Never go offline — auto-switches when primary fails.',
    badge: 'Add-on',
    badgeColor: 'green',
    features: ['Auto-switchover', '50GB data/month', 'Tozed 5G CPE'],
  },
];

// Segment-specific titles and link text
const SEGMENT_CONFIG: Record<SegmentType, { title: string; viewAllText: string; viewAllHref: string }> = {
  home: {
    title: 'Featured Home Deals',
    viewAllText: 'View all home plans',
    viewAllHref: '/packages?type=residential',
  },
  wfh: {
    title: 'WorkConnect Plans',
    viewAllText: 'View all SOHO plans',
    viewAllHref: '/soho',
  },
  business: {
    title: 'Business Connectivity',
    viewAllText: 'View all business solutions',
    viewAllHref: '/business',
  },
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  fibre: PiWifiHighBold,
  '5g': PiCellSignalFullBold,
  lte: PiBatteryChargingBold,
  fwa: PiBuildingsBold,
};

const TYPE_LABELS: Record<string, string> = {
  fibre: 'Fibre',
  '5g': '5G',
  lte: 'LTE',
  fwa: 'Fixed Wireless',
};

// Map plan IDs to their product page slugs (for WorkConnect products)
const PLAN_SLUGS: Record<string, string> = {
  'wc-starter': 'workconnect-starter',
  'wc-plus': 'workconnect-plus',
  'wc-pro': 'workconnect-pro',
};

// Generate the correct "Learn More" link based on plan type
function getPlanLink(planId: string, segment: SegmentType): string {
  // WorkConnect plans link to their dedicated product pages
  if (segment === 'wfh' && PLAN_SLUGS[planId]) {
    return `/workconnect/${PLAN_SLUGS[planId]}`;
  }
  // Failover add-on links to SOHO page
  if (planId === 'wfh-backup' || planId === 'biz-failover') {
    return segment === 'wfh' ? '/soho' : '/business';
  }
  // Default: link to packages page with plan param
  return `/packages?plan=${planId}`;
}

// Technology-based visual differentiation - eliminates "same card" AI slop
const TYPE_STYLES: Record<string, { gradient: string; badgeBg: string; badgeText: string }> = {
  fibre: {
    gradient: 'bg-gradient-to-br from-blue-50 to-white',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-700'
  },
  '5g': {
    gradient: 'bg-gradient-to-br from-purple-50 to-white',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-700'
  },
  fwa: {
    gradient: 'bg-gradient-to-br from-circleTel-orange-light to-white',
    badgeBg: 'bg-circleTel-orange/10',
    badgeText: 'text-circleTel-orange'
  },
  lte: {
    gradient: 'bg-gradient-to-br from-emerald-50 to-white',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-700'
  },
};

interface PlanCardsProps {
  activeSegment?: SegmentType;
}

export function PlanCards({ activeSegment = 'home' }: PlanCardsProps) {
  const prefersReducedMotion = useReducedMotion();

  // Select plans based on segment
  const plans = activeSegment === 'business'
    ? BUSINESS_PLANS
    : activeSegment === 'wfh'
    ? WFH_PLANS
    : HOME_PLANS;

  const config = SEGMENT_CONFIG[activeSegment];
  return (
    <section className="bg-white py-12 md:py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 md:mb-12"
          initial={prefersReducedMotion ? false : { opacity: 0, y: -10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="font-heading text-display-2-mobile md:text-display-2 text-circleTel-navy">
            {config.title}
          </h2>
          <Link
            href={config.viewAllHref}
            className="inline-flex items-center text-circleTel-orange-accessible hover:text-circleTel-orange font-semibold transition-colors group"
          >
            {config.viewAllText}
            <PiArrowRightBold className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        {/* Cards Grid with Staggered Animation */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={prefersReducedMotion ? undefined : containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          {plans.map((plan) => {
            const TypeIcon = TYPE_ICONS[plan.type];
            const typeStyle = TYPE_STYLES[plan.type] || TYPE_STYLES.fwa;

            return (
              <motion.div
                key={plan.id}
                variants={prefersReducedMotion ? undefined : cardVariants}
                whileHover={prefersReducedMotion ? undefined : { scale: 1.02, y: -4 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                className={cn(
                  'relative rounded-2xl p-6 transition-shadow duration-300 cursor-pointer',
                  typeStyle.gradient,
                  plan.featured
                    ? 'ring-2 ring-circleTel-orange shadow-xl z-10'
                    : 'shadow-lg hover:shadow-xl border border-gray-100'
                )}
              >
                {/* Badge */}
                {plan.badge && (
                  <div
                    className={cn(
                      'absolute -top-3 right-4 px-3 py-1 rounded-full text-xs font-semibold',
                      plan.badgeColor === 'green'
                        ? 'bg-emerald-500 text-white'
                        : plan.badgeColor === 'blue'
                        ? 'bg-circleTel-navy text-white'
                        : 'bg-circleTel-orange text-white'
                    )}
                  >
                    {plan.badge}
                  </div>
                )}

                {/* Plan Name */}
                <h3 className="font-heading text-display-4-mobile md:text-display-4 text-circleTel-navy mb-2">
                  {plan.name}
                </h3>

                {/* Price */}
                <div className="mb-4">
                  <span className="font-heading text-3xl md:text-4xl font-bold text-circleTel-navy">
                    R{plan.price.toLocaleString()}
                  </span>
                  <span className="text-circleTel-grey600">/mo</span>
                </div>

                {/* Speed + Type with tech badge */}
                <div className="flex items-center gap-2 mb-3">
                  <span className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium',
                    typeStyle.badgeBg,
                    typeStyle.badgeText
                  )}>
                    <TypeIcon className="h-3 w-3" />
                    {TYPE_LABELS[plan.type]}
                  </span>
                  <span className="font-data text-sm font-semibold text-circleTel-navy">
                    {plan.speed}
                  </span>
                </div>

                {/* Description */}
                <p className="font-body text-sm text-circleTel-navy mb-3">
                  {plan.description}
                </p>

                {/* Features (for business/SOHO plans) */}
                {plan.features && plan.features.length > 0 && (
                  <ul className="mb-4 space-y-1">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-1.5 text-xs text-circleTel-grey600">
                        <span className="text-emerald-500">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                )}

                {/* CTA Button */}
                <Button
                  variant="outline"
                  className="w-full border-circleTel-navy text-circleTel-navy hover:bg-circleTel-navy hover:text-white transition-colors mt-auto"
                  asChild
                >
                  <Link href={getPlanLink(plan.id, activeSegment)}>
                    Learn More
                  </Link>
                </Button>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Promotional Banner (optional - can be enabled when promotions are active) */}
        {/* <div className="mt-8 p-4 bg-circleTel-orange/10 rounded-xl text-center">
          <p className="text-circleTel-navy font-semibold">
            <PiLightningBold className="inline-block h-5 w-5 text-circleTel-orange mr-2" />
            Sign up this month and get your first month FREE!
          </p>
        </div> */}
      </div>
    </section>
  );
}
