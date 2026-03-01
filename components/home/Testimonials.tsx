'use client';

import React from 'react';
import { Star } from 'lucide-react';

interface Testimonial {
  id: string;
  quote: string;
  author: string;
  location: string;
  stars: number;
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: '1',
    quote: "Finally, internet that just works. My kids game, I stream, my wife works — all at the same time.",
    author: 'Thandi M.',
    location: 'Sandton',
    stars: 5,
  },
  {
    id: '2',
    quote: "I switched from a competitor after one too many dropped Zoom calls. CircleTel's symmetric upload is a game changer.",
    author: 'Sipho K.',
    location: 'Cape Town',
    stars: 5,
  },
  {
    id: '3',
    quote: "The SLA and same-day support response sold us. We haven't had a single outage in 8 months.",
    author: 'Naledi P.',
    location: 'Pretoria',
    stars: 5,
  },
];

const TRUST_METRICS = [
  '10,000+ homes connected',
  '99.9% uptime',
  '4.7★ on Hellopeter',
];

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
      ))}
    </div>
  );
}

export function Testimonials() {
  return (
    <section className="bg-white py-12 md:py-20">
      <div className="container mx-auto px-4">
        {/* Heading */}
        <h2 className="font-heading text-2xl md:text-3xl lg:text-4xl font-bold text-circleTel-navy text-center mb-12">
          What our customers say
        </h2>

        {/* Testimonial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {TESTIMONIALS.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100"
            >
              {/* Stars */}
              <StarRating count={testimonial.stars} />

              {/* Quote */}
              <p className="font-body text-circleTel-navy italic mt-4 mb-6 text-sm md:text-base leading-relaxed">
                &ldquo;{testimonial.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                {/* Avatar placeholder */}
                <div className="w-10 h-10 bg-circleTel-grey200 rounded-full flex items-center justify-center">
                  <span className="font-heading text-sm font-semibold text-circleTel-navy">
                    {testimonial.author.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-heading text-sm font-semibold text-circleTel-navy">
                    {testimonial.author}
                  </p>
                  <p className="font-body text-xs text-circleTel-grey600">
                    {testimonial.location}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Metrics Bar */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-4 md:gap-8">
          {TRUST_METRICS.map((metric, index) => (
            <React.Fragment key={metric}>
              <span className="font-body text-sm md:text-base font-medium text-circleTel-navy">
                {metric}
              </span>
              {index < TRUST_METRICS.length - 1 && (
                <span className="hidden md:inline text-gray-300">·</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
