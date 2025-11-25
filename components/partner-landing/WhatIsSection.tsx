'use client';

import { Handshake, TrendingUp, Users } from 'lucide-react';

export function WhatIsSection() {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        {/* Main Content Card */}
        <div className="bg-white rounded-lg p-8 shadow-lg max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Title */}
            <div>
              <div className="inline-flex items-center gap-2 mb-4">
                <div className="p-3 bg-circleTel-orange bg-opacity-10 rounded-full">
                  <Handshake className="h-6 w-6 text-circleTel-orange" />
                </div>
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-circleTel-darkNeutral mb-4">
                What is the CircleTel{' '}
                <span className="text-circleTel-orange">EarnMore Partner</span>{' '}
                Programme?
              </h2>
              <p className="text-circleTel-secondaryNeutral leading-relaxed">
                Your chance to earn serious commission by connecting people with fast, reliable internet. 
                Whether you're a side-hustler, entrepreneur, or just someone who knows everyone in the 
                neighbourhood—this is for you.
              </p>
            </div>

            {/* Right Column - Key Points */}
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="mr-4 p-3 bg-circleTel-orange bg-opacity-10 rounded-full flex-shrink-0">
                  <TrendingUp className="text-circleTel-orange" size={24} />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-circleTel-darkNeutral mb-2">Recurring Income</h4>
                  <p className="text-circleTel-secondaryNeutral">
                    Share your unique link. When someone signs up, you earn commission every month for as long as they stay connected.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="mr-4 p-3 bg-circleTel-orange bg-opacity-10 rounded-full flex-shrink-0">
                  <Users className="text-circleTel-orange" size={24} />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-circleTel-darkNeutral mb-2">No Barriers to Entry</h4>
                  <p className="text-circleTel-secondaryNeutral">
                    No experience needed. No upfront costs. Just your network and a smartphone. Sign up in 5 minutes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
