import type { ReactNode } from 'react';
import { PiCheckCircleBold, PiWifiHighBold } from 'react-icons/pi';

import { ShopCta } from '@/components/home/shop/ShopCta';
import {
  FIVE_G_HERO,
  getFiveGContractRouterCards,
  splitFiveGDeals,
  type FiveGDealPackage,
} from '@/lib/products/five-g-deals';
import { FiveGDealCard } from './FiveGDealCard';

interface FiveGDealsListingProps {
  packages: FiveGDealPackage[];
}

function SectionBadge({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-ui-bg px-3 py-1 font-body text-xs font-semibold text-circleTel-navy">
      {icon}
      {label}
    </span>
  );
}

function DealGrid({
  title,
  badge,
  packages,
  columnsClass,
}: {
  title: string;
  badge: ReactNode;
  packages: FiveGDealPackage[];
  columnsClass: string;
}) {
  if (packages.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-12 md:py-16">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-heading text-3xl font-bold text-circleTel-navy md:text-4xl">{title}</h2>
        {badge}
      </div>
      <div className={`mt-8 grid gap-5 ${columnsClass}`}>
        {packages.map((product) => (
          <FiveGDealCard key={product.id || product.sku} product={product} variant="compact" />
        ))}
      </div>
    </section>
  );
}

export function FiveGDealsListing({ packages }: FiveGDealsListingProps) {
  const { featured, simOnly, other } = splitFiveGDeals(packages);
  const contractRouter = getFiveGContractRouterCards(packages);

  return (
    <div className="bg-ui-bg">
      <section className="bg-ui-bg">
        <div className="container mx-auto grid items-center gap-10 px-4 py-16 md:grid-cols-2 md:gap-16 md:py-24">
          <div className="max-w-xl">
            <h1 className="font-heading text-4xl font-extrabold leading-[1.05] tracking-tight text-circleTel-navy sm:text-5xl">
              5G home internet, minus the runaround.
            </h1>
            <p className="mt-5 font-body text-lg leading-8 text-circleTel-grey600">
              Promo to 30 Sep. Router included on 24-month deals.
            </p>
            <div className="mt-8">
              <ShopCta href="/coverage">Check coverage</ShopCta>
            </div>
          </div>
          <div className="overflow-hidden rounded-3xl">
            <img
              src={FIVE_G_HERO.image}
              alt={FIVE_G_HERO.alt}
              width={1280}
              height={720}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      {featured.length > 0 ? (
        <section className="container mx-auto px-4 pb-8 md:pb-12">
          <div className="grid gap-6 md:grid-cols-2">
            {featured.map((product) => (
              <FiveGDealCard key={product.id || product.sku} product={product} variant="featured" />
            ))}
          </div>
          <p className="mt-4 font-body text-sm text-circleTel-grey600">Ts&Cs apply.</p>
        </section>
      ) : null}

      <DealGrid
        title="24-month + router"
        badge={
          <SectionBadge
            icon={<PiCheckCircleBold className="h-3.5 w-3.5" aria-hidden="true" />}
            label="Router included"
          />
        }
        packages={contractRouter}
        columnsClass="sm:grid-cols-2 lg:grid-cols-3"
      />

      <DealGrid
        title="Month-to-month SIM only"
        badge={
          <SectionBadge
            icon={<PiWifiHighBold className="h-3.5 w-3.5" aria-hidden="true" />}
            label="BYO router"
          />
        }
        packages={simOnly}
        columnsClass="sm:grid-cols-2 lg:grid-cols-4"
      />

      <DealGrid
        title="More 5G packages"
        badge={null}
        packages={other}
        columnsClass="sm:grid-cols-2 lg:grid-cols-3"
      />
    </div>
  );
}
