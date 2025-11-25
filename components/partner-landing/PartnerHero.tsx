'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Banknote, Users, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PartnerHero() {
  return (
    <section className="relative min-h-[600px] md:min-h-[700px] overflow-hidden bg-gradient-to-br from-circleTel-darkNeutral via-purple-900 to-circleTel-darkNeutral">
      {/* Decorative Background Elements - Matching home page */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Large gradient circles */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-circleTel-orange rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

        {/* Smaller decorative dots */}
        <div className="absolute top-20 left-1/4 w-2 h-2 bg-cyan-400 rounded-full"></div>
        <div className="absolute top-40 right-1/3 w-3 h-3 bg-purple-400 rounded-full"></div>
        <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-cyan-300 rounded-full"></div>
        <div className="absolute bottom-1/3 right-1/4 w-3 h-3 bg-purple-300 rounded-full"></div>

        {/* Dotted pattern circles */}
        <div className="absolute top-1/4 left-20 w-32 h-32 border-4 border-dotted border-purple-400 opacity-20 rounded-full"></div>
        <div className="absolute bottom-1/4 right-20 w-24 h-24 border-4 border-dotted border-cyan-400 opacity-20 rounded-full"></div>
      </div>

      <div className="container relative z-10 mx-auto px-4 py-16 md:py-24">
        {/* Hero Content */}
        <div className="text-center max-w-5xl mx-auto mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white/90 mb-6">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm font-medium">Partner Programme Now Open</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-white mb-4 sm:mb-6 leading-tight px-2">
            Earn cash from <span className="text-circleTel-orange">almost anywhere</span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-white/90 mb-6 sm:mb-8 px-2">
            Join the CircleTel EarnMore Partner Programme and earn up to 30% recurring commission.
          </p>
        </div>

        {/* CTA Card */}
        <div className="max-w-4xl mx-auto px-2">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl p-6 sm:p-8 md:p-10">
            <div className="text-center mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-circleTel-darkNeutral mb-2">
                Start earning today
              </h2>
              <p className="text-circleTel-secondaryNeutral">
                No experience needed. No upfront costs. Just your network and a smartphone.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/partner/onboarding" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="bg-circleTel-orange hover:bg-circleTel-orange/90 text-white font-bold text-lg px-10 py-6 rounded-xl transition-all shadow-lg hover:shadow-xl w-full"
                >
                  Sign up now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a href="#how-it-works" className="text-circleTel-orange hover:underline font-medium">
                See how it works →
              </a>
            </div>
          </div>
        </div>

        {/* Value Props */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto text-center">
          <div className="flex flex-col items-center text-white">
            <div className="w-16 h-16 bg-cyan-400 rounded-full flex items-center justify-center mb-3">
              <Banknote className="w-8 h-8 text-gray-900" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Up to 30% commission</h3>
            <p className="text-white/70 text-sm">Recurring monthly payments</p>
          </div>
          <div className="flex flex-col items-center text-white">
            <div className="w-16 h-16 bg-cyan-400 rounded-full flex items-center justify-center mb-3">
              <Users className="w-8 h-8 text-gray-900" />
            </div>
            <h3 className="text-lg font-semibold mb-1">200+ active partners</h3>
            <p className="text-white/70 text-sm">Join our growing network</p>
          </div>
          <div className="flex flex-col items-center text-white">
            <div className="w-16 h-16 bg-cyan-400 rounded-full flex items-center justify-center mb-3">
              <Smartphone className="w-8 h-8 text-gray-900" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Work from anywhere</h3>
            <p className="text-white/70 text-sm">All you need is your phone</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </section>
  );
}
