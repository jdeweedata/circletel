'use client';

import { useState, useEffect } from 'react';
import {
  Zap, Shield, Clock, TrendingUp,
  CheckCircle2, ArrowRight, Building2,
  Cloud, Phone, Globe, ChevronRight, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { cn } from '@/lib/utils';

// Types for BizFibre products
interface BizFibreProduct {
  id: string;
  name: string;
  speed_down: number;
  speed_up: number;
  price: string;
  features: string[];
  is_popular: boolean;
}

// Speed tier card component
function SpeedTierCard({
  name,
  speed,
  price,
  popular = false,
  features
}: {
  name: string;
  speed: number;
  price: string;
  popular?: boolean;
  features: string[];
}) {
  const formattedPrice = `R${parseFloat(price).toLocaleString('en-ZA', { minimumFractionDigits: 0 })}`;

  return (
    <div
      className={cn(
        "relative rounded-2xl border transition-all duration-300 hover:shadow-xl",
        popular
          ? "border-circleTel-orange bg-white shadow-lg shadow-circleTel-orange/10"
          : "border-gray-200 bg-white hover:border-circleTel-orange/50"
      )}
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-circleTel-orange text-white text-xs font-bold px-4 py-1.5 rounded-full">
            MOST POPULAR
          </span>
        </div>
      )}

      <div className="p-6">
        {/* Product name */}
        <p className="text-sm text-gray-500 mb-1">{name}</p>

        {/* Speed */}
        <div className="mb-4">
          <span className="text-4xl font-bold text-circleTel-darkNeutral">
            {speed}
          </span>
          <span className="text-lg text-gray-500 ml-1">
            Mbps
          </span>
        </div>

        {/* Price */}
        <div className="mb-6 pb-6 border-b border-gray-100">
          <span className="text-2xl font-bold text-circleTel-darkNeutral">
            {formattedPrice}
          </span>
          <span className="text-sm text-gray-500">
            /month incl. VAT
          </span>
        </div>

        {/* Features */}
        <ul className="space-y-3 mb-6">
          {features.slice(0, 5).map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-circleTel-orange shrink-0 mt-0.5" />
              <span className="text-sm text-gray-600">{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <Button
          asChild
          className={cn(
            "w-full font-semibold transition-all",
            popular
              ? "bg-circleTel-orange hover:bg-orange-600 text-white"
              : "bg-circleTel-darkNeutral hover:bg-gray-800 text-white"
          )}
        >
          <Link href="/quotes/request" className="flex items-center justify-center gap-2">
            Get Started
            <ArrowRight size={16} />
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default function FibrePage() {
  const [products, setProducts] = useState<BizFibreProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch BizFibre Connect products from database
  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch('/api/products?service_type=BizFibreConnect');
        if (response.ok) {
          const data = await response.json();
          // Sort by speed
          const sorted = (data.products || []).sort((a: BizFibreProduct, b: BizFibreProduct) => a.speed_down - b.speed_down);
          setProducts(sorted);
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  // Mark the 100Mbps plan as popular if not already set
  const productsWithPopular = products.map(p => ({
    ...p,
    is_popular: p.speed_down === 100 ? true : p.is_popular
  }));

  const useCases = [
    { icon: Building2, title: 'Large Offices', desc: 'High-density workplaces with 50+ employees' },
    { icon: Cloud, title: 'Cloud-First', desc: 'Companies running critical apps in the cloud' },
    { icon: Phone, title: 'VoIP & Video', desc: 'Businesses relying on voice and video calls' },
    { icon: Globe, title: 'Multi-Site', desc: 'Organizations with distributed locations' }
  ];

  const benefits = [
    {
      icon: Zap,
      title: 'Symmetrical Speeds',
      description: 'Equal upload and download speeds for seamless cloud operations and video conferencing.',
      stat: 'Up to 100Mbps'
    },
    {
      icon: Shield,
      title: 'Enterprise SLA',
      description: 'Service Level Agreement with guaranteed uptime and priority support.',
      stat: 'SLA Included'
    },
    {
      icon: Clock,
      title: 'Low Latency',
      description: 'Dedicated fibre connection ensures minimal latency for real-time applications.',
      stat: '<5ms'
    },
    {
      icon: TrendingUp,
      title: 'Scalable',
      description: 'Easily upgrade your speed tier as your business grows.',
      stat: 'Flexible'
    }
  ];

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white">
        {/* Hero Section - Minimalist Clean */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-circleTel-darkNeutral mb-6 leading-tight">
              Business Fibre
            </h1>

            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Enterprise-grade fibre to the business with symmetrical speeds,
              uncapped data, and dedicated SLA support.
            </p>

            {/* Key stats - simple */}
            <div className="flex flex-wrap justify-center gap-8 mb-10">
              <div className="text-center">
                <p className="text-3xl font-bold text-circleTel-darkNeutral">100Mbps</p>
                <p className="text-sm text-gray-500">Max Speed</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-circleTel-darkNeutral">Uncapped</p>
                <p className="text-sm text-gray-500">Data</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-circleTel-darkNeutral">24/7</p>
                <p className="text-sm text-gray-500">Support</p>
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-circleTel-orange hover:bg-orange-600 text-white font-semibold px-8"
              >
                <Link href="#pricing" className="flex items-center gap-2">
                  View Pricing
                  <ArrowRight size={18} />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-gray-300 text-circleTel-darkNeutral hover:bg-gray-100"
              >
                <Link href="/contact">Request Quote</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-circleTel-darkNeutral mb-4">
              Perfect For Your Business
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              BizFibre Connect is designed for businesses that need reliable, high-speed connectivity
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {useCases.map((useCase, idx) => (
              <div
                key={idx}
                className="text-center p-6 rounded-xl border border-gray-100 hover:border-circleTel-orange/30 hover:shadow-md transition-all"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-circleTel-orange/10 mb-4">
                  <useCase.icon className="w-6 h-6 text-circleTel-orange" />
                </div>
                <h3 className="font-semibold text-circleTel-darkNeutral mb-1">{useCase.title}</h3>
                <p className="text-sm text-gray-500">{useCase.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 md:py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-circleTel-orange font-medium mb-2">PRICING</p>
            <h2 className="text-3xl md:text-4xl font-bold text-circleTel-darkNeutral mb-4">
              Choose Your Speed
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              All BizFibre Connect packages include symmetrical speeds, uncapped data,
              enterprise-grade routing, and SLA support.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-circleTel-orange animate-spin" />
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {productsWithPopular.map((product) => (
                <SpeedTierCard
                  key={product.id}
                  name={product.name}
                  speed={product.speed_down}
                  price={product.price}
                  popular={product.is_popular}
                  features={product.features}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>Unable to load pricing. Please contact us for current rates.</p>
              <Button asChild className="mt-4 bg-circleTel-orange hover:bg-orange-600">
                <Link href="/contact">Contact Sales</Link>
              </Button>
            </div>
          )}

          <p className="text-center text-gray-500 text-sm mt-8">
            All prices include VAT. 24-month contract. Professional installation included.
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-circleTel-orange font-medium mb-2">WHY BIZFIBRE</p>
            <h2 className="text-3xl md:text-4xl font-bold text-circleTel-darkNeutral mb-4">
              Enterprise Features
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {benefits.map((benefit, idx) => (
              <div
                key={idx}
                className="flex gap-4 p-6 rounded-xl border border-gray-100 hover:border-circleTel-orange/30 hover:shadow-md transition-all"
              >
                <div className="shrink-0">
                  <div className="w-12 h-12 rounded-full bg-circleTel-orange/10 flex items-center justify-center">
                    <benefit.icon className="w-6 h-6 text-circleTel-orange" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-circleTel-darkNeutral">{benefit.title}</h3>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {benefit.stat}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Specs */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-circleTel-orange font-medium mb-2">SPECIFICATIONS</p>
              <h2 className="text-3xl md:text-4xl font-bold text-circleTel-darkNeutral">
                Technical Details
              </h2>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              {[
                { label: 'Delivery', value: 'Active Ethernet FTTB' },
                { label: 'Speed Options', value: '10, 25, 50, 100 Mbps' },
                { label: 'Connection Type', value: 'Symmetrical (same up/down)' },
                { label: 'Data', value: 'Uncapped & Unshaped' },
                { label: 'Equipment', value: 'Enterprise router included' },
                { label: 'Contract', value: '24 months' },
                { label: 'Support', value: '24/7 Priority with SLA' }
              ].map((spec, idx, arr) => (
                <div
                  key={idx}
                  className={cn(
                    "flex justify-between items-center px-6 py-4",
                    idx !== arr.length - 1 && "border-b border-gray-100"
                  )}
                >
                  <span className="text-gray-600">{spec.label}</span>
                  <span className="font-medium text-circleTel-darkNeutral">{spec.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-circleTel-orange font-medium mb-2">HOW IT WORKS</p>
            <h2 className="text-3xl md:text-4xl font-bold text-circleTel-darkNeutral mb-4">
              Getting Connected
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              From coverage check to go-live, we handle everything
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {[
                { step: '1', title: 'Request Quote', desc: 'Check coverage & submit your business details' },
                { step: '2', title: 'Verify Business', desc: 'CIPC registration & ID verification' },
                { step: '3', title: 'Site Details', desc: 'Confirm property type & equipment location' },
                { step: '4', title: 'Contract', desc: 'Review and digitally sign your agreement' },
                { step: '5', title: 'Installation', desc: 'Professional on-site fibre installation' },
                { step: '6', title: 'Go Live', desc: 'Connect and enjoy enterprise-grade fibre' }
              ].map((item, idx) => (
                <div key={idx} className="text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-circleTel-orange/10 border-2 border-circleTel-orange flex items-center justify-center">
                    <span className="text-lg font-bold text-circleTel-orange">{item.step}</span>
                  </div>
                  <h3 className="font-semibold text-circleTel-darkNeutral mb-1 text-sm">{item.title}</h3>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-20 bg-circleTel-orange">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready for Business-Grade Fibre?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Check coverage at your business address and get connected today.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-white text-circleTel-orange hover:bg-gray-100 font-semibold px-8"
              >
                <Link href="/contact" className="flex items-center gap-2">
                  Get a Quote
                  <ChevronRight size={18} />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10"
              >
                <Link href="tel:0870876305">Call 087 087 6305</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
      </main>
      <Footer />
    </>
  );
}
