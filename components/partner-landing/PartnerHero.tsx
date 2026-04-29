'use client';
import { PiArrowRightBold, PiDeviceMobileBold, PiMoneyBold, PiUsersBold, PiWhatsappLogoBold } from 'react-icons/pi';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function PartnerHero() {
  return (
    <section className="relative min-h-[600px] md:min-h-[700px] overflow-hidden bg-gradient-to-br from-circleTel-navy to-circleTel-midnight-navy">
      {/* Subtle geometric accent - brand aligned */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full border border-circleTel-orange/20" />
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full border border-white/5" />
        <div className="absolute top-1/2 right-10 w-64 h-64 rounded-full border border-circleTel-orange/10" />
      </div>

      <div className="container relative z-10 mx-auto px-4 py-16 md:py-24">
        {/* Hero Content */}
        <div className="text-center max-w-5xl mx-auto mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-circleTel-orange/10 border border-circleTel-orange/30 text-white mb-6">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm font-medium">Partner Programme Now Open</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-white mb-4 sm:mb-6 leading-tight px-2">
            Build <span className="text-circleTel-orange">recurring income</span> — no business required
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-white/90 mb-6 sm:mb-8 px-2 max-w-3xl mx-auto">
            Earn up to 30% commission every month, for as long as your customers stay connected.
          </p>
        </div>

        {/* CTA Card */}
        <div className="max-w-4xl mx-auto px-2">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl p-6 sm:p-8 md:p-10">
            <div className="text-center mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-circleTel-navy mb-2">
                Start earning today
              </h2>
              <p className="text-circleTel-grey600">
                No experience needed. No upfront costs. Just your network and a smartphone.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/partner/onboarding" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="bg-circleTel-orange hover:bg-circleTel-orange-dark text-white font-bold text-lg px-10 py-6 rounded-xl transition-all shadow-lg hover:shadow-xl w-full"
                >
                  Sign up now
                  <PiArrowRightBold className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a
                href="https://wa.me/27824873900?text=Hi%2C%20I%27m%20interested%20in%20the%20CircleTel%20Partner%20Programme"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto"
              >
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-circleTel-navy text-circleTel-navy hover:bg-circleTel-navy hover:text-white font-semibold text-lg px-8 py-6 rounded-xl transition-all w-full"
                >
                  <PiWhatsappLogoBold className="mr-2 h-5 w-5" />
                  Chat on WhatsApp
                </Button>
              </a>
            </div>
          </div>
        </div>

        {/* Value Props */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto text-center">
          <div className="flex flex-col items-center text-white">
            <div className="w-16 h-16 bg-circleTel-orange rounded-full flex items-center justify-center mb-3">
              <PiMoneyBold className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Up to 30% commission</h3>
            <p className="text-white/80 text-sm">Recurring monthly payments</p>
          </div>
          <div className="flex flex-col items-center text-white">
            <div className="w-16 h-16 bg-circleTel-orange rounded-full flex items-center justify-center mb-3">
              <PiUsersBold className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-1">200+ active partners</h3>
            <p className="text-white/80 text-sm">Join our growing network</p>
          </div>
          <div className="flex flex-col items-center text-white">
            <div className="w-16 h-16 bg-circleTel-orange rounded-full flex items-center justify-center mb-3">
              <PiDeviceMobileBold className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Work from anywhere</h3>
            <p className="text-white/80 text-sm">All you need is your phone</p>
          </div>
        </div>
      </div>
    </section>
  );
}
