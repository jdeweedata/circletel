'use client';

import { PortableText, PortableTextComponents } from '@portabletext/react';
import Image from 'next/image';
import Link from 'next/link';
import { urlFor } from '@/lib/sanity/image';

// Import block components
import { HeroBlock } from './blocks/HeroBlock';
import { FeatureGridBlock } from './blocks/FeatureGridBlock';
import { PricingBlock } from './blocks/PricingBlock';
import { FAQBlock } from './blocks/FAQBlock';
import { ComparisonBlock } from './blocks/ComparisonBlock';
import { TestimonialBlock } from './blocks/TestimonialBlock';
import { ProductShowcaseBlock } from './blocks/ProductShowcaseBlock';

// Custom serializers for Portable Text
export const portableTextComponents: PortableTextComponents = {
  types: {
    // Block types (equivalent to Prismic slices)
    heroBlock: ({ value }) => <HeroBlock {...value} />,
    featureGridBlock: ({ value }) => <FeatureGridBlock {...value} />,
    pricingBlock: ({ value }) => <PricingBlock {...value} />,
    faqBlock: ({ value }) => <FAQBlock {...value} />,
    comparisonBlock: ({ value }) => <ComparisonBlock {...value} />,
    testimonialBlock: ({ value }) => <TestimonialBlock {...value} />,
    productShowcaseBlock: ({ value }) => <ProductShowcaseBlock {...value} />,

    // Image handling
    image: ({ value }) => {
      if (!value?.asset?._ref) return null;
      return (
        <figure className="my-8">
          <Image
            src={urlFor(value).width(1200).url()}
            alt={value.alt || ''}
            width={1200}
            height={675}
            className="rounded-lg"
          />
          {value.caption && (
            <figcaption className="text-sm text-gray-500 mt-2 text-center">
              {value.caption}
            </figcaption>
          )}
        </figure>
      );
    },

    // Code blocks
    code: ({ value }) => (
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4">
        <code className={`language-${value.language || 'text'}`}>
          {value.code}
        </code>
      </pre>
    ),
  },

  // Standard block elements
  block: {
    h1: ({ children }) => (
      <h1 className="font-heading text-display-1 text-circleTel-navy mt-12 mb-4">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="font-heading text-display-2 text-circleTel-navy mt-10 mb-4">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="font-heading text-display-3 text-circleTel-navy mt-8 mb-3">
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="font-heading text-display-4 text-circleTel-navy mt-6 mb-2">
        {children}
      </h4>
    ),
    normal: ({ children }) => (
      <p className="font-body text-base text-circleTel-grey600 mb-4 leading-relaxed">
        {children}
      </p>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-circleTel-orange pl-4 my-6 italic text-circleTel-grey600">
        {children}
      </blockquote>
    ),
  },

  // List handling
  list: {
    bullet: ({ children }) => (
      <ul className="list-disc list-inside my-4 space-y-2 text-circleTel-grey600">
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol className="list-decimal list-inside my-4 space-y-2 text-circleTel-grey600">
        {children}
      </ol>
    ),
  },

  listItem: {
    bullet: ({ children }) => <li className="ml-4">{children}</li>,
    number: ({ children }) => <li className="ml-4">{children}</li>,
  },

  // Marks (inline styles)
  marks: {
    link: ({ value, children }) => {
      const href = value?.href || '';
      const isExternal = href.startsWith('http');

      if (isExternal) {
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-circleTel-orange hover:text-circleTel-orange-dark underline"
          >
            {children}
          </a>
        );
      }

      return (
        <Link
          href={href}
          className="text-circleTel-orange hover:text-circleTel-orange-dark underline"
        >
          {children}
        </Link>
      );
    },
    strong: ({ children }) => (
      <strong className="font-semibold text-circleTel-navy">{children}</strong>
    ),
    em: ({ children }) => <em className="italic">{children}</em>,
    code: ({ children }) => (
      <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-circleTel-navy">
        {children}
      </code>
    ),
    highlight: ({ children }) => (
      <span className="bg-circleTel-orange/10 px-1">{children}</span>
    ),
  },
};

// Main component to render Portable Text content
interface SanityContentProps {
  content: any[];
  className?: string;
}

export function SanityContent({ content, className = '' }: SanityContentProps) {
  if (!content || !Array.isArray(content)) return null;

  return (
    <div className={className}>
      <PortableText value={content} components={portableTextComponents} />
    </div>
  );
}
