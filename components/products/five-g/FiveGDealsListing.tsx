import { ShopCta } from '@/components/home/shop/ShopCta';
import { getWhatsAppLink } from '@/lib/constants/contact';
import { HUAWEI_H155_386, splitFiveGDeals, type FiveGDealPackage } from '@/lib/products/five-g-deals';
import { FiveGDealCard } from './FiveGDealCard';

interface FiveGDealsListingProps {
  packages: FiveGDealPackage[];
}

function DealGrid({
  title,
  description,
  packages,
  cta,
}: {
  title: string;
  description?: string;
  packages: FiveGDealPackage[];
  cta: 'view-deal' | 'coverage';
}) {
  if (packages.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-12 md:py-16">
      <h2 className="font-heading text-3xl font-bold text-circleTel-navy md:text-4xl">{title}</h2>
      {description ? (
        <p className="mt-3 max-w-2xl font-body text-base leading-7 text-circleTel-grey600">{description}</p>
      ) : null}
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 md:gap-8">
        {packages.map((product) => (
          <FiveGDealCard key={product.id || product.sku} product={product} cta={cta} />
        ))}
      </div>
    </section>
  );
}

export function FiveGDealsListing({ packages }: FiveGDealsListingProps) {
  const { featured, contractRouter, simOnly, other } = splitFiveGDeals(packages);

  return (
    <div className="bg-ui-bg">
      <section className="bg-ui-bg">
        <div className="container mx-auto grid items-center gap-10 px-4 py-16 md:grid-cols-2 md:gap-16 md:py-24">
          <div className="max-w-xl">
            <p className="font-heading text-xs font-extrabold uppercase tracking-[0.2em] text-circleTel-orange-accessible">
              Promo to 30 Sep
            </p>
            <h1 className="mt-3 font-heading text-4xl font-extrabold leading-[1.05] tracking-tight text-circleTel-navy sm:text-5xl">
              Home 5G with a router, from R549 a month
            </h1>
            <p className="mt-5 font-body text-lg leading-8 text-circleTel-grey600">
              5G 60 plus a Huawei router is R649/month until 30 Sep. 24-month contract. Ts&Cs apply.
            </p>
            <p className="mt-3 font-body text-base leading-7 text-circleTel-grey600">
              Uncapped 20 Mbps with a router is R549/month. Month-to-month plans do not include a router.
            </p>
            <ul className="mt-6 space-y-2 font-body text-sm text-circleTel-navy">
              <li>24-month plans include the router</li>
              <li>Month-to-month is SIM only — use your own router</li>
              <li>5G depends on coverage at your address</li>
            </ul>
            <div className="mt-8">
              <ShopCta href="/coverage">Check coverage</ShopCta>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-ui-border bg-white shadow">
            <img
              src={HUAWEI_H155_386.image}
              alt={HUAWEI_H155_386.alt}
              width={800}
              height={600}
              className="h-full w-full object-contain p-8"
            />
          </div>
        </div>
      </section>

      <DealGrid
        title="Until 30 Sep"
        description="Uncapped 5G 60 at R649/month and Uncapped 20 Mbps at R549/month. Router included. 24-month contract. Ts&Cs apply."
        packages={featured}
        cta="view-deal"
      />

      <DealGrid
        title="24-month + router"
        description="These plans include a router. Check coverage at your address to order."
        packages={contractRouter}
        cta="coverage"
      />

      <DealGrid
        title="Month-to-month SIM only"
        description="No contract. These plans do not include a router — bring a compatible 5G device."
        packages={simOnly}
        cta="coverage"
      />

      <DealGrid title="More 5G packages" packages={other} cta="coverage" />

      <section className="border-t border-ui-border bg-white py-12 md:py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-heading text-2xl font-bold text-circleTel-navy md:text-3xl">
            See if 5G covers your address
          </h2>
          <p className="mx-auto mt-3 max-w-2xl font-body text-base leading-7 text-circleTel-grey600">
            Coverage depends on the signal at your premises. Check first. WhatsApp us if you want help choosing a plan.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <ShopCta href="/coverage">Check coverage</ShopCta>
            <ShopCta href={getWhatsAppLink('Hi CircleTel, I need help choosing a 5G deal')} variant="outline-navy">
              WhatsApp us
            </ShopCta>
          </div>
        </div>
      </section>
    </div>
  );
}
