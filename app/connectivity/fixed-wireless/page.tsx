'use client';

import React from 'react';
import Link from 'next/link';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Network, Zap, Clock, Shield, TrendingUp, ArrowRight, Signal } from 'lucide-react';

const FixedWireless = () => {
  const plans = [
    {
      name: "Business Starter",
      speed: "20Mbps",
      price: "R899",
      features: [
        "20Mbps Down / 5Mbps Up",
        "99.5% Uptime SLA",
        "8/5 Support",
        "Basic Router Included",
        "Fair Usage 500GB"
      ]
    },
    {
      name: "Business Pro",
      speed: "50Mbps",
      price: "R1,899",
      popular: true,
      features: [
        "50Mbps Down / 10Mbps Up",
        "99.9% Uptime SLA",
        "24/7 Support",
        "Enterprise Router",
        "Unlimited Data"
      ]
    },
    {
      name: "Business Max",
      speed: "100Mbps",
      price: "R2,899",
      features: [
        "100Mbps Down / 20Mbps Up",
        "99.9% Uptime SLA",
        "Priority Support",
        "Managed Router",
        "Unlimited + Priority"
      ]
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-white to-circleTel-lightNeutral py-20">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <div className="lg:w-1/2">
                <Badge className="mb-4 bg-blue-600">Fast Deployment</Badge>
                <h1 className="text-4xl md:text-5xl font-bold text-circleTel-darkNeutral mb-6">
                  Fixed Wireless Internet
                </h1>
                <p className="text-xl text-circleTel-secondaryNeutral mb-8">
                  High-speed wireless internet connectivity with business-grade reliability. Quick deployment without the wait for fibre infrastructure.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button asChild size="lg" className="bg-circleTel-orange hover:bg-circleTel-orange/90">
                    <Link href="/contact">Get Quote</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="border-circleTel-orange text-circleTel-orange hover:bg-circleTel-orange hover:text-white">
                    <Link href="/resources/connectivity-guide">Coverage Check</Link>
                  </Button>
                </div>
              </div>
              <div className="lg:w-1/2">
                <div className="grid grid-cols-2 gap-6">
                  <Card className="p-6 text-center">
                    <Signal className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                    <h3 className="font-bold text-circleTel-darkNeutral mb-2">Fast Setup</h3>
                    <p className="text-sm text-circleTel-secondaryNeutral">Install in 24-48 hours</p>
                  </Card>
                  <Card className="p-6 text-center">
                    <Zap className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <h3 className="font-bold text-circleTel-darkNeutral mb-2">High Speed</h3>
                    <p className="text-sm text-circleTel-secondaryNeutral">Up to 100Mbps speeds</p>
                  </Card>
                  <Card className="p-6 text-center">
                    <Shield className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                    <h3 className="font-bold text-circleTel-darkNeutral mb-2">Business Grade</h3>
                    <p className="text-sm text-circleTel-secondaryNeutral">99.9% uptime SLA</p>
                  </Card>
                  <Card className="p-6 text-center">
                    <Clock className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                    <h3 className="font-bold text-circleTel-darkNeutral mb-2">24/7 Support</h3>
                    <p className="text-sm text-circleTel-secondaryNeutral">Round-the-clock monitoring</p>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-4">Why Choose Fixed Wireless?</h2>
              <p className="text-lg text-circleTel-secondaryNeutral max-w-3xl mx-auto">
                Get business-grade internet without waiting for fibre infrastructure
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="text-center p-6">
                <Network className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="font-bold text-circleTel-darkNeutral mb-3">Rapid Deployment</h3>
                <p className="text-circleTel-secondaryNeutral">Installation within 24-48 hours of site survey completion</p>
              </Card>

              <Card className="text-center p-6">
                <TrendingUp className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="font-bold text-circleTel-darkNeutral mb-3">Scalable Bandwidth</h3>
                <p className="text-circleTel-secondaryNeutral">Easily upgrade speeds as your business grows</p>
              </Card>

              <Card className="text-center p-6">
                <Shield className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h3 className="font-bold text-circleTel-darkNeutral mb-3">Business SLAs</h3>
                <p className="text-circleTel-secondaryNeutral">Guaranteed uptime with service level agreements</p>
              </Card>

              <Card className="text-center p-6">
                <Clock className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                <h3 className="font-bold text-circleTel-darkNeutral mb-3">Dedicated Support</h3>
                <p className="text-circleTel-secondaryNeutral">Business-focused support with priority response</p>
              </Card>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="bg-circleTel-lightNeutral py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-4">Fixed Wireless Plans</h2>
              <p className="text-lg text-circleTel-secondaryNeutral">
                Choose the right speed and support level for your business needs
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {plans.map((plan, index) => (
                <Card
                  key={plan.name}
                  className={`relative ${plan.popular ? 'border-2 border-circleTel-orange shadow-xl' : ''} transition-all duration-300 hover:shadow-lg`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-circleTel-orange text-white px-4 py-1">
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  <CardHeader className={plan.popular ? 'pt-8' : ''}>
                    <CardTitle className="text-center text-xl">{plan.name}</CardTitle>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-circleTel-darkNeutral">
                        {plan.price}
                        <span className="text-base font-normal text-circleTel-secondaryNeutral">/month</span>
                      </div>
                      <p className="text-circleTel-orange font-semibold mt-2">{plan.speed}</p>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center text-sm">
                          <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      asChild
                      className={plan.popular ? 'w-full bg-circleTel-orange hover:bg-circleTel-orange/90' : 'w-full'}
                      variant={plan.popular ? 'default' : 'outline'}
                    >
                      <Link href="/contact">Get {plan.name}</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Technical Details */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-8 text-center">
                Technical Specifications
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Network className="h-6 w-6 mr-2 text-circleTel-orange" />
                      Network Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      <li className="flex justify-between">
                        <span>Technology:</span>
                        <span className="font-semibold">Point-to-Point Wireless</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Frequency:</span>
                        <span className="font-semibold">Licensed 5.8GHz</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Latency:</span>
                        <span className="font-semibold">&lt; 10ms</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Redundancy:</span>
                        <span className="font-semibold">Automatic Failover</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Shield className="h-6 w-6 mr-2 text-circleTel-orange" />
                      Service Level
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      <li className="flex justify-between">
                        <span>Uptime SLA:</span>
                        <span className="font-semibold">99.9%</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Installation:</span>
                        <span className="font-semibold">24-48 Hours</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Support Hours:</span>
                        <span className="font-semibold">24/7</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Response Time:</span>
                        <span className="font-semibold">&lt; 1 Hour</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-circleTel-lightNeutral py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-6">
                Ready to Get Connected?
              </h2>
              <p className="text-lg text-circleTel-secondaryNeutral mb-8">
                Fast deployment, business-grade reliability, and dedicated support. Get your business connected in 48 hours.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-circleTel-orange hover:bg-circleTel-orange/90">
                  <Link href="/contact">Get Quote & Coverage Check</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-circleTel-orange text-circleTel-orange hover:bg-circleTel-orange hover:text-white">
                  <Link href="/resources/connectivity-guide">
                    Compare Connectivity Options <ArrowRight className="ml-2 h-4 w-4" />
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

export default FixedWireless;