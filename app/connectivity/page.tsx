'use client';

import React from 'react';
import Link from 'next/link';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wifi, Network, Globe, ArrowRight, Check, Zap, Shield, Clock } from 'lucide-react';

const Connectivity = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-white to-circleTel-lightNeutral py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-circleTel-darkNeutral mb-6">
                <span className="text-circleTel-orange">Wi-Fi as a Service</span>
              </h1>
              <p className="text-xl text-circleTel-secondaryNeutral mb-8">
                Enterprise-grade Wi-Fi connectivity without the capital expense. Managed, monitored, and maintained for optimal performance.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-circleTel-orange hover:bg-circleTel-orange/90">
                  <Link href="/contact">Get Quote</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-circleTel-orange text-circleTel-orange hover:bg-circleTel-orange hover:text-white">
                  <Link href="/resources/wifi-toolkit">Wi-Fi Planning Tool</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-4">Why Choose Wi-Fi as a Service?</h2>
              <p className="text-lg text-circleTel-secondaryNeutral max-w-3xl mx-auto">
                Transform your connectivity with enterprise-grade Wi-Fi that scales with your business
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <Zap className="h-8 w-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">High Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-circleTel-secondaryNeutral">
                    Enterprise-grade equipment delivering consistent high-speed connectivity
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <Shield className="h-8 w-8 text-green-600" />
                  </div>
                  <CardTitle className="text-lg">Enterprise Security</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-circleTel-secondaryNeutral">
                    Advanced security protocols and network segmentation
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                    <Clock className="h-8 w-8 text-purple-600" />
                  </div>
                  <CardTitle className="text-lg">24/7 Monitoring</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-circleTel-secondaryNeutral">
                    Proactive monitoring and management for optimal uptime
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                    <Wifi className="h-8 w-8 text-orange-600" />
                  </div>
                  <CardTitle className="text-lg">Scalable Solution</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-circleTel-secondaryNeutral">
                    Easily expand coverage as your business grows
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Service Options */}
        <section className="bg-circleTel-lightNeutral py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-4">Connectivity Solutions</h2>
              <p className="text-lg text-circleTel-secondaryNeutral">
                Choose from our range of connectivity options
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Wi-Fi as a Service */}
              <Card className="border-2 border-circleTel-orange">
                <CardHeader>
                  <div className="flex items-center justify-center w-16 h-16 bg-circleTel-orange/10 rounded-full mx-auto mb-4">
                    <Wifi className="h-8 w-8 text-circleTel-orange" />
                  </div>
                  <CardTitle className="text-center">Wi-Fi as a Service</CardTitle>
                  <Badge className="mx-auto bg-circleTel-orange">Featured</Badge>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Enterprise-grade equipment</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">24/7 monitoring & support</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">No capital expenditure</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Regular upgrades included</span>
                    </li>
                  </ul>
                  <Button asChild className="w-full bg-circleTel-orange hover:bg-circleTel-orange/90">
                    <Link href="/connectivity/wifi-as-a-service">Learn More</Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Fixed Wireless */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4">
                    <Network className="h-8 w-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-center">Fixed Wireless</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Fast deployment</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">High-speed connectivity</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Reliable performance</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Business-grade SLAs</span>
                    </li>
                  </ul>
                  <Button asChild variant="outline" className="w-full border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white">
                    <Link href="/connectivity/fixed-wireless">Learn More</Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Fibre */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mx-auto mb-4">
                    <Globe className="h-8 w-8 text-emerald-600" />
                  </div>
                  <CardTitle className="text-center">Fibre Solutions</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Ultra-high speeds</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Symmetric upload/download</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Low latency</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Future-proof technology</span>
                    </li>
                  </ul>
                  <Button asChild variant="outline" className="w-full border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white">
                    <Link href="/connectivity/fibre">Learn More</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-6">
                Ready to Upgrade Your Connectivity?
              </h2>
              <p className="text-lg text-circleTel-secondaryNeutral mb-8">
                Let us design a connectivity solution that meets your business needs and budget.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-circleTel-orange hover:bg-circleTel-orange/90">
                  <Link href="/contact">Get Started</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-circleTel-orange text-circleTel-orange hover:bg-circleTel-orange hover:text-white">
                  <Link href="/resources/connectivity-guide">
                    Connectivity Guide <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Connectivity;