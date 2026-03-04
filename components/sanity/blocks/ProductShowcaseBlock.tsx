'use client';
import { PiArrowRightBold, PiCheckBold} from 'react-icons/pi';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { urlFor } from '@/lib/sanity/image';

interface ProductShowcaseBlockProps {
  title: string;
  subtitle?: string;
  image?: any;
  features?: string[];
  price?: {
    amount: number;
    period?: string;
    originalAmount?: number;
  };
  cta?: {
    label: string;
    href: string;
  };
  badge?: string;
  layout?: 'left' | 'right';
}

export function ProductShowcaseBlock({
  title,
  subtitle,
  image,
  features,
  price,
  cta,
  badge,
  layout = 'left',
}: ProductShowcaseBlockProps) {
  const imageOnLeft = layout === 'left';

  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className={`flex flex-col ${imageOnLeft ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-12`}>
          {/* Image */}
          {image?.asset && (
            <div className="flex-1 relative">
              {badge && (
                <span className="absolute top-4 left-4 bg-circleTel-orange text-white text-sm font-semibold px-3 py-1 rounded-full z-10">
                  {badge}
                </span>
              )}
              <Image
                src={urlFor(image).width(600).height(400).url()}
                alt={image.alt || title}
                width={600}
                height={400}
                className="rounded-2xl shadow-xl"
              />
            </div>
          )}

          {/* Content */}
          <div className="flex-1">
            <h2 className="font-heading text-display-2 text-circleTel-navy mb-4">
              {title}
            </h2>

            {subtitle && (
              <p className="font-body text-lg text-circleTel-grey600 mb-6">
                {subtitle}
              </p>
            )}

            {/* Features List */}
            {features && features.length > 0 && (
              <ul className="space-y-3 mb-8">
                {features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center mt-0.5">
                      <PiCheckBold className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="font-body text-circleTel-grey600">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {/* Price */}
            {price && (
              <div className="mb-8">
                {price.originalAmount && (
                  <span className="text-circleTel-grey600 line-through mr-2">
                    R{price.originalAmount.toLocaleString()}
                  </span>
                )}
                <span className="font-heading text-4xl font-bold text-circleTel-navy">
                  R{price.amount.toLocaleString()}
                </span>
                {price.period && (
                  <span className="text-circleTel-grey600">/{price.period}</span>
                )}
              </div>
            )}

            {/* CTA */}
            {cta && (
              <Button
                asChild
                size="lg"
                className="bg-circleTel-orange hover:bg-circleTel-orange-dark text-white"
              >
                <Link href={cta.href}>
                  {cta.label}
                  <PiArrowRightBold className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
