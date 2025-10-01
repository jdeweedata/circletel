'use client';

import React from 'react';
import Link from 'next/link';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Wifi, Server, Shield, ArrowRight, Star, Zap, Battery, Cloud } from 'lucide-react';

const BusinessPro = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-white to-circleTel-lightNeutral py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col lg:flex-row items-center gap-12">
                {/* Text Content */}
                <div className="w-full lg:w-1/2">
                  <Badge className="bg-circleTel-orange text-white mb-4">
                    <Wifi className="h-4 w-4 mr-2" />
                    Business Pro Bundle
                  </Badge>
                  <h1 className="text-4xl md:text-5xl font-bold text-circleTel-darkNeutral mb-6">
                    High-Speed Connectivity with Complete Power Resilience
                  </h1>
                  <p className="text-xl text-circleTel-secondaryNeutral mb-8">
                    Perfect for South African businesses dealing with power outages and connectivity challenges. Keep your business running during electrical disruptions with our comprehensive Business Pro Bundle.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    <Button asChild size="lg" className="bg-circleTel-orange hover:bg-circleTel-orange/90">
                      <Link href="/contact">Get Business Pro Bundle</Link>
                    </Button>
                    <Button asChild variant="outline" size="lg">
                      <Link href="/resources/it-health">Free Assessment</Link>
                    </Button>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-circleTel-secondaryNeutral">
                    <div className="flex items-center">
                      <Shield className="h-4 w-4 text-green-500 mr-1" />
                      <span>POPIA Compliant</span>
                    </div>
                    <div className="flex items-center">
                      <Battery className="h-4 w-4 text-circleTel-orange mr-1" />
                      <span>Power Outage Ready</span>
                    </div>
                  </div>
                </div>

                {/* Recipe Card */}
                <div className="w-full lg:w-1/2 flex justify-center">
                  <div className="relative">
                    <div className="recipe-card w-full max-w-md relative z-10 shadow-xl border-2 bg-white p-6 rounded-lg">
                      <div className="absolute top-0 right-0 bg-circleTel-orange text-white text-sm font-space-mono py-1 px-3 rounded-bl-lg">
                        FROM R1,999/MONTH
                      </div>

                      <h3 className="text-xl font-bold text-circleTel-darkNeutral mt-6 mb-2">Business Pro Bundle Recipe</h3>
                      <div className="bg-circleTel-lightNeutral h-1 w-20 mb-4"></div>

                      <div className="mb-6">
                        <h4 className="font-bold text-sm uppercase text-circleTel-darkNeutral mb-2">Ingredients</h4>
                        <ul className="text-circleTel-secondaryNeutral font-space-mono text-sm space-y-3">
                          <li className="flex items-center">
                            <div className="h-3 w-3 bg-circleTel-orange rounded-full mr-2"></div>
                            <span>100Mbps High-Speed Wireless Internet</span>
                          </li>
                          <li className="flex items-center">
                            <div className="h-3 w-3 bg-circleTel-orange rounded-full mr-2"></div>
                            <span>Managed UPS for Power Outages</span>
                          </li>
                          <li className="flex items-center">
                            <div className="h-3 w-3 bg-circleTel-orange rounded-full mr-2"></div>
                            <span>Proactive IT Monitoring</span>
                          </li>
                          <li className="flex items-center">
                            <div className="h-3 w-3 bg-circleTel-orange rounded-full mr-2"></div>
                            <span>2GB Secure Cloud Backup</span>
                          </li>
                        </ul>
                      </div>

                      <div className="bg-circleTel-lightNeutral p-4 rounded-md">
                        <h4 className="font-bold text-sm uppercase text-circleTel-darkNeutral mb-2">Chef&apos;s Notes</h4>
                        <p className="text-circleTel-secondaryNeutral font-space-mono text-sm">
                          Perfect for South African businesses dealing with power outages and connectivity challenges. Keeps your business running during electrical disruptions.
                        </p>
                      </div>
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute top-5 right-5 -z-10 h-full w-full bg-circleTel-orange opacity-5 rounded-lg transform rotate-3"></div>
                    <div className="absolute -bottom-5 -left-5 -z-10 h-full w-full border-2 border-circleTel-orange border-dashed rounded-lg transform -rotate-2"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-12 text-center">
                What&apos;s Included in Business Pro
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <Card className="text-center hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <Wifi className="h-12 w-12 text-circleTel-orange mx-auto mb-4" />
                    <CardTitle className="text-lg">High-Speed Internet</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-circleTel-secondaryNeutral">100Mbps wireless internet with enterprise-grade reliability and priority support</p>
                  </CardContent>
                </Card>

                <Card className="text-center hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <Battery className="h-12 w-12 text-circleTel-orange mx-auto mb-4" />
                    <CardTitle className="text-lg">Power Resilience</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-circleTel-secondaryNeutral">Managed UPS systems keep your internet and critical systems running during load shedding</p>
                  </CardContent>
                </Card>

                <Card className="text-center hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <Server className="h-12 w-12 text-circleTel-orange mx-auto mb-4" />
                    <CardTitle className="text-lg">IT Monitoring</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-circleTel-secondaryNeutral">24/7 proactive monitoring of your IT infrastructure with automatic issue resolution</p>
                  </CardContent>
                </Card>

                <Card className="text-center hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <Cloud className="h-12 w-12 text-circleTel-orange mx-auto mb-4" />
                    <CardTitle className="text-lg">Secure Backup</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-circleTel-secondaryNeutral">2GB secure cloud backup with automatic daily synchronization and disaster recovery</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Detailed Features */}
        <section className="bg-circleTel-lightNeutral py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-12 text-center">
                Complete Bundle Features
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-4 flex items-center">
                    <Wifi className="h-5 w-5 text-circleTel-orange mr-2" />
                    Connectivity Features
                  </h3>
                  <ul className="space-y-3">
                    {[
                      "100Mbps High-Speed Wireless Internet",
                      "Enterprise-grade router and equipment",
                      "Priority technical support",
                      "Service level agreement (SLA)",
                      "Network performance monitoring",
                      "Redundant connectivity options"
                    ].map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-circleTel-secondaryNeutral">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-4 flex items-center">
                    <Server className="h-5 w-5 text-circleTel-orange mr-2" />
                    IT Support Features
                  </h3>
                  <ul className="space-y-3">
                    {[
                      "Managed UPS for power outages",
                      "24/7 proactive IT monitoring",
                      "2GB secure cloud backup",
                      "Remote support and troubleshooting",
                      "Software updates and patches",
                      "Security monitoring and alerts"
                    ].map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-circleTel-secondaryNeutral">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <Card className="bg-gradient-to-r from-circleTel-orange/10 to-circleTel-orange/5 border border-circleTel-orange/20">
                <CardContent className="p-8 text-center">
                  <Badge className="bg-circleTel-orange text-white mb-4">
                    <Star className="h-4 w-4 mr-1" />
                    Most Popular for SMEs
                  </Badge>

                  <h3 className="text-2xl font-bold text-circleTel-darkNeutral mb-4">
                    Business Pro Bundle Pricing
                  </h3>

                  <div className="mb-6">
                    <div className="text-4xl font-bold text-circleTel-darkNeutral mb-2">
                      From R1,999<span className="text-lg font-normal">/month</span>
                    </div>
                    <p className="text-circleTel-secondaryNeutral">
                      All-inclusive pricing with no setup fees or hidden costs
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
                    <Button asChild size="lg" className="bg-circleTel-orange hover:bg-circleTel-orange/90">
                      <Link href="/contact">Get Started Today</Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="border-circleTel-orange text-circleTel-orange hover:bg-circleTel-orange hover:text-white">
                      <Link href="/resources/it-health">
                        Free Assessment <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>

                  <p className="text-sm text-circleTel-secondaryNeutral">
                    30-day money-back guarantee • No long-term contracts required
                  </p>
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
                Business Pro Bundle FAQ
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-bold text-circleTel-darkNeutral mb-2">How does the UPS system work?</h4>
                  <p className="text-circleTel-secondaryNeutral mb-6">Our managed UPS systems automatically kick in during power outages, keeping your internet connection and critical systems running for hours, not minutes.</p>

                  <h4 className="font-bold text-circleTel-darkNeutral mb-2">What areas do you service?</h4>
                  <p className="text-circleTel-secondaryNeutral mb-6">We serve both urban and rural communities across South Africa, with specialized solutions for areas prone to load shedding.</p>
                </div>

                <div>
                  <h4 className="font-bold text-circleTel-darkNeutral mb-2">Is there a setup fee?</h4>
                  <p className="text-circleTel-secondaryNeutral mb-6">No setup fees for Business Pro Bundle customers. We handle all installation and configuration at no extra cost.</p>

                  <h4 className="font-bold text-circleTel-darkNeutral mb-2">Can I upgrade or downgrade?</h4>
                  <p className="text-circleTel-secondaryNeutral mb-6">Yes, we offer flexible month-to-month options with easy upgrades or downgrades as your business needs change.</p>
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

export default BusinessPro;