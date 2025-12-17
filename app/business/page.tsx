import { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle, Shield, Zap, Users, Building2, Phone, Mail, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Business Solutions | CircleTel',
  description: 'Enterprise-grade connectivity solutions with 99.99% uptime SLA. Reliable internet for businesses that can\'t afford downtime.',
};

export default function BusinessPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-circleTel-darkNeutral via-circleTel-secondaryNeutral to-circleTel-darkNeutral text-white py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block bg-circleTel-orange text-white px-4 py-2 rounded-full text-sm font-semibold mb-6">
                ENTERPRISE SOLUTIONS
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Mission-Critical Connectivity for{' '}
                <span className="text-circleTel-orange">South African Businesses</span>
              </h1>
              <p className="text-xl mb-8 text-gray-300">
                Enterprise-grade fibre and wireless solutions with guaranteed 99.99% uptime SLA.
                Your business deserves connectivity that never lets you down.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/quotes/request"
                  className="bg-circleTel-orange hover:bg-orange-600 text-white px-8 py-4 rounded-lg font-semibold inline-flex items-center justify-center transition-colors"
                >
                  Request Quote
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  href="/connectivity/fibre"
                  className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-lg font-semibold inline-flex items-center justify-center border border-white/30 transition-colors"
                >
                  Check Coverage
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  href="/contact"
                  className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-lg font-semibold inline-flex items-center justify-center border border-white/30 transition-colors"
                >
                  <Phone className="mr-2 h-5 w-5" />
                  Talk to Specialist
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg border border-white/20">
                <div className="text-3xl font-bold text-circleTel-orange mb-2">99.99%</div>
                <div className="text-sm text-gray-300">Uptime SLA</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg border border-white/20">
                <div className="text-3xl font-bold text-circleTel-orange mb-2">24/7</div>
                <div className="text-sm text-gray-300">Priority Support</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg border border-white/20">
                <div className="text-3xl font-bold text-circleTel-orange mb-2">&lt;5ms</div>
                <div className="text-sm text-gray-300">Latency</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg border border-white/20">
                <div className="text-3xl font-bold text-circleTel-orange mb-2">1Gbps</div>
                <div className="text-sm text-gray-300">Up to</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Perfect For Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Perfect For Your Business</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Trusted by businesses across South Africa for mission-critical connectivity
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Building2,
                title: 'Large Offices',
                description: '50+ employees with high bandwidth needs'
              },
              {
                icon: Users,
                title: 'Remote Teams',
                description: 'Cloud applications and video conferencing'
              },
              {
                icon: Shield,
                title: 'Financial Services',
                description: 'Mission-critical uptime requirements'
              },
              {
                icon: Zap,
                title: 'Tech Companies',
                description: 'Development teams and data-heavy workloads'
              }
            ].map((item, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <item.icon className="h-12 w-12 text-circleTel-orange mb-4" />
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose CircleTel Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Businesses Choose CircleTel</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Enterprise-grade connectivity with the service and support your business needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-xl mb-3">99.99% Uptime SLA</h3>
              <p className="text-gray-600">
                Guaranteed service level agreement with compensation for downtime.
                Your business stays online, always.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Phone className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-xl mb-3">24/7 Priority Support</h3>
              <p className="text-gray-600">
                Dedicated account manager and priority support team available around
                the clock for mission-critical issues.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-circleTel-orange" />
              </div>
              <h3 className="font-semibold text-xl mb-3">Rapid Deployment</h3>
              <p className="text-gray-600">
                Fast installation and configuration. Site survey, setup, and full
                integration completed within agreed timelines.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Enterprise Connectivity Solutions</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Business Fibre */}
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-circleTel-orange text-white px-3 py-1 rounded text-sm font-semibold">
                  MOST POPULAR
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4">Business Fibre (FTTB)</h3>
              <p className="text-gray-600 mb-6">
                Dedicated fibre-to-the-business with symmetrical speeds up to 1Gbps.
                Perfect for offices with high bandwidth requirements.
              </p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Direct FTTB connection</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Speeds: 50Mbps - 1Gbps</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>99.99% uptime SLA</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Enterprise-grade router included</span>
                </div>
              </div>

              <div className="text-3xl font-bold mb-2">From R3,000<span className="text-lg font-normal text-gray-600">/month</span></div>
              <p className="text-sm text-gray-500 mb-6">50Mbps starting package (incl. VAT)</p>

              <Link
                href="/quotes/request"
                className="block w-full bg-circleTel-orange hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold text-center transition-colors"
              >
                Request Quote
              </Link>
            </div>

            {/* Business Wireless */}
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <h3 className="text-2xl font-bold mb-4">Business Wireless</h3>
              <p className="text-gray-600 mb-6">
                Fixed wireless connectivity for areas without fibre. Quick deployment
                with enterprise-grade performance and reliability.
              </p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>5G/LTE connectivity</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Uncapped data options</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>99.9% uptime SLA</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Fast installation (2-5 days)</span>
                </div>
              </div>

              <div className="text-3xl font-bold mb-2">From R1,500<span className="text-lg font-normal text-gray-600">/month</span></div>
              <p className="text-sm text-gray-500 mb-6">20Mbps starting package (incl. VAT)</p>

              <Link
                href="/connectivity/fixed-wireless"
                className="block w-full bg-circleTel-darkNeutral hover:bg-circleTel-secondaryNeutral text-white px-6 py-3 rounded-lg font-semibold text-center transition-colors"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-circleTel-orange text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Upgrade Your Business Connectivity?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Speak with our business connectivity specialists to find the perfect solution for your needs
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/quotes/request"
              className="bg-white text-circleTel-orange hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold inline-flex items-center justify-center transition-colors"
            >
              Request Quote
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/connectivity/fibre"
              className="bg-circleTel-darkNeutral hover:bg-circleTel-secondaryNeutral text-white px-8 py-4 rounded-lg font-semibold inline-flex items-center justify-center transition-colors"
            >
              Check Coverage
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <a
              href="tel:0870876305"
              className="bg-circleTel-darkNeutral hover:bg-circleTel-secondaryNeutral text-white px-8 py-4 rounded-lg font-semibold inline-flex items-center justify-center transition-colors"
            >
              <Phone className="mr-2 h-5 w-5" />
              087 087 6305
            </a>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-circleTel-orange mb-2">500+</div>
              <div className="text-gray-600">Businesses Connected</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-circleTel-orange mb-2">99.99%</div>
              <div className="text-gray-600">Average Uptime</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-circleTel-orange mb-2">2-5 Days</div>
              <div className="text-gray-600">Average Installation Time</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
