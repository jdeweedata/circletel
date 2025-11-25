'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Colorful blob background - WebAfrica style */}
      <div className="absolute inset-0 z-0">
        {/* Orange blob top-left */}
        <div className="absolute -top-20 -left-20 w-[500px] h-[500px] rounded-full bg-circleTel-orange/30 blur-3xl" />
        {/* Blue blob top-right */}
        <div className="absolute -top-10 right-0 w-[400px] h-[400px] rounded-full bg-blue-400/20 blur-3xl" />
        {/* Pink blob bottom */}
        <div className="absolute bottom-0 left-1/3 w-[600px] h-[300px] rounded-full bg-pink-300/20 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="text-center lg:text-left">
            {/* Headline */}
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-black text-gray-900 mb-6 leading-tight">
              Earn cash from{' '}
              <span className="text-circleTel-orange">almost anywhere!</span>
            </h1>

            {/* CTA Button */}
            <Link href="/partner/onboarding">
              <Button
                size="lg"
                className="bg-circleTel-orange hover:bg-circleTel-orange/90 text-white px-8 py-6 text-lg font-bold rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                Sign up now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>

            {/* Subtext */}
            <p className="mt-6 text-gray-600">
              <a href="#how-it-works" className="text-circleTel-orange hover:underline font-medium">
                How it works →
              </a>
            </p>
          </div>

          {/* Right Column - Image */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative">
              {/* Person image placeholder - you can replace with actual image */}
              <div className="relative w-80 h-96 lg:w-96 lg:h-[450px]">
                <div className="absolute inset-0 bg-gradient-to-br from-circleTel-orange/20 to-pink-200/30 rounded-3xl" />
                <div className="absolute inset-4 bg-gray-200 rounded-2xl flex items-end justify-center overflow-hidden">
                  {/* Placeholder for partner image */}
                  <div className="text-center pb-8">
                    <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-circleTel-orange/20 flex items-center justify-center">
                      <span className="text-6xl">🤝</span>
                    </div>
                    <p className="text-gray-500 text-sm">Join our partner network</p>
                  </div>
                </div>
              </div>
              
              {/* Floating commission badge */}
              <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl p-4 shadow-xl border border-gray-100">
                <div className="text-center">
                  <div className="text-2xl font-black text-circleTel-orange">R18,500</div>
                  <div className="text-xs text-gray-500">avg. monthly earnings</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wave divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
          <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V120Z" fill="white"/>
        </svg>
      </div>
    </section>
  );
}
