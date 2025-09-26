'use client';

import React from 'react';
import Link from 'next/link';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Wifi, Server, Shield, ArrowRight, Star, DollarSign } from 'lucide-react';

const Bundles = () => {
  const bundles = [
    {
      id: "essential",
      name: "Essential Business Bundle",
      description: "Perfect starter bundle for small businesses looking for reliable IT and connectivity",
      monthlyPrice: "R4,500",
      savings: "Save R1,500/month",
      badge: "Most Popular",
      badgeColor: "bg-green-500",
      features: [
        "Basic IT Support (8/5)",
        "5 User Microsoft 365 licenses",
        "20Mbps Fixed Wireless Internet",
        "Basic Wi-Fi Setup (2 access points)",
        "Email Security",
        "Monthly Backup",
        "Remote Support"
      ],
      itValue: "R2,500",
      connectivityValue: "R3,500",
      totalValue: "R6,000",
      cta: "Start Essential Bundle",
      popular: true
    },
    {
      id: "professional",
      name: "Professional Business Bundle",
      description: "Complete solution for growing businesses that need reliable IT and high-speed connectivity",
      monthlyPrice: "R8,500",
      savings: "Save R3,000/month",
      badge: "Best Value",
      badgeColor: "bg-blue-500",
      features: [
        "Advanced IT Support (10/5)",
        "15 User Microsoft 365 licenses",
        "100Mbps Fibre Internet + LTE Backup",
        "Professional Wi-Fi (5 access points)",
        "Advanced Security Suite",
        "Daily Cloud Backup",
        "On-site Support (2 visits/month)",
        "VoIP Phone System"
      ],
      itValue: "R6,500",
      connectivityValue: "R5,000",
      totalValue: "R11,500",
      cta: "Choose Professional",
      popular: false
    },
    {
      id: "enterprise",
      name: "Enterprise Business Bundle",
      description: "Comprehensive solution for established businesses requiring enterprise-grade IT and connectivity",
      monthlyPrice: "R15,500",
      savings: "Save R5,500/month",
      badge: "Maximum Performance",
      badgeColor: "bg-purple-500",
      features: [
        "24/7 Enterprise IT Support",
        "50 User Microsoft 365 licenses",
        "1Gbps Fibre + Dedicated LTE Backup",
        "Enterprise Wi-Fi (10+ access points)",
        "Premium Security + Compliance",
        "Real-time Cloud Backup",
        "Dedicated Account Manager",
        "Advanced VoIP + Video Conferencing",
        "Network Monitoring"
      ],
      itValue: "R12,000",
      connectivityValue: "R9,000",
      totalValue: "R21,000",
      cta: "Get Enterprise Bundle",
      popular: false
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-white to-circleTel-lightNeutral py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-circleTel-darkNeutral mb-6">
                IT + Connectivity <span className="text-circleTel-orange">Service Bundles</span>
              </h1>
              <p className="text-xl text-circleTel-secondaryNeutral mb-8">
                Get everything your business needs in one convenient package. Managed IT services combined with high-speed connectivity at discounted bundle rates.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-circleTel-orange hover:bg-circleTel-orange/90">
                  <Link href="/contact">Get Custom Bundle Quote</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-circleTel-orange text-circleTel-orange hover:bg-circleTel-orange hover:text-white">
                  <Link href="/pricing">View Individual Services</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-4">Why Choose Service Bundles?</h2>
              <p className="text-lg text-circleTel-secondaryNeutral max-w-3xl mx-auto">
                Combining IT support with connectivity solutions provides better value, simplified billing, and unified support
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="text-center">
                <CardHeader>
                  <DollarSign className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <CardTitle>Significant Savings</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-circleTel-secondaryNeutral">Save up to R5,500/month compared to purchasing services separately</p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <CardTitle>Unified Support</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-circleTel-secondaryNeutral">One point of contact for all IT and connectivity issues - no finger pointing</p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <Server className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                  <CardTitle>Integrated Solutions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-circleTel-secondaryNeutral">IT and connectivity designed to work together for optimal performance</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Bundle Options */}
        <section className="bg-circleTel-lightNeutral py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-4">Choose Your Perfect Bundle</h2>
              <p className="text-lg text-circleTel-secondaryNeutral">
                All bundles include IT support, connectivity, and equipment - everything you need to run your business
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {bundles.map((bundle, index) => (
                <Card
                  key={bundle.id}
                  className={`relative ${bundle.popular ? 'border-2 border-circleTel-orange shadow-xl transform hover:scale-105' : ''} transition-all duration-300`}
                >
                  {bundle.badge && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className={`${bundle.badgeColor} text-white px-4 py-1`}>
                        <Star className="h-4 w-4 mr-1" />
                        {bundle.badge}
                      </Badge>
                    </div>
                  )}

                  <CardHeader className={bundle.popular ? 'pt-8' : ''}>
                    <CardTitle className="text-xl text-center">{bundle.name}</CardTitle>
                    <p className="text-center text-circleTel-secondaryNeutral mb-4">{bundle.description}</p>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-circleTel-darkNeutral">{bundle.monthlyPrice}<span className="text-base font-normal">/month</span></div>
                      <p className="text-sm text-green-600 font-semibold">{bundle.savings}</p>
                      <div className="mt-2 text-sm text-circleTel-secondaryNeutral">
                        <span className="line-through">Individual value: {bundle.totalValue}</span>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="mb-6">
                      <h4 className="font-bold text-circleTel-darkNeutral mb-3">Included Services:</h4>
                      <ul className="space-y-2">
                        {bundle.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-start text-sm">
                            <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <h5 className="font-bold text-xs uppercase text-circleTel-darkNeutral mb-2">Value Breakdown:</h5>
                      <div className="text-xs space-y-1">
                        <div className="flex justify-between">
                          <span>IT Services:</span>
                          <span className="font-semibold">{bundle.itValue}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Connectivity:</span>
                          <span className="font-semibold">{bundle.connectivityValue}</span>
                        </div>
                        <hr className="my-1" />
                        <div className="flex justify-between font-bold">
                          <span>Bundle Price:</span>
                          <span className="text-circleTel-orange">{bundle.monthlyPrice}</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      asChild
                      className={bundle.popular ? 'w-full bg-circleTel-orange hover:bg-circleTel-orange/90' : 'w-full'}
                      variant={bundle.popular ? 'default' : 'outline'}
                    >
                      <Link href="/contact">{bundle.cta}</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Custom Bundle CTA */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <Card className="bg-gradient-to-r from-circleTel-orange/10 to-circleTel-orange/5 border border-circleTel-orange/20">
                <CardContent className="p-8 text-center">
                  <h3 className="text-2xl font-bold text-circleTel-darkNeutral mb-4">
                    Need Something Different?
                  </h3>
                  <p className="text-circleTel-secondaryNeutral mb-6 max-w-2xl mx-auto">
                    Every business is unique. We can create a custom bundle that perfectly fits your requirements and budget. Get specialized services, unique connectivity needs, or industry-specific compliance requirements all in one package.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button asChild size="lg" className="bg-circleTel-orange hover:bg-circleTel-orange/90">
                      <Link href="/contact">Build Custom Bundle</Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="border-circleTel-orange text-circleTel-orange hover:bg-circleTel-orange hover:text-white">
                      <Link href="/resources/it-health">
                        Free Assessment <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="bg-circleTel-lightNeutral py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-12 text-center">
                Bundle Questions & Answers
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-bold text-circleTel-darkNeutral mb-2">Can I customize a bundle?</h4>
                  <p className="text-circleTel-secondaryNeutral mb-6">Absolutely! These are starting points. We can adjust services, add specialized features, or create completely custom bundles.</p>

                  <h4 className="font-bold text-circleTel-darkNeutral mb-2">What happens if I outgrow my bundle?</h4>
                  <p className="text-circleTel-secondaryNeutral mb-6">We conduct quarterly reviews and can seamlessly upgrade your bundle as your business grows. No disruption to services.</p>
                </div>

                <div>
                  <h4 className="font-bold text-circleTel-darkNeutral mb-2">Are there setup fees?</h4>
                  <p className="text-circleTel-secondaryNeutral mb-6">Bundle customers get free setup and installation. We also include all necessary equipment in the monthly price.</p>

                  <h4 className="font-bold text-circleTel-darkNeutral mb-2">Can I cancel or change services?</h4>
                  <p className="text-circleTel-secondaryNeutral mb-6">Yes, we offer flexible month-to-month options with 30-day notice for changes. Annual contracts get better rates.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Bundles;