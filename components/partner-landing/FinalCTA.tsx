'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, Zap, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function FinalCTA() {
  return (
    <section className="relative py-24 bg-gradient-to-br from-circleTel-darkNeutral via-gray-800 to-circleTel-darkNeutral text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-circleTel-orange/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-circleTel-orange/5 rounded-full blur-3xl" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Content */}
        <div className="text-center mb-12">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-gray-300 mb-6">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm font-medium">Building Solutions Together</span>
          </div>

          {/* Headline */}
          <h2 className="text-4xl lg:text-5xl font-extrabold mb-6 leading-tight">
            Ready to <span className="text-circleTel-orange">Partner Differently?</span>
          </h2>

          {/* Subheadline */}
          <p className="text-xl lg:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed">
            If you know customers who are not getting value from traditional ISPs, we want to hear from you. Let us build solutions together.
          </p>

          {/* Quick Benefits */}
          <div className="grid sm:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
            <div className="flex items-start gap-3 text-left">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <div className="text-lg">🎯</div>
              </div>
              <div>
                <div className="font-bold mb-1">Your Voice Matters</div>
                <div className="text-sm text-gray-400">Product roadmap shaped by partner feedback</div>
              </div>
            </div>
            <div className="flex items-start gap-3 text-left">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                <div className="text-lg">🌊</div>
              </div>
              <div>
                <div className="font-bold mb-1">Blue Ocean Focus</div>
                <div className="text-sm text-gray-400">Serve underserved markets together</div>
              </div>
            </div>
            <div className="flex items-start gap-3 text-left">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <div className="text-lg">🤝</div>
              </div>
              <div>
                <div className="font-bold mb-1">True Partnership</div>
                <div className="text-sm text-gray-400">Collaborate, not just sell</div>
              </div>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/partner/onboarding">
              <Button
                size="lg"
                className="bg-circleTel-orange hover:bg-circleTel-orange/90 text-white px-10 py-7 text-xl font-bold rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 w-full sm:w-auto"
              >
                Start Partnership Conversation
                <ArrowRight className="ml-3 h-6 w-6" />
              </Button>
            </Link>
            <a href="mailto:partners@circletel.co.za">
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white text-white hover:bg-white hover:text-circleTel-darkNeutral px-10 py-7 text-xl font-bold rounded-xl transition-all duration-300 w-full sm:w-auto"
              >
                <svg className="mr-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Talk to Our Team
              </Button>
            </a>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 pt-12 border-t border-gray-700">
          <div className="grid sm:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-extrabold text-circleTel-orange mb-2">200+</div>
              <div className="text-sm text-gray-400">Partners Building With Us</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-circleTel-orange mb-2">98%</div>
              <div className="text-sm text-gray-400">Partner Satisfaction</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-circleTel-orange mb-2">Quarterly</div>
              <div className="text-sm text-gray-400">Roadmap Collaboration</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-circleTel-orange mb-2">5-7 days</div>
              <div className="text-sm text-gray-400">To Start Partnering</div>
            </div>
          </div>
        </div>

        {/* Bottom Note */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            No long-term contracts. No franchise fees. Just collaboration to build solutions customers actually need.
          </p>
        </div>
      </div>
    </section>
  );
}
