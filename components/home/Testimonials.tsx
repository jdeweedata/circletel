'use client';

import React from 'react';
import { Star } from 'lucide-react';
import type { SegmentType } from './SegmentTabs';

interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role?: string;
  location: string;
  stars: number;
}

// Home/Consumer testimonials
const HOME_TESTIMONIALS: Testimonial[] = [
  {
    id: 'h1',
    quote: "Finally, internet that just works. My kids game, I stream, my wife works — all at the same time.",
    author: 'Thandi M.',
    location: 'Sandton',
    stars: 5,
  },
  {
    id: 'h2',
    quote: "Netflix in 4K on 3 TVs and nobody complains. Best switch we ever made.",
    author: 'Johan V.',
    location: 'Centurion',
    stars: 5,
  },
  {
    id: 'h3',
    quote: "Free installation and no contracts? I was skeptical, but 8 months in and not a single issue.",
    author: 'Naledi P.',
    location: 'Pretoria',
    stars: 5,
  },
];

// SOHO/WFH testimonials
const WFH_TESTIMONIALS: Testimonial[] = [
  {
    id: 'w1',
    quote: "I switched after one too many dropped Zoom calls. CircleTel's symmetric upload is a game changer for remote work.",
    author: 'Sipho K.',
    role: 'Freelance Developer',
    location: 'Cape Town',
    stars: 5,
  },
  {
    id: 'w2',
    quote: "Video calls never drop, even during load shedding with their 5G backup option. Essential for my consulting work.",
    author: 'Thabo M.',
    role: 'Business Consultant',
    location: 'Johannesburg',
    stars: 5,
  },
  {
    id: 'w3',
    quote: "My team of 3 all work from home and share the same connection. VoIP quality is crystal clear.",
    author: 'Lerato N.',
    role: 'Agency Owner',
    location: 'Durban',
    stars: 5,
  },
];

// Business testimonials
const BUSINESS_TESTIMONIALS: Testimonial[] = [
  {
    id: 'b1',
    quote: "The 99.9% SLA saved our month-end processing. Zero downtime in 8 months of operation.",
    author: 'Rebecca S.',
    role: 'Operations Director',
    location: 'Sandton',
    stars: 5,
  },
  {
    id: 'b2',
    quote: "Same-day support response and a dedicated account manager. This is what enterprise service should look like.",
    author: 'Michael C.',
    role: 'IT Manager',
    location: 'Rosebank',
    stars: 5,
  },
  {
    id: 'b3',
    quote: "We connected 5 branch offices with their business fibre. Static IPs and VPN support made it seamless.",
    author: 'Pieter V.',
    role: 'CTO',
    location: 'Cape Town',
    stars: 5,
  },
];

// Segment-specific trust metrics
const TRUST_METRICS: Record<SegmentType, string[]> = {
  home: [
    '10,000+ homes connected',
    '99.9% uptime',
    'Free installation',
  ],
  wfh: [
    '2,500+ remote workers',
    'HD video optimized',
    '4.8★ Google rating',
  ],
  business: [
    '500+ businesses connected',
    '99.9% SLA guaranteed',
    '4-hour response time',
  ],
};

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
      ))}
    </div>
  );
}

interface TestimonialsProps {
  activeSegment?: SegmentType;
}

export function Testimonials({ activeSegment = 'home' }: TestimonialsProps) {
  // Select testimonials based on segment
  const testimonials = activeSegment === 'business'
    ? BUSINESS_TESTIMONIALS
    : activeSegment === 'wfh'
    ? WFH_TESTIMONIALS
    : HOME_TESTIMONIALS;

  const trustMetrics = TRUST_METRICS[activeSegment];
  return (
    <section className="bg-white py-12 md:py-20">
      <div className="container mx-auto px-4">
        {/* Heading */}
        <h2 className="font-heading text-2xl md:text-3xl lg:text-4xl font-bold text-circleTel-navy text-center mb-12">
          What our customers say
        </h2>

        {/* Testimonial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {testimonials.map((testimonial) => (
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
                  {testimonial.role && (
                    <p className="font-body text-xs text-circleTel-orange">
                      {testimonial.role}
                    </p>
                  )}
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
          {trustMetrics.map((metric, index) => (
            <React.Fragment key={metric}>
              <span className="font-body text-sm md:text-base font-medium text-circleTel-navy">
                {metric}
              </span>
              {index < trustMetrics.length - 1 && (
                <span className="hidden md:inline text-gray-300">·</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
