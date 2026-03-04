'use client';
import { PiClockBold, PiGlobeBold, PiHeadphonesBold, PiLightningBold, PiDesktopTowerBold, PiShieldBold, PiUsersBold, PiWifiHighBold } from 'react-icons/pi';


// Icon mapping for dynamic icon selection
const iconMap: Record<string, LucideIcon> = {
  wifi: Wifi,
  shield: Shield,
  clock: Clock,
  headphones: Headphones,
  zap: Zap,
  globe: Globe,
  server: Server,
  users: Users,
};

interface Feature {
  _key: string;
  icon?: string;
  title: string;
  description: string;
}

interface FeatureGridBlockProps {
  title?: string;
  subtitle?: string;
  features: Feature[];
  columns?: 2 | 3 | 4;
  variant?: 'cards' | 'minimal' | 'icons';
}

export function FeatureGridBlock({
  title,
  subtitle,
  features,
  columns = 3,
  variant = 'cards',
}: FeatureGridBlockProps) {
  const columnClasses = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-2 lg:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        {(title || subtitle) && (
          <div className="text-center mb-12">
            {title && (
              <h2 className="font-heading text-display-2 text-circleTel-navy mb-4">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="font-body text-lg text-circleTel-grey600 max-w-2xl mx-auto">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* Feature Grid */}
        <div className={`grid grid-cols-1 ${columnClasses[columns]} gap-6 md:gap-8`}>
          {features?.map((feature) => {
            const Icon = feature.icon ? iconMap[feature.icon] || Zap : Zap;

            if (variant === 'minimal') {
              return (
                <div key={feature._key} className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-circleTel-orange/10 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-circleTel-orange" />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-semibold text-circleTel-navy mb-1">
                      {feature.title}
                    </h3>
                    <p className="font-body text-sm text-circleTel-grey600">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            }

            if (variant === 'icons') {
              return (
                <div key={feature._key} className="text-center">
                  <div className="w-16 h-16 bg-circleTel-orange/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-circleTel-orange" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-circleTel-navy mb-2">
                    {feature.title}
                  </h3>
                  <p className="font-body text-sm text-circleTel-grey600">
                    {feature.description}
                  </p>
                </div>
              );
            }

            // Default: cards variant
            return (
              <div
                key={feature._key}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow"
              >
                <div className="w-12 h-12 bg-circleTel-orange/10 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-circleTel-orange" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-circleTel-navy mb-2">
                  {feature.title}
                </h3>
                <p className="font-body text-sm text-circleTel-grey600">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
