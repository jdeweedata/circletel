'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { SegmentType } from './SegmentTabs';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12 }
  }
} as const;

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
} as const;

interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role?: string;
  location: string;
  segment: 'home' | 'wfh' | 'business';
}

// Segment badge config - replaces generic star ratings
const SEGMENT_BADGES: Record<string, { label: string; bgColor: string; textColor: string }> = {
  home: { label: 'Home', bgColor: 'bg-emerald-100', textColor: 'text-emerald-700' },
  wfh: { label: 'SOHO', bgColor: 'bg-purple-100', textColor: 'text-purple-700' },
  business: { label: 'Business', bgColor: 'bg-circleTel-orange/10', textColor: 'text-circleTel-orange' },
};

// Home/Consumer testimonials
const HOME_TESTIMONIALS: Testimonial[] = [
  {
    id: 'h1',
    quote: "Finally, internet that just works. My kids game, I stream, my wife works — all at the same time.",
    author: 'Thandi M.',
    location: 'Sandton',
    segment: 'home',
  },
  {
    id: 'h2',
    quote: "Netflix in 4K on 3 TVs and nobody complains. Best switch we ever made.",
    author: 'Johan V.',
    location: 'Centurion',
    segment: 'home',
  },
  {
    id: 'h3',
    quote: "Free installation and no contracts? I was skeptical, but 8 months in and not a single issue.",
    author: 'Naledi P.',
    location: 'Pretoria',
    segment: 'home',
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
    segment: 'wfh',
  },
  {
    id: 'w2',
    quote: "Video calls never drop. The 5G backup kicks in automatically if anything goes wrong. Essential for my consulting work.",
    author: 'Thabo M.',
    role: 'Business Consultant',
    location: 'Johannesburg',
    segment: 'wfh',
  },
  {
    id: 'w3',
    quote: "My team of 3 all work from home and share the same connection. VoIP quality is crystal clear.",
    author: 'Lerato N.',
    role: 'Agency Owner',
    location: 'Durban',
    segment: 'wfh',
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
    segment: 'business',
  },
  {
    id: 'b2',
    quote: "Same-day support response and a dedicated account manager. This is what enterprise service should look like.",
    author: 'Michael C.',
    role: 'IT Manager',
    location: 'Rosebank',
    segment: 'business',
  },
  {
    id: 'b3',
    quote: "We connected 5 branch offices with their business fibre. Static IPs and VPN support made it seamless.",
    author: 'Pieter V.',
    role: 'CTO',
    location: 'Cape Town',
    segment: 'business',
  },
];

// Segment-specific trust metrics - use deliverable promises, not fake customer counts
const TRUST_METRICS: Record<SegmentType, { value: string; label: string }[]> = {
  home: [
    { value: 'R0', label: 'setup fees' },
    { value: '7 days', label: 'to get online' },
    { value: 'No', label: 'contracts' },
  ],
  wfh: [
    { value: 'R0', label: 'setup fees' },
    { value: '7 days', label: 'to get online' },
    { value: 'No', label: 'contracts' },
  ],
  business: [
    { value: 'R0', label: 'setup fees' },
    { value: '4hr', label: 'response time' },
    { value: 'No', label: 'contracts' },
  ],
};

interface TestimonialsProps {
  activeSegment?: SegmentType;
}

export function Testimonials({ activeSegment = 'home' }: TestimonialsProps) {
  const prefersReducedMotion = useReducedMotion();

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
        <motion.h2
          className="font-heading text-display-2-mobile md:text-display-2 text-circleTel-navy text-center mb-12"
          initial={prefersReducedMotion ? false : { opacity: 0, y: -10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          What our customers say
        </motion.h2>

        {/* Testimonial Cards - Quote-Forward Design */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto"
          variants={prefersReducedMotion ? undefined : containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          {testimonials.map((testimonial) => {
            const badge = SEGMENT_BADGES[testimonial.segment];

            return (
              <motion.div
                key={testimonial.id}
                variants={prefersReducedMotion ? undefined : cardVariants}
                whileHover={prefersReducedMotion ? undefined : { y: -4 }}
                className="relative bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-circleTel-grey200 hover:shadow-xl transition-shadow"
              >
                {/* Large Decorative Quote Mark */}
                <span className="absolute -top-2 left-4 text-6xl text-circleTel-orange/20 font-serif leading-none select-none">
                  &ldquo;
                </span>

                {/* Segment Badge - replaces star rating */}
                <div className="flex justify-end mb-4">
                  <span className={cn(
                    'px-2 py-0.5 rounded-md text-xs font-medium',
                    badge.bgColor,
                    badge.textColor
                  )}>
                    {badge.label}
                  </span>
                </div>

                {/* Quote */}
                <p className="font-body text-circleTel-navy text-sm md:text-base leading-relaxed mb-6 relative z-10">
                  {testimonial.quote}
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  {/* Avatar with gradient background */}
                  <div className="w-10 h-10 bg-gradient-to-br from-circleTel-orange/20 to-circleTel-orange/5 rounded-full flex items-center justify-center">
                    <span className="font-data text-sm font-bold text-circleTel-orange">
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
              </motion.div>
            );
          })}
        </motion.div>

        {/* Trust Metrics Bar - Data-Forward Design */}
        <motion.div
          className="mt-12 flex flex-wrap items-center justify-center gap-6 md:gap-10"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          {trustMetrics.map((metric, index) => (
            <div key={index} className="text-center">
              <span className="font-data text-xl md:text-2xl font-bold text-circleTel-orange">
                {metric.value}
              </span>
              <span className="block text-xs text-circleTel-grey600 mt-0.5">
                {metric.label}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
