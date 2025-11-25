'use client';

import Link from 'next/link';
import { HelpCircle } from 'lucide-react';

export function ConfusedSection() {
  return (
    <section className="py-16 bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - Image placeholder */}
          <div className="flex justify-center lg:justify-start">
            <div className="relative">
              <div className="w-72 h-72 lg:w-80 lg:h-80 rounded-full bg-gradient-to-br from-circleTel-orange/10 to-pink-100 flex items-center justify-center">
                <div className="text-center">
                  <span className="text-8xl">🤷</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Content */}
          <div className="text-center lg:text-left">
            <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-4">
              Fibre? LTE? 5G? WiFi?{' '}
              <span className="text-circleTel-orange">Huh?</span>
            </h2>

            <p className="text-gray-600 mb-6 leading-relaxed">
              Don't worry if you don't know your Mbps from your elbow. We've got simple guides 
              that explain everything in plain English. Your customers will have questions—we'll 
              help you answer them like a pro.
            </p>

            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-3 justify-center lg:justify-start">
                <div className="w-6 h-6 rounded-full bg-circleTel-orange flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-700">Free training materials included</span>
              </div>
              <div className="flex items-center gap-3 justify-center lg:justify-start">
                <div className="w-6 h-6 rounded-full bg-circleTel-orange flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-700">WhatsApp support when you're stuck</span>
              </div>
              <div className="flex items-center gap-3 justify-center lg:justify-start">
                <div className="w-6 h-6 rounded-full bg-circleTel-orange flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-700">Partner community to learn from</span>
              </div>
            </div>

            <Link 
              href="/help/connectivity-guide"
              className="inline-flex items-center gap-2 text-circleTel-orange font-semibold hover:underline"
            >
              <HelpCircle className="h-5 w-5" />
              Read our beginner's guide
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
