'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function FinalCTA() {
  return (
    <section className="py-16 bg-gradient-to-br from-circleTel-darkNeutral via-purple-900 to-circleTel-darkNeutral text-white relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-circleTel-orange rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Headline */}
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Ready to start{' '}
            <span className="text-circleTel-orange">earning?</span>
          </h2>

          {/* Subheadline */}
          <p className="text-white/80 mb-8 max-w-2xl mx-auto text-lg">
            Join 200+ partners already earning with CircleTel. Sign up takes 5 minutes.
          </p>

          {/* Benefits */}
          <div className="flex flex-wrap justify-center gap-6 mb-8">
            <div className="flex items-center gap-2 text-white/90">
              <CheckCircle className="h-5 w-5 text-cyan-400" />
              <span>No upfront costs</span>
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <CheckCircle className="h-5 w-5 text-cyan-400" />
              <span>No experience needed</span>
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <CheckCircle className="h-5 w-5 text-cyan-400" />
              <span>Paid monthly</span>
            </div>
          </div>

          {/* CTA Button */}
          <Link href="/partner/onboarding">
            <Button
              size="lg"
              className="bg-circleTel-orange hover:bg-circleTel-orange/90 text-white px-10 py-6 text-lg font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              Sign up now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
