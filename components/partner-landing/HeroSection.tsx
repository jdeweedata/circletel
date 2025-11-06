'use client';

import Link from 'next/link';
import { ArrowRight, Handshake, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-circleTel-darkNeutral via-gray-800 to-circleTel-darkNeutral text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-circleTel-orange/20 border border-circleTel-orange/30 text-circleTel-orange mb-6">
              <Handshake className="h-4 w-4" />
              <span className="text-sm font-semibold">Join Our Partner Network</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-extrabold mb-6 leading-tight">
              Become a CircleTel <span className="text-circleTel-orange">Partner</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl lg:text-2xl text-gray-300 mb-8 leading-relaxed">
              Earn recurring commission selling South Africa's best connectivity
            </p>

            {/* Key Points */}
            <ul className="space-y-3 mb-10 text-left">
              <li className="flex items-start gap-3">
                <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-circleTel-orange flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-lg">Earn <strong>25-30% recurring commission</strong> on every sale</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-circleTel-orange flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-lg">Real-time <strong>partner portal</strong> to track leads and earnings</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-circleTel-orange flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-lg">Comprehensive <strong>training & marketing support</strong></span>
              </li>
            </ul>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/partner/onboarding">
                <Button
                  size="lg"
                  className="bg-circleTel-orange hover:bg-circleTel-orange/90 text-white px-8 py-6 text-lg font-semibold rounded-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 w-full sm:w-auto"
                >
                  Apply Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white text-white hover:bg-white hover:text-circleTel-darkNeutral px-8 py-6 text-lg font-semibold rounded-lg transition-all duration-300 w-full sm:w-auto"
                onClick={() => {
                  const element = document.getElementById('commission-calculator');
                  element?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <FileText className="mr-2 h-5 w-5" />
                Calculate Earnings
              </Button>
            </div>

            {/* Trust Badge */}
            <div className="mt-8 pt-8 border-t border-gray-700">
              <p className="text-sm text-gray-400 mb-3">Trusted by 200+ partners across South Africa</p>
              <div className="flex items-center gap-4 justify-center lg:justify-start">
                <div className="text-center">
                  <div className="text-2xl font-bold text-circleTel-orange">R2.5M+</div>
                  <div className="text-xs text-gray-400">Paid in 2024</div>
                </div>
                <div className="w-px h-10 bg-gray-700" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-circleTel-orange">98%</div>
                  <div className="text-xs text-gray-400">Satisfaction</div>
                </div>
                <div className="w-px h-10 bg-gray-700" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-circleTel-orange">5-7 days</div>
                  <div className="text-xs text-gray-400">Approval Time</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Visual */}
          <div className="hidden lg:block">
            <div className="relative">
              {/* Placeholder for partner image */}
              <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl">
                <div className="aspect-[4/3] bg-gradient-to-br from-circleTel-orange/20 to-circleTel-orange/5 flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-circleTel-orange/20 flex items-center justify-center">
                      <Handshake className="h-16 w-16 text-circleTel-orange" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Partner Portal Preview</h3>
                    <p className="text-gray-300">Track leads, commissions & performance in real-time</p>
                  </div>
                </div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-circleTel-orange/20 rounded-full blur-2xl" />
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-circleTel-orange/10 rounded-full blur-3xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
          <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V120Z" fill="white"/>
        </svg>
      </div>
    </section>
  );
}
