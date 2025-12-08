'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Check,
  X,
  Zap,
  Shield,
  Headphones,
  ArrowRight,
  Star,
  TrendingUp,
  Clock,
  Users,
  Building2,
  Sparkles,
  ChevronDown,
  Phone
} from 'lucide-react';

// Bundle data with conversion-focused structure
const bundles = [
  {
    id: "essential",
    name: "Essential",
    tagline: "Start Strong",
    description: "Perfect for small teams ready to professionalize their IT",
    monthlyPrice: 4500,
    annualPrice: 3825, // 15% discount
    badge: null,
    highlight: false,
    idealFor: "5-10 employees",
    features: {
      support: "8/5 Business Hours",
      users: "5 Users",
      internet: "20Mbps Wireless",
      backup: "LTE Failover",
      wifi: "2 Access Points",
      security: "Basic Protection",
      onsite: "Remote Only",
      voip: false,
      sla: "24hr Response",
      manager: false
    },
    cta: "Get Started",
    ctaLink: "/contact?bundle=essential"
  },
  {
    id: "professional",
    name: "Professional",
    tagline: "Most Popular",
    description: "Complete solution for growing businesses",
    monthlyPrice: 8500,
    annualPrice: 6800, // 20% discount
    badge: "Most Popular",
    highlight: true,
    idealFor: "10-30 employees",
    features: {
      support: "10/5 Extended Hours",
      users: "15 Users",
      internet: "100Mbps Fibre",
      backup: "LTE Auto-Failover",
      wifi: "5 Access Points",
      security: "Advanced Suite",
      onsite: "2 Visits/Month",
      voip: true,
      sla: "4hr Response",
      manager: false
    },
    cta: "Choose Professional",
    ctaLink: "/contact?bundle=professional"
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "Full Power",
    description: "Enterprise-grade for established businesses",
    monthlyPrice: 15500,
    annualPrice: 11625, // 25% discount
    badge: "Best Value",
    highlight: false,
    idealFor: "30+ employees",
    features: {
      support: "24/7 Always On",
      users: "50 Users",
      internet: "1Gbps Fibre",
      backup: "Dedicated LTE Line",
      wifi: "10+ Access Points",
      security: "Premium + Compliance",
      onsite: "Unlimited",
      voip: true,
      sla: "1hr Response",
      manager: true
    },
    cta: "Talk to Sales",
    ctaLink: "/contact?bundle=enterprise"
  }
];

// Comparison features for table
const comparisonFeatures = [
  { key: 'support', label: 'IT Support Hours', icon: Headphones },
  { key: 'users', label: 'Microsoft 365 Users', icon: Users },
  { key: 'internet', label: 'Internet Speed', icon: Zap },
  { key: 'backup', label: 'Backup Connection', icon: Shield },
  { key: 'wifi', label: 'Wi-Fi Coverage', icon: Building2 },
  { key: 'security', label: 'Security Level', icon: Shield },
  { key: 'onsite', label: 'On-site Support', icon: Users },
  { key: 'voip', label: 'VoIP Phone System', icon: Phone },
  { key: 'sla', label: 'Response Time SLA', icon: Clock },
  { key: 'manager', label: 'Dedicated Account Manager', icon: Star },
];

// Testimonials
const testimonials = [
  {
    quote: "Switching to CircleTel's Professional bundle cut our IT costs by 40% while improving uptime. Our team can finally focus on growing the business.",
    author: "Sarah M.",
    role: "Operations Director",
    company: "Cape Town Logistics Co.",
    metric: "40% cost reduction"
  },
  {
    quote: "The unified support is a game-changer. No more finger-pointing between vendors. One call, problem solved.",
    author: "Michael T.",
    role: "Managing Director",
    company: "Gauteng Manufacturing",
    metric: "99.9% uptime"
  },
  {
    quote: "Enterprise bundle gave us the reliability we needed to scale from 30 to 80 employees without any IT growing pains.",
    author: "Priya N.",
    role: "CEO",
    company: "Durban Tech Startup",
    metric: "2.5x growth enabled"
  }
];

