import { PiArrowRightBold, PiCheckCircleBold, PiWifiHighBold } from 'react-icons/pi';
import { Metadata } from 'next';
import Link from 'next/link';
import { client } from '@/lib/sanity/client';
import { WORKCONNECT_ALL_QUERY } from '@/lib/sanity/queries';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'WorkConnect Plans | SOHO Internet | CircleTel',
  description: 'Compare WorkConnect plans for freelancers, remote workers, and small home offices. From R799/month with VoIP QoS and cloud backup included.',
};

interface WorkConnectPlan {
  _id: string;
  name: string;
  tagline: string;
  slug: string;
  pricing: {
    startingPrice: number;
    priceNote?: string;
  };
  keyFeatures: Array<{
    title: string;
    description?: string;
  }>;
}

export const revalidate = 3600; // Revalidate every hour

export default async function WorkConnectPage() {
  const plans = await client.fetch<WorkConnectPlan[]>(WORKCONNECT_ALL_QUERY);

  // Determine which plan is "featured" (Plus)
  const featuredSlug = 'workconnect-plus';

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-circleTel-grey200 py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-circleTel-orange/10 rounded-full mb-6">
            <PiWifiHighBold className="w-4 h-4 text-circleTel-orange" />
            <span className="text-sm font-medium text-circleTel-orange">
              Built for Remote Work
            </span>
          </div>

          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-circleTel-navy mb-6">
            WorkConnect Plans
          </h1>

          <p className="font-body text-lg md:text-xl text-circleTel-grey600 mb-8 max-w-2xl mx-auto">
            Reliable connectivity for freelancers, remote workers, and small home offices.
            All plans include VoIP QoS, cloud backup, and business email.
          </p>
        </div>
      </section>

      {/* Plans Grid */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan) => {
              const isFeatured = plan.slug === featuredSlug;
              return (
                <div
                  key={plan._id}
                  className={cn(
                    'relative bg-white rounded-2xl p-6 md:p-8 transition-all duration-300',
                    isFeatured
                      ? 'ring-2 ring-circleTel-orange shadow-xl scale-[1.02] z-10'
                      : 'shadow-lg hover:shadow-xl border border-gray-100'
                  )}
                >
                  {/* Badge */}
                  {isFeatured && (
                    <div className="absolute -top-3 right-4 px-3 py-1 rounded-full text-xs font-semibold bg-circleTel-orange text-white">
                      Most Popular
                    </div>
                  )}

                  {/* Plan Name */}
                  <h2 className="font-heading text-xl font-semibold text-circleTel-navy mb-1">
                    {plan.name}
                  </h2>
                  <p className="font-body text-sm text-circleTel-grey600 mb-4">
                    {plan.tagline}
                  </p>

                  {/* Price */}
                  <div className="mb-4">
                    <span className="font-heading text-4xl font-bold text-circleTel-navy">
                      R{plan.pricing.startingPrice.toLocaleString()}
                    </span>
                    <span className="text-circleTel-grey600">/mo</span>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2 mb-6 min-h-[180px]">
                    {plan.keyFeatures.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <PiCheckCircleBold className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-circleTel-navy">{feature.title}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Button
                    className={cn(
                      'w-full',
                      isFeatured
                        ? 'bg-circleTel-orange hover:bg-circleTel-orange-dark text-white'
                        : 'bg-circleTel-navy hover:bg-circleTel-navy/90 text-white'
                    )}
                    asChild
                  >
                    <Link href={`/workconnect/${plan.slug}`}>
                      Learn More
                      <PiArrowRightBold className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              );
            })}
          </div>

          {/* Footnote */}
          <p className="text-center text-sm text-circleTel-grey600 mt-8">
            All prices exclude VAT. No contracts required. Free professional installation.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-circleTel-navy py-16 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-white mb-4">
            Not sure which plan is right for you?
          </h2>
          <p className="font-body text-lg text-gray-300 mb-8">
            Check coverage at your address and we&apos;ll recommend the best option.
          </p>
          <Button
            size="lg"
            className="bg-circleTel-orange hover:bg-circleTel-orange-dark text-white px-8"
            asChild
          >
            <Link href="/?segment=wfh">
              Check Coverage
              <PiArrowRightBold className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
