import React from 'react'
import Link from 'next/link'
import { Cloud, Server, Shield, Zap } from 'lucide-react'

interface CloudHeroProps {
  data?: {
    title: string
    subtitle: string
    backgroundImage?: {
      url: string
    }
  }
}

export default function CloudHeroSection({ data }: CloudHeroProps) {
  return (
    <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden min-h-screen flex items-center">
      {/* Enhanced Background Pattern */}
      <div className="absolute inset-0 opacity-8">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-gradient-to-r from-orange-500 to-red-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      {/* Enhanced Geometric Shapes */}
      <div className="absolute top-20 left-20 transform rotate-12 animate-pulse">
        <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-red-500 opacity-20 rounded-lg"></div>
      </div>
      <div className="absolute bottom-20 right-20 transform -rotate-12 animate-pulse animation-delay-2000">
        <div className="w-36 h-36 bg-gradient-to-br from-blue-500 to-purple-500 opacity-20 rounded-full"></div>
      </div>
      <div className="absolute top-1/2 left-1/4 transform rotate-45 animate-spin-slow">
        <div className="w-20 h-20 border-4 border-gradient-to-r from-orange-400 to-yellow-400 opacity-30 rounded-lg"></div>
      </div>
      <div className="absolute top-1/3 right-1/4 transform -rotate-12">
        <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-400 opacity-20 rounded-full"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8 z-10">
        <div className="text-center">
          {/* Enhanced Logo/Brand */}
          <div className="mb-8">
            <div className="inline-flex items-center space-x-3 text-circleTel-orange text-lg font-semibold">
              <Cloud className="w-8 h-8" />
              <span>CircleTel Cloud Solutions</span>
            </div>
          </div>

          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
            {data?.title || 'Cloud Hosting.'}
          </h1>
          <p className="text-xl md:text-2xl lg:text-3xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
            {data?.subtitle || 'Virtual hosting with more scalability, more redundancy and minimal downtime.'}
          </p>
          
          <div className="mt-12 flex flex-col sm:flex-row justify-center gap-6">
            <Link 
              href="/contact" 
              className="group px-10 py-5 bg-gradient-to-r from-circleTel-orange to-orange-600 hover:from-orange-600 hover:to-red-600 text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-2xl inline-block text-center text-lg relative overflow-hidden"
            >
              <span className="relative z-10">Get Started Today</span>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
            </Link>
            <button 
              onClick={() => {
                const pricingSection = document.querySelector('[data-section="pricing"]');
                if (pricingSection) {
                  pricingSection.scrollIntoView({ behavior: 'smooth' });
                } else {
                  const pricingTable = document.querySelector('section:has(table)');
                  pricingTable?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="group px-10 py-5 bg-transparent border-3 border-white text-white font-bold rounded-xl hover:bg-white hover:text-slate-900 transition-all text-lg relative overflow-hidden"
            >
              <span className="relative z-10">View Pricing</span>
            </button>
          </div>
        </div>

        {/* Enhanced Floating Icons */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center animate-float group">
            <div className="inline-flex p-6 rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 group-hover:bg-white/20 transition-all shadow-xl">
              <Cloud className="w-10 h-10 text-orange-400 group-hover:scale-110 transition-transform" />
            </div>
            <p className="mt-4 text-base text-gray-300 font-medium">Cloud Native</p>
          </div>
          <div className="text-center animate-float animation-delay-2000 group">
            <div className="inline-flex p-6 rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 group-hover:bg-white/20 transition-all shadow-xl">
              <Server className="w-10 h-10 text-blue-400 group-hover:scale-110 transition-transform" />
            </div>
            <p className="mt-4 text-base text-gray-300 font-medium">Scalable</p>
          </div>
          <div className="text-center animate-float animation-delay-4000 group">
            <div className="inline-flex p-6 rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 group-hover:bg-white/20 transition-all shadow-xl">
              <Shield className="w-10 h-10 text-green-400 group-hover:scale-110 transition-transform" />
            </div>
            <p className="mt-4 text-base text-gray-300 font-medium">Secure</p>
          </div>
          <div className="text-center animate-float animation-delay-6000 group">
            <div className="inline-flex p-6 rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 group-hover:bg-white/20 transition-all shadow-xl">
              <Zap className="w-10 h-10 text-yellow-400 group-hover:scale-110 transition-transform" />
            </div>
            <p className="mt-4 text-base text-gray-300 font-medium">Fast</p>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 text-center">
          <p className="text-gray-400 mb-6">Trusted by 50,000+ South African businesses</p>
          <div className="flex justify-center items-center space-x-8 opacity-60">
            <div className="text-sm font-medium">25+ Years Experience</div>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <div className="text-sm font-medium">99.9% Uptime</div>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <div className="text-sm font-medium">24/7 Local Support</div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/60 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  )
}