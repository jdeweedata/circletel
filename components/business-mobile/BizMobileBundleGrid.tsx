import { BIZ_MOBILE_BUNDLES } from '@/lib/data/business-mobile';
import { BizMobileBundleCard } from './BizMobileBundleCard';

export function BizMobileBundleGrid() {
  return (
    <section className="py-24 bg-[#F8F9FA]">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-16">
          <h2
            className="text-3xl md:text-4xl font-extrabold text-[#1E293B] mb-4"
            style={{ letterSpacing: '-0.02em' }}
          >
            Choose Your Plan
          </h2>
          <p className="text-[#6B7280] max-w-2xl mx-auto">
            Scalable solutions designed around the real pain points of South African SMEs.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {BIZ_MOBILE_BUNDLES.map((bundle) => (
            <BizMobileBundleCard key={bundle.id} {...bundle} />
          ))}
        </div>
      </div>
    </section>
  );
}
