'use client';
import { PiArrowRightBold, PiCheckCircleBold, PiWhatsappLogoBold } from 'react-icons/pi';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function FinalCTA() {
  return (
    <section className="py-16 bg-circleTel-navy text-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Headline */}
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Ready to start{' '}
            <span className="text-circleTel-orange">earning?</span>
          </h2>

          {/* Subheadline */}
          <p className="text-white/90 mb-8 max-w-2xl mx-auto text-lg">
            Join 200+ partners already earning with CircleTel. Sign up takes 5 minutes.
          </p>

          {/* Benefits */}
          <div className="flex flex-wrap justify-center gap-6 mb-8">
            <div className="flex items-center gap-2 text-white/90">
              <PiCheckCircleBold className="h-5 w-5 text-circleTel-orange" />
              <span>No upfront costs</span>
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <PiCheckCircleBold className="h-5 w-5 text-circleTel-orange" />
              <span>No experience needed</span>
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <PiCheckCircleBold className="h-5 w-5 text-circleTel-orange" />
              <span>Paid monthly</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/partner/onboarding">
              <Button
                size="lg"
                className="bg-circleTel-orange hover:bg-circleTel-orange-dark text-white px-10 py-6 text-lg font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                Join 200+ partners
                <PiArrowRightBold className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <a
              href="https://wa.me/27824873900?text=Hi%2C%20I%27m%20interested%20in%20the%20CircleTel%20Partner%20Programme"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white text-white hover:bg-white hover:text-circleTel-navy font-semibold text-lg px-8 py-6 rounded-xl transition-all"
              >
                <PiWhatsappLogoBold className="mr-2 h-5 w-5" />
                Chat first
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
