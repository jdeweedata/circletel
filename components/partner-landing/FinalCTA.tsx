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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-circleTel-orange/20 border border-circleTel-orange/30 text-circleTel-orange mb-6">
            <Zap className="h-4 w-4" />
            <span className="text-sm font-semibold">Limited Spots Available</span>
          </div>

          {/* Headline */}
          <h2 className="text-4xl lg:text-5xl font-extrabold mb-6 leading-tight">
            Ready to Build Your <span className="text-circleTel-orange">Recurring Revenue</span> Business?
          </h2>

          {/* Subheadline */}
          <p className="text-xl lg:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed">
            Join 200+ partners earning monthly commissions selling South Africa's best connectivity
          </p>

          {/* Quick Benefits */}
          <div className="grid sm:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
            <div className="flex items-start gap-3 text-left">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <div className="font-bold mb-1">No Upfront Costs</div>
                <div className="text-sm text-gray-400">Free to join, no franchise fees</div>
              </div>
            </div>
            <div className="flex items-start gap-3 text-left">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <div className="font-bold mb-1">Quick Setup</div>
                <div className="text-sm text-gray-400">5-7 days to approval</div>
              </div>
            </div>
            <div className="flex items-start gap-3 text-left">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Zap className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <div className="font-bold mb-1">Full Support</div>
                <div className="text-sm text-gray-400">Training & account manager</div>
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
                Apply Now - It's Free
                <ArrowRight className="ml-3 h-6 w-6" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white text-white hover:bg-white hover:text-circleTel-darkNeutral px-10 py-7 text-xl font-bold rounded-xl transition-all duration-300 w-full sm:w-auto"
              onClick={() => {
                const element = document.getElementById('commission-calculator');
                element?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Calculate Earnings
            </Button>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 pt-12 border-t border-gray-700">
          <div className="grid sm:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-extrabold text-circleTel-orange mb-2">200+</div>
              <div className="text-sm text-gray-400">Active Partners</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-circleTel-orange mb-2">R2.5M+</div>
              <div className="text-sm text-gray-400">Paid in 2024</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-circleTel-orange mb-2">98%</div>
              <div className="text-sm text-gray-400">Satisfaction Rate</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-circleTel-orange mb-2">5-7 days</div>
              <div className="text-sm text-gray-400">Approval Time</div>
            </div>
          </div>
        </div>

        {/* Bottom Note */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            By applying, you agree to CircleTel's Partner Terms and Conditions. No long-term contract required.
          </p>
        </div>
      </div>
    </section>
  );
}