// FAQ items
const faqs = [
  {
    q: "What if I need to scale up mid-contract?",
    a: "We conduct quarterly reviews and can seamlessly upgrade your bundle as you grow. No disruption, no penalties. Pay only the difference."
  },
  {
    q: "Are there any setup or equipment fees?",
    a: "Bundle customers get FREE setup and installation. All equipment (routers, access points, phones) is included in your monthly price."
  },
  {
    q: "What's your uptime guarantee?",
    a: "We guarantee 99.9% uptime with automatic failover. If we don't meet it, you get service credits. Enterprise plans include dedicated backup lines."
  },
  {
    q: "Can I customize what's included?",
    a: "Absolutely. These bundles are starting points. Need more users? Different speeds? Industry-specific compliance? We'll build a custom package."
  }
];

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-ZA').format(price);
};

export default function BundlesPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [showSticky, setShowSticky] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const heroBottom = heroRef.current.getBoundingClientRect().bottom;
        setShowSticky(heroBottom < 0);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section - Conversion Focused */}
        <section
          ref={heroRef}
          className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-20 pb-24"
        >
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-20">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, rgba(245,131,31,0.3) 1px, transparent 0)`,
                backgroundSize: '32px 32px'
              }}
            />
          </div>

          {/* Gradient orbs */}
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-circleTel-orange/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />

          <div className="container mx-auto px-4 relative z-10">
            {/* Trust badge */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-sm text-white/90">
                <Sparkles className="h-4 w-4 text-circleTel-orange" />
                <span>Trusted by 200+ South African businesses</span>
                <div className="flex -space-x-1 ml-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-circleTel-orange text-circleTel-orange" />
                  ))}
                </div>
              </div>
            </div>

            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 tracking-tight">
                IT + Connectivity
                <span className="block text-circleTel-orange mt-2">One Bill. One Call. Done.</span>
              </h1>

              <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
                Stop juggling vendors. Get managed IT, high-speed internet, and
                enterprise security in one simple bundle.
              </p>

              {/* Social proof stats */}
              <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto mb-10">
                {[
                  { value: 'R66K+', label: 'Avg. Annual Savings' },
                  { value: '99.9%', label: 'Uptime Guarantee' },
                  { value: '<4hr', label: 'Response Time' }
                ].map((stat, i) => (
                  <div key={i} className="text-center">
                    <div className="text-2xl md:text-3xl font-bold text-white">{stat.value}</div>
                    <div className="text-xs md:text-sm text-slate-400">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  asChild
                  size="lg"
                  className="bg-circleTel-orange hover:bg-circleTel-orange/90 text-white font-semibold px-8 py-6 text-lg shadow-lg shadow-circleTel-orange/25 hover:shadow-xl hover:shadow-circleTel-orange/30 transition-all"
                >
                  <Link href="#bundles">
                    View Bundles
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-white/30 text-white hover:bg-white/10 font-semibold px-8 py-6 text-lg"
                >
                  <Link href="/contact">
                    <Phone className="mr-2 h-5 w-5" />
                    Talk to an Expert
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Wave divider */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
              <path d="M0 60L48 55C96 50 192 40 288 35C384 30 480 30 576 33.3C672 36.7 768 43.3 864 45C960 46.7 1056 43.3 1152 38.3C1248 33.3 1344 26.7 1392 23.3L1440 20V60H0Z" fill="white"/>
            </svg>
          </div>
        </section>

        {/* Trust logos bar */}
        <section className="py-8 border-b border-slate-100">
          <div className="container mx-auto px-4">
            <p className="text-center text-sm text-slate-500 mb-6">Powering businesses across South Africa</p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
              {['Manufacturing', 'Logistics', 'Professional Services', 'Retail', 'Healthcare'].map((industry, i) => (
                <div key={i} className="flex items-center gap-2 text-slate-600">
                  <Building2 className="h-5 w-5" />
                  <span className="font-medium text-sm">{industry}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Toggle + Bundle Cards */}
        <section id="bundles" className="py-20 scroll-mt-20">
          <div className="container mx-auto px-4">
            {/* Section header with toggle */}
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Choose Your Bundle
              </h2>
              <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
                Everything included: IT support, connectivity, equipment, and security. No hidden fees.
              </p>

              {/* Annual/Monthly toggle */}
              <div className="inline-flex items-center gap-4 bg-slate-100 rounded-full p-1.5">
                <button
                  onClick={() => setIsAnnual(false)}
                  className={`px-6 py-2.5 rounded-full font-medium transition-all ${
                    !isAnnual
                      ? 'bg-white text-slate-900 shadow-md'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setIsAnnual(true)}
                  className={`px-6 py-2.5 rounded-full font-medium transition-all flex items-center gap-2 ${
                    isAnnual
                      ? 'bg-white text-slate-900 shadow-md'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Annual
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">
                    Save up to 25%
                  </Badge>
                </button>
              </div>
            </div>

            {/* Bundle Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
              {bundles.map((bundle, index) => {
                const price = isAnnual ? bundle.annualPrice : bundle.monthlyPrice;
                const savings = bundle.monthlyPrice - bundle.annualPrice;

                return (
                  <div
                    key={bundle.id}
                    className={`relative rounded-2xl transition-all duration-300 ${
                      bundle.highlight
                        ? 'bg-gradient-to-b from-circleTel-orange to-orange-600 p-[2px] shadow-2xl shadow-circleTel-orange/20 scale-105 z-10'
                        : 'bg-slate-200 p-[1px]'
                    }`}
                    style={{
                      animationDelay: `${index * 100}ms`
                    }}
                  >
                    {/* Badge */}
                    {bundle.badge && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                        <Badge className={`${
                          bundle.highlight
                            ? 'bg-slate-900 text-white'
                            : 'bg-blue-600 text-white'
                        } px-4 py-1.5 text-sm font-semibold shadow-lg`}>
                          {bundle.badge}
                        </Badge>
                      </div>
                    )}

                    <div className={`h-full rounded-2xl bg-white p-6 lg:p-8 flex flex-col ${
                      bundle.highlight ? 'pt-8' : ''
                    }`}>
                      {/* Header */}
                      <div className="text-center mb-6">
                        <p className="text-sm font-medium text-circleTel-orange mb-1">{bundle.tagline}</p>
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">{bundle.name}</h3>
                        <p className="text-sm text-slate-500">{bundle.description}</p>
                      </div>

                      {/* Price */}
                      <div className="text-center mb-6 pb-6 border-b border-slate-100">
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-lg text-slate-500">R</span>
                          <span className="text-5xl font-extrabold text-slate-900">
                            {formatPrice(price)}
                          </span>
                          <span className="text-slate-500">/mo</span>
                        </div>
                        {isAnnual && (
                          <p className="text-sm text-green-600 font-medium mt-2">
                            Save R{formatPrice(savings)}/mo with annual billing
                          </p>
                        )}
                        <p className="text-xs text-slate-400 mt-2">Ideal for {bundle.idealFor}</p>
                      </div>

                      {/* Key Features */}
                      <div className="flex-1 space-y-3 mb-6">
                        {[
                          { icon: Headphones, text: bundle.features.support },
                          { icon: Users, text: `${bundle.features.users} Microsoft 365` },
                          { icon: Zap, text: bundle.features.internet },
                          { icon: Shield, text: bundle.features.security },
                          { icon: Clock, text: bundle.features.sla }
                        ].map((feature, i) => (
                          <div key={i} className="flex items-center gap-3 text-sm">
                            <div className={`p-1.5 rounded-lg ${
                              bundle.highlight ? 'bg-circleTel-orange/10' : 'bg-slate-100'
                            }`}>
                              <feature.icon className={`h-4 w-4 ${
                                bundle.highlight ? 'text-circleTel-orange' : 'text-slate-600'
                              }`} />
                            </div>
                            <span className="text-slate-700">{feature.text}</span>
                          </div>
                        ))}
                      </div>

                      {/* CTA */}
                      <Button
                        asChild
                        size="lg"
                        className={`w-full font-semibold ${
                          bundle.highlight
                            ? 'bg-circleTel-orange hover:bg-circleTel-orange/90 shadow-lg shadow-circleTel-orange/25'
                            : 'bg-slate-900 hover:bg-slate-800'
                        }`}
                      >
                        <Link href={bundle.ctaLink}>
                          {bundle.cta}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Custom bundle CTA */}
            <div className="text-center mt-12">
              <p className="text-slate-600 mb-4">
                Need something different? We build custom bundles too.
              </p>
              <Button asChild variant="outline" className="border-circleTel-orange text-circleTel-orange hover:bg-circleTel-orange hover:text-white">
                <Link href="/contact?type=custom">
                  Build Custom Bundle
                  <Sparkles className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-20 bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Compare All Features
              </h2>
              <p className="text-lg text-slate-600">
                See exactly what's included in each bundle
              </p>
            </div>

            <div className="max-w-5xl mx-auto overflow-x-auto">
              <table className="w-full bg-white rounded-2xl shadow-sm overflow-hidden">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left p-6 font-medium text-slate-600">Feature</th>
                    {bundles.map((bundle) => (
                      <th key={bundle.id} className={`p-6 text-center ${
                        bundle.highlight ? 'bg-circleTel-orange/5' : ''
                      }`}>
                        <div className="font-bold text-slate-900">{bundle.name}</div>
                        <div className="text-sm text-slate-500 mt-1">
                          R{formatPrice(isAnnual ? bundle.annualPrice : bundle.monthlyPrice)}/mo
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((feature, index) => (
                    <tr key={feature.key} className={index % 2 === 0 ? 'bg-slate-50/50' : ''}>
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <feature.icon className="h-4 w-4 text-slate-400" />
                          <span className="text-sm text-slate-700">{feature.label}</span>
                        </div>
                      </td>
                      {bundles.map((bundle) => {
                        const value = bundle.features[feature.key as keyof typeof bundle.features];
                        return (
                          <td key={bundle.id} className={`p-4 text-center ${
                            bundle.highlight ? 'bg-circleTel-orange/5' : ''
                          }`}>
                            {typeof value === 'boolean' ? (
                              value ? (
                                <Check className="h-5 w-5 text-green-500 mx-auto" />
                              ) : (
                                <X className="h-5 w-5 text-slate-300 mx-auto" />
                              )
                            ) : (
                              <span className="text-sm text-slate-700 font-medium">{value}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Trusted by Growing Businesses
              </h2>
              <p className="text-lg text-slate-600">
                See what our customers say about switching to CircleTel bundles
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className="relative bg-white rounded-2xl p-8 shadow-sm border border-slate-100 hover:shadow-lg transition-shadow"
                >
                  {/* Metric badge */}
                  <div className="absolute -top-4 right-6">
                    <Badge className="bg-green-100 text-green-700 font-semibold px-3 py-1">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {testimonial.metric}
                    </Badge>
                  </div>

                  {/* Stars */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-circleTel-orange text-circleTel-orange" />
                    ))}
                  </div>

                  {/* Quote */}
                  <blockquote className="text-slate-700 mb-6 leading-relaxed">
                    "{testimonial.quote}"
                  </blockquote>

                  {/* Author */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-circleTel-orange to-orange-600 flex items-center justify-center text-white font-bold">
                      {testimonial.author.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{testimonial.author}</div>
                      <div className="text-sm text-slate-500">{testimonial.role}, {testimonial.company}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                  Common Questions
                </h2>
                <p className="text-lg text-slate-600">
                  Everything you need to know about our bundles
                </p>
              </div>

              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl border border-slate-200 overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                      className="w-full p-6 text-left flex items-center justify-between hover:bg-slate-50 transition-colors"
                    >
                      <span className="font-semibold text-slate-900 pr-4">{faq.q}</span>
                      <ChevronDown
                        className={`h-5 w-5 text-slate-400 flex-shrink-0 transition-transform ${
                          expandedFaq === index ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {expandedFaq === index && (
                      <div className="px-6 pb-6 text-slate-600 leading-relaxed">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, rgba(245,131,31,0.5) 1px, transparent 0)`,
                backgroundSize: '40px 40px'
              }}
            />
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Ready to Simplify Your IT?
              </h2>
              <p className="text-xl text-slate-300 mb-8">
                Join 200+ South African businesses saving time and money with CircleTel bundles.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  asChild
                  size="lg"
                  className="bg-circleTel-orange hover:bg-circleTel-orange/90 text-white font-semibold px-8 py-6 text-lg shadow-lg shadow-circleTel-orange/25"
                >
                  <Link href="/contact">
                    Get Started Today
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-white/30 text-white hover:bg-white/10 font-semibold px-8 py-6 text-lg"
                >
                  <Link href="/resources/it-health">
                    Free IT Assessment
                  </Link>
                </Button>
              </div>
              <p className="text-sm text-slate-400 mt-6">
                No commitment required • Free setup • Cancel anytime
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Sticky Mobile CTA */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 z-50 md:hidden transition-transform duration-300 ${
          showSticky ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="flex gap-3">
          <Button asChild className="flex-1 bg-circleTel-orange hover:bg-circleTel-orange/90">
            <Link href="#bundles">View Bundles</Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link href="/contact">
              <Phone className="mr-2 h-4 w-4" />
              Call Us
            </Link>
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
