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
            {/* Eyebrow Tag */}
            <div className="mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Digital Service Provider</span>
            </div>

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-gray-300 mb-6">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm font-medium">Building Together With Partners Who Get It</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-extrabold mb-6 leading-tight">
              Partner With a Company <span className="text-circleTel-orange">That Actually Listens</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl lg:text-2xl text-gray-300 mb-8 leading-relaxed">
              We're not another ISP fighting on price. We're building digital solutions for customers who aren't getting value elsewhere—and we need partners who understand underserved markets.
            </p>

            {/* Key Points */}
            <ul className="space-y-4 mb-10 text-left">
              <li className="flex items-start gap-3">
                <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-circleTel-orange flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <div className="text-lg font-semibold mb-1">Products built from partner feedback</div>
                  <div className="text-base text-gray-400">We develop what your customers actually need, not what's easiest to sell</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-circleTel-orange flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <div className="text-lg font-semibold mb-1">Blue ocean positioning by design</div>
                  <div className="text-base text-gray-400">Serve customers frustrated by traditional providers—better fit, easier sales, loyal clients</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-circleTel-orange flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <div className="text-lg font-semibold mb-1">Your success drives our roadmap</div>
                  <div className="text-base text-gray-400">Recurring commission up to 30% plus real influence on product direction</div>
                </div>
              </li>
            </ul>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/partner/onboarding">
                <Button
                  size="lg"
                  className="bg-circleTel-orange hover:bg-circleTel-orange/90 text-white px-8 py-6 text-lg font-semibold rounded-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 w-full sm:w-auto"
                >
                  Join the Partner Program
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a href="mailto:partners@circletel.co.za">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white hover:text-circleTel-darkNeutral px-8 py-6 text-lg font-semibold rounded-lg transition-all duration-300 w-full sm:w-auto"
                >
                  <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Talk to Our Team
                </Button>
              </a>
            </div>

            {/* Trust Badge */}
            <div className="mt-8 pt-8 border-t border-gray-700">
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-4 font-semibold">Partners building with us, not just for us</p>
              <div className="flex items-center gap-6 justify-center lg:justify-start">
                <div className="text-left">
                  <div className="text-3xl font-extrabold text-circleTel-orange">200+</div>
                  <div className="text-sm text-gray-400 font-medium">Active Partners</div>
                </div>
                <div className="w-px h-12 bg-gray-700" />
                <div className="text-left">
                  <div className="text-3xl font-extrabold text-circleTel-orange">98%</div>
                  <div className="text-sm text-gray-400 font-medium">Partner Satisfaction</div>
                </div>
                <div className="w-px h-12 bg-gray-700" />
                <div className="text-left">
                  <div className="text-3xl font-extrabold text-circleTel-orange">5-7 days</div>
                  <div className="text-sm text-gray-400 font-medium">To Start Selling</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Visual */}
          <div className="hidden lg:block">
            <div className="relative">
              {/* Market-Fit Focus Card */}
              <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
                <div className="p-12">
                  <div className="text-center">
                    <div className="w-32 h-32 mx-auto mb-8 rounded-full bg-gradient-to-br from-circleTel-orange/20 to-circleTel-orange/10 flex items-center justify-center relative">
                      {/* Glow effect */}
                      <div className="absolute inset-0 rounded-full bg-circleTel-orange/10 blur-2xl" />
                      {/* Icon */}
                      <div className="relative text-6xl">🎯</div>
                    </div>
                    <h3 className="text-3xl font-bold mb-4">Market-Fit Focus</h3>
                    <p className="text-gray-400 text-lg leading-relaxed">Partner dashboard shows real customer needs—we build products that solve them together</p>
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
