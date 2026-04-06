import { BizMobileBundleCard } from '@/components/business-mobile/BizMobileBundleCard';

interface SanityBundle {
  _key: string;
  name: string;
  tagline?: string;
  badge?: string;
  badgeColor?: 'primary' | 'secondary' | 'navy' | 'purple';
  icon?: string;
  priceFrom?: string;
  priceSuffix?: string;
  features?: string[];
  ctaLabel?: string;
  ctaUrl?: string;
  featured?: boolean;
}

interface BundleGridBlockProps {
  eyebrow?: string;
  headline?: string;
  description?: string;
  bundles?: SanityBundle[];
  columns?: 2 | 3 | 4;
}

const GRID_COLS: Record<number, string> = {
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'lg:grid-cols-4 md:grid-cols-2',
};

export function BundleGridBlock({
  eyebrow,
  headline,
  description,
  bundles = [],
  columns = 4,
}: BundleGridBlockProps) {
  const gridCols = GRID_COLS[columns] ?? GRID_COLS[4];

  return (
    <section className="py-24 bg-[#F8F9FA]">
      <div className="max-w-[1200px] mx-auto px-6">
        {(eyebrow || headline || description) && (
          <div className="text-center mb-16">
            {eyebrow && (
              <span className="inline-block text-sm font-semibold text-[#E87A1E] uppercase tracking-widest mb-3">
                {eyebrow}
              </span>
            )}
            {headline && (
              <h2
                className="text-3xl md:text-4xl font-extrabold text-[#1E293B] mb-4"
                style={{ letterSpacing: '-0.02em' }}
              >
                {headline}
              </h2>
            )}
            {description && (
              <p className="text-[#6B7280] max-w-2xl mx-auto">{description}</p>
            )}
          </div>
        )}
        <div className={`grid grid-cols-1 ${gridCols} gap-8`}>
          {bundles.map((bundle) => (
            <BizMobileBundleCard
              key={bundle._key}
              id={bundle._key}
              name={bundle.name}
              tagline={bundle.tagline ?? ''}
              badge={bundle.badge ?? ''}
              badgeVariant={bundle.badgeColor ?? 'primary'}
              icon={bundle.icon ?? 'smartphone'}
              priceFrom={bundle.priceFrom ?? ''}
              priceSuffix={bundle.priceSuffix ?? ''}
              features={(bundle.features ?? []).map((text) => ({ text }))}
              ctaLabel={bundle.ctaLabel ?? 'Get Started'}
              href={bundle.ctaUrl ?? '#'}
              featured={bundle.featured ?? false}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
