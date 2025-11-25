/**
 * PackageGrid Slice (HYBRID)
 *
 * IMPORTANT: This is a HYBRID slice that combines:
 * 1. Prismic CMS configuration (heading, filters, layout preferences)
 * 2. Runtime Supabase data fetching (actual packages based on coverage)
 *
 * This ensures marketing team can configure the display while packages
 * remain dynamic based on real-time coverage and database state.
 */

'use client';

import { Content } from '@prismicio/client';
import { SliceComponentProps } from '@prismicio/react';
import { useEffect, useState } from 'react';
import CompactPackageCard from '@/components/ui/compact-package-card';

export type PackageGridSlice = SliceComponentProps<Content.PackageGridSlice>;

const PackageGrid = ({ slice }: PackageGridSlice): JSX.Element => {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        // Fetch packages from Supabase based on Prismic filters
        const params = new URLSearchParams();

        if (slice.primary.filter_service_type) {
          params.append('service_type', slice.primary.filter_service_type);
        }
        if (slice.primary.filter_customer_type) {
          params.append('customer_type', slice.primary.filter_customer_type);
        }
        if (slice.primary.is_featured_only) {
          params.append('is_featured', 'true');
        }
        params.append('limit', String(slice.primary.max_packages || 8));

        const response = await fetch(`/api/packages?${params.toString()}`);
        const data = await response.json();

        setPackages(data.packages || []);
      } catch (error) {
        console.error('Failed to fetch packages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, [slice.primary]);

  return (
    <section
      className="py-16 md:py-24 bg-white"
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      <div className="container mx-auto px-4">
        {/* Section Heading from Prismic */}
        {slice.primary.heading && (
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-circleTel-darkNeutral mb-4">
              {slice.primary.heading}
            </h2>
            {slice.primary.subheading && (
              <p className="text-lg text-circleTel-secondaryNeutral max-w-3xl mx-auto">
                {slice.primary.subheading}
              </p>
            )}
          </div>
        )}

        {/* Packages Grid (from Supabase) */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-circleTel-secondaryNeutral">Loading packages...</p>
          </div>
        ) : packages.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {packages.map((pkg) => (
              <CompactPackageCard
                key={pkg.id}
                id={pkg.id}
                name={pkg.name}
                speed={pkg.speed_down}
                uploadSpeed={pkg.speed_up}
                price={pkg.price}
                promoPrice={pkg.promotion_price}
                promoBadge={pkg.metadata?.promo_badge}
                badgeColor={pkg.metadata?.badge_color}
                provider={pkg.provider}
                isSelected={false}
                onSelect={() => {}}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-circleTel-secondaryNeutral">
              No packages available at this time.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default PackageGrid;
