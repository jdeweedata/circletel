'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 }
  }
} as const;

const stepVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
} as const;

interface Step {
  number: string;
  title: string;
  description: string;
}

// Number-forward design - replaces generic MapPin, Package, Wifi icons
const STEPS: Step[] = [
  {
    number: '01',
    title: 'Check your address',
    description: 'Enter your address to see which plans are available in your area.',
  },
  {
    number: '02',
    title: 'Choose your plan',
    description: 'Pick the plan that fits your household or office. No contracts.',
  },
  {
    number: '03',
    title: 'We install, you connect',
    description: 'Free professional installation within 7 days. Plug in and go.',
  },
];

export function HowItWorks() {
  const prefersReducedMotion = useReducedMotion();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="bg-circleTel-grey200 py-12 md:py-20">
      <div className="container mx-auto px-4">
        {/* Heading */}
        <motion.h2
          className="font-heading text-display-2-mobile md:text-display-2 text-circleTel-navy text-center mb-12 md:mb-16"
          initial={prefersReducedMotion ? false : { opacity: 0, y: -10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          Get connected in 3 simple steps
        </motion.h2>

        {/* Steps */}
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 relative"
            variants={prefersReducedMotion ? undefined : containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
          >
            {/* Animated connecting line - desktop only */}
            <div className="hidden md:block absolute top-24 left-[25%] right-[25%] h-0.5">
              <div className="w-full h-full bg-gradient-to-r from-circleTel-orange/20 via-circleTel-orange/40 to-circleTel-orange/20" />
            </div>

            {STEPS.map((step, index) => (
              <motion.div
                key={step.number}
                variants={prefersReducedMotion ? undefined : stepVariants}
                className="relative flex flex-col items-center text-center"
              >
                {/* Small indicator dot on the line - positioned absolutely to match line */}
                <div className="hidden md:flex absolute top-24 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-circleTel-orange rounded-full items-center justify-center z-10 shadow-md">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>

                {/* Large Decorative Number */}
                <div className="relative mb-8">
                  <span className="font-data text-6xl md:text-7xl font-bold text-circleTel-orange/30 select-none">
                    {step.number}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-heading text-display-4-mobile md:text-display-4 text-circleTel-navy mb-3 relative z-10">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="font-body text-sm md:text-base text-circleTel-grey600 max-w-xs leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* CTA Button */}
        <div className="text-center mt-12">
          <Button
            onClick={scrollToTop}
            className="bg-circleTel-orange hover:bg-circleTel-orange-dark text-white font-semibold px-8 py-6 text-base rounded-xl shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]"
          >
            Check Availability
          </Button>
        </div>
      </div>
    </section>
  );
}
