import { Metadata } from 'next';
import { CircleCheck, CheckCircle, ShieldCheck, Zap, LineChart, Laptop, MessageSquarePlus, Wifi, Radio, Cable } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import CoverageCheck from '@/components/coverage/CoverageCheck';

export const metadata: Metadata = {
  title: 'Business Connectivity Coverage | CircleTel',
  description: 'Check availability for all business connectivity solutions: Fibre (FTTB), 5G, LTE, and Fixed Wireless. Enterprise-grade connectivity with 99.99% uptime SLA.',
};

export default function BusinessConnectivity() {
  return (
    <main>
      {/* Coverage Check Hero Section */}
      <CoverageCheck />

      {/* Hero Section - Service Agnostic */}
      <section className="bg-gradient-to-b from-circleTel-lightNeutral to-white py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="text-left">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-circleTel-darkNeutral mb-4">
                Enterprise Connectivity Solutions for Your Business
              </h1>
              <p className="text-lg md:text-xl text-circleTel-secondaryNeutral mb-6">
                Choose from Fibre, 5G, LTE, or Fixed Wireless connectivity tailored to your business needs.
                All solutions include enterprise-grade reliability and 24/7 support.
              </p>
              <div className="bg-circleTel-lightNeutral rounded-lg p-4 mb-6">
                <p className="font-space-mono text-sm text-circleTel-secondaryNeutral mb-1">Starting from</p>
                <p className="text-3xl font-bold text-circleTel-darkNeutral">R1,500/month</p>
                <p className="font-space-mono text-xs text-circleTel-secondaryNeutral">(Wireless - 20Mbps)</p>
              </div>
              <Button asChild className="primary-button flex items-center gap-2">
                <Link href="/contact">
                  <MessageSquarePlus size={18} />
                  Explore Connectivity Options
                </Link>
              </Button>
            </div>

            <div className="relative bg-white rounded-lg p-6 shadow-lg border border-circleTel-orange">
              <div className="flex items-center mb-4">
                <div className="bg-circleTel-orange rounded-full p-3 mr-3 text-white">
                  <CircleCheck size={24} />
                </div>
                <h3 className="text-xl font-bold text-circleTel-darkNeutral">Perfect For</h3>
              </div>

              <ul className="space-y-3">
                <li className="flex items-start">
                  <CheckCircle className="text-circleTel-orange mr-2 mt-1" size={18} />
                  <span className="text-circleTel-secondaryNeutral">Large offices with high bandwidth needs</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="text-circleTel-orange mr-2 mt-1" size={18} />
                  <span className="text-circleTel-secondaryNeutral">Companies using cloud applications and VoIP</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="text-circleTel-orange mr-2 mt-1" size={18} />
                  <span className="text-circleTel-secondaryNeutral">Businesses requiring guaranteed uptime</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="text-circleTel-orange mr-2 mt-1" size={18} />
                  <span className="text-circleTel-secondaryNeutral">Remote teams and distributed workforces</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Connectivity Options Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-circleTel-darkNeutral mb-4">
              Choose Your Business Connectivity Solution
            </h2>
            <p className="text-lg text-circleTel-secondaryNeutral">
              We offer multiple connectivity technologies to ensure your business stays connected, no matter your location or requirements.
            </p>
          </div>

          {/* Service Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* Fibre Card */}
            <div className="bg-white border-2 border-circleTel-orange rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-circleTel-orange rounded-full p-3 text-white">
                  <Cable size={32} />
                </div>
              </div>
              <h3 className="text-xl font-bold text-circleTel-darkNeutral text-center mb-2">Fibre (FTTB)</h3>
              <p className="text-sm text-circleTel-secondaryNeutral text-center mb-4">
                Direct fibre connection with symmetrical speeds up to 1Gbps
              </p>
              <div className="text-center">
                <p className="text-2xl font-bold text-circleTel-darkNeutral mb-1">From R3,000</p>
                <p className="text-xs text-circleTel-secondaryNeutral">/month</p>
              </div>
              <ul className="mt-4 space-y-2 text-sm">
                <li className="flex items-start">
                  <CheckCircle className="text-green-600 mr-2 mt-0.5 flex-shrink-0" size={14} />
                  <span>99.99% uptime SLA</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="text-green-600 mr-2 mt-0.5 flex-shrink-0" size={14} />
                  <span>50Mbps - 1Gbps speeds</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="text-green-600 mr-2 mt-0.5 flex-shrink-0" size={14} />
                  <span>&lt;5ms latency</span>
                </li>
              </ul>
            </div>

            {/* 5G Card */}
            <div className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-blue-600 rounded-full p-3 text-white">
                  <Wifi size={32} />
                </div>
              </div>
              <h3 className="text-xl font-bold text-circleTel-darkNeutral text-center mb-2">5G Wireless</h3>
              <p className="text-sm text-circleTel-secondaryNeutral text-center mb-4">
                Next-generation wireless with ultra-fast speeds
              </p>
              <div className="text-center">
                <p className="text-2xl font-bold text-circleTel-darkNeutral mb-1">From R2,500</p>
                <p className="text-xs text-circleTel-secondaryNeutral">/month</p>
              </div>
              <ul className="mt-4 space-y-2 text-sm">
                <li className="flex items-start">
                  <CheckCircle className="text-green-600 mr-2 mt-0.5 flex-shrink-0" size={14} />
                  <span>99.9% uptime SLA</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="text-green-600 mr-2 mt-0.5 flex-shrink-0" size={14} />
                  <span>Up to 500Mbps speeds</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="text-green-600 mr-2 mt-0.5 flex-shrink-0" size={14} />
                  <span>Fast installation (2-3 days)</span>
                </li>
              </ul>
            </div>

            {/* LTE Card */}
            <div className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-purple-600 rounded-full p-3 text-white">
                  <Radio size={32} />
                </div>
              </div>
              <h3 className="text-xl font-bold text-circleTel-darkNeutral text-center mb-2">LTE</h3>
              <p className="text-sm text-circleTel-secondaryNeutral text-center mb-4">
                Reliable 4G connectivity with uncapped options
              </p>
              <div className="text-center">
                <p className="text-2xl font-bold text-circleTel-darkNeutral mb-1">From R1,800</p>
                <p className="text-xs text-circleTel-secondaryNeutral">/month</p>
              </div>
              <ul className="mt-4 space-y-2 text-sm">
                <li className="flex items-start">
                  <CheckCircle className="text-green-600 mr-2 mt-0.5 flex-shrink-0" size={14} />
                  <span>99.5% uptime SLA</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="text-green-600 mr-2 mt-0.5 flex-shrink-0" size={14} />
                  <span>20-50Mbps speeds</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="text-green-600 mr-2 mt-0.5 flex-shrink-0" size={14} />
                  <span>Wide coverage area</span>
                </li>
              </ul>
            </div>

            {/* Fixed Wireless Card */}
            <div className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-green-600 rounded-full p-3 text-white">
                  <Wifi size={32} />
                </div>
              </div>
              <h3 className="text-xl font-bold text-circleTel-darkNeutral text-center mb-2">Fixed Wireless</h3>
              <p className="text-sm text-circleTel-secondaryNeutral text-center mb-4">
                Point-to-point wireless for areas without fibre
              </p>
              <div className="text-center">
                <p className="text-2xl font-bold text-circleTel-darkNeutral mb-1">From R1,500</p>
                <p className="text-xs text-circleTel-secondaryNeutral">/month</p>
              </div>
              <ul className="mt-4 space-y-2 text-sm">
                <li className="flex items-start">
                  <CheckCircle className="text-green-600 mr-2 mt-0.5 flex-shrink-0" size={14} />
                  <span>99.5% uptime SLA</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="text-green-600 mr-2 mt-0.5 flex-shrink-0" size={14} />
                  <span>20-100Mbps speeds</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="text-green-600 mr-2 mt-0.5 flex-shrink-0" size={14} />
                  <span>Quick deployment (3-5 days)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Key Benefits Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-circleTel-darkNeutral text-center mb-12">
            Why Choose CircleTel for Business Connectivity
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-circleTel-lightNeutral rounded-full p-4 w-16 h-16 flex items-center justify-center text-circleTel-orange mx-auto mb-4">
                <Zap size={28} />
              </div>
              <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-2">Enterprise Performance</h3>
              <p className="text-circleTel-secondaryNeutral">High-speed, low-latency connections designed for business-critical applications and cloud services.</p>
            </div>

            <div className="text-center">
              <div className="bg-circleTel-lightNeutral rounded-full p-4 w-16 h-16 flex items-center justify-center text-circleTel-orange mx-auto mb-4">
                <CircleCheck size={28} />
              </div>
              <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-2">Guaranteed Uptime</h3>
              <p className="text-circleTel-secondaryNeutral">Industry-leading SLAs with compensation for downtime. Your business stays online, always.</p>
            </div>

            <div className="text-center">
              <div className="bg-circleTel-lightNeutral rounded-full p-4 w-16 h-16 flex items-center justify-center text-circleTel-orange mx-auto mb-4">
                <ShieldCheck size={28} />
              </div>
              <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-2">24/7 Support</h3>
              <p className="text-circleTel-secondaryNeutral">Dedicated account managers and priority support team available around the clock.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Business Benefits Section */}
      <section className="py-16 bg-circleTel-lightNeutral">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-circleTel-darkNeutral text-center mb-12">
            Business Advantages
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-bold text-circleTel-darkNeutral flex items-center mb-4">
                <CheckCircle className="text-circleTel-orange mr-2" size={20} />
                Enhanced Productivity
              </h3>
              <p className="text-circleTel-secondaryNeutral ml-8">
                Eliminate frustrating slowdowns with consistent high-speed connectivity for all users simultaneously.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-bold text-circleTel-darkNeutral flex items-center mb-4">
                <CheckCircle className="text-circleTel-orange mr-2" size={20} />
                Cloud Application Performance
              </h3>
              <p className="text-circleTel-secondaryNeutral ml-8">
                Experience seamless performance with critical cloud applications like Office 365, CRMs, and video conferencing.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-bold text-circleTel-darkNeutral flex items-center mb-4">
                <CheckCircle className="text-circleTel-orange mr-2" size={20} />
                Crystal-Clear Communications
              </h3>
              <p className="text-circleTel-secondaryNeutral ml-8">
                Support flawless VoIP telephony and video conferencing with low-latency, jitter-free connections.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-bold text-circleTel-darkNeutral flex items-center mb-4">
                <CheckCircle className="text-circleTel-orange mr-2" size={20} />
                Flexible Solutions
              </h3>
              <p className="text-circleTel-secondaryNeutral ml-8">
                Choose the right technology for your location and budget. We'll help you find the perfect fit.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-circleTel-darkNeutral text-center mb-12">
            Our Implementation Process
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-white rounded-full p-4 w-16 h-16 flex items-center justify-center text-circleTel-orange mx-auto mb-4 shadow-lg relative">
                <span className="absolute -top-2 -right-2 bg-circleTel-orange text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">1</span>
                <Laptop size={28} />
              </div>
              <h3 className="text-lg font-bold text-circleTel-darkNeutral mb-2">Coverage Check</h3>
              <p className="text-circleTel-secondaryNeutral text-sm">Check what services are available at your address and compare options.</p>
            </div>

            <div className="text-center">
              <div className="bg-white rounded-full p-4 w-16 h-16 flex items-center justify-center text-circleTel-orange mx-auto mb-4 shadow-lg relative">
                <span className="absolute -top-2 -right-2 bg-circleTel-orange text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">2</span>
                <CircleCheck size={28} />
              </div>
              <h3 className="text-lg font-bold text-circleTel-darkNeutral mb-2">Site Survey</h3>
              <p className="text-circleTel-secondaryNeutral text-sm">We evaluate your location and specific business needs to recommend the best solution.</p>
            </div>

            <div className="text-center">
              <div className="bg-white rounded-full p-4 w-16 h-16 flex items-center justify-center text-circleTel-orange mx-auto mb-4 shadow-lg relative">
                <span className="absolute -top-2 -right-2 bg-circleTel-orange text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">3</span>
                <LineChart size={28} />
              </div>
              <h3 className="text-lg font-bold text-circleTel-darkNeutral mb-2">Installation & Setup</h3>
              <p className="text-circleTel-secondaryNeutral text-sm">Fast professional installation with minimal disruption to your business operations.</p>
            </div>

            <div className="text-center">
              <div className="bg-white rounded-full p-4 w-16 h-16 flex items-center justify-center text-circleTel-orange mx-auto mb-4 shadow-lg relative">
                <span className="absolute -top-2 -right-2 bg-circleTel-orange text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">4</span>
                <CheckCircle size={28} />
              </div>
              <h3 className="text-lg font-bold text-circleTel-darkNeutral mb-2">Ongoing Support</h3>
              <p className="text-circleTel-secondaryNeutral text-sm">24/7 monitoring, management, and proactive support for your connection.</p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Button asChild className="primary-button flex items-center gap-2">
              <Link href="/contact">
                <MessageSquarePlus size={18} />
                Get Started Today
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
