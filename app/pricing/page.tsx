'use client';

import React from 'react';
import Link from 'next/link';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Star } from 'lucide-react';

const Pricing = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-white to-circleTel-lightNeutral py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-circleTel-darkNeutral mb-6">
                Transparent <span className="text-circleTel-orange">IT Pricing</span>
              </h1>
              <p className="text-xl text-circleTel-secondaryNeutral mb-8">
                Choose the right IT recipe for your business. No hidden fees, no surprises.
              </p>
              <Button asChild size="lg" className="bg-circleTel-orange hover:bg-circleTel-orange/90">
                <Link href="/contact">Get Custom Quote</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Pricing Tables */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-4">IT Service Plans</h2>
              <p className="text-lg text-circleTel-secondaryNeutral">
                Flexible pricing based on your business size and needs
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Basic Plan */}
              <Card className="relative border-2 border-blue-200 hover:border-blue-400 transition-colors">
                <CardHeader className="text-center">
                  <CardTitle className="text-xl font-bold text-circleTel-darkNeutral">Basic IT</CardTitle>
                  <div className="text-3xl font-bold text-blue-600 mb-2">From R2,500</div>
                  <p className="text-sm text-circleTel-secondaryNeutral">per month</p>
                  <Badge variant="secondary" className="mx-auto">1-10 Users</Badge>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">8/5 Help Desk Support</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Basic Security Suite</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Cloud Email Setup</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Data Backup Solutions</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Monthly System Reports</span>
                    </li>
                  </ul>
                  <Button asChild variant="outline" className="w-full border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white">
                    <Link href="/services/small-business">Learn More</Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Advanced Plan */}
              <Card className="relative border-2 border-circleTel-orange shadow-lg transform hover:scale-105 transition-all duration-300">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-circleTel-orange text-white px-4 py-1">
                    <Star className="h-4 w-4 mr-1" />
                    Most Popular
                  </Badge>
                </div>
                <CardHeader className="text-center pt-8">
                  <CardTitle className="text-xl font-bold text-circleTel-darkNeutral">Advanced IT</CardTitle>
                  <div className="text-3xl font-bold text-circleTel-orange mb-2">From R5,500</div>
                  <p className="text-sm text-circleTel-secondaryNeutral">per month</p>
                  <Badge variant="secondary" className="mx-auto">25-50 Users</Badge>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">24/7 Help Desk Support</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Enhanced Security Suite</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Hybrid Cloud Management</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">IT Asset Management</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Proactive Monitoring</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Quarterly IT Reviews</span>
                    </li>
                  </ul>
                  <Button asChild className="w-full bg-circleTel-orange hover:bg-circleTel-orange/90">
                    <Link href="/services/mid-size">Get Started</Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Scale Plan */}
              <Card className="relative border-2 border-emerald-200 hover:border-emerald-400 transition-colors">
                <CardHeader className="text-center">
                  <CardTitle className="text-xl font-bold text-circleTel-darkNeutral">Scale IT</CardTitle>
                  <div className="text-3xl font-bold text-emerald-600 mb-2">From R12,000</div>
                  <p className="text-sm text-circleTel-secondaryNeutral">per month</p>
                  <Badge variant="secondary" className="mx-auto">100+ Users</Badge>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">24/7 VIP Support</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Custom Security Architecture</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Multi-site Management</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">IT Governance Framework</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Dedicated Account Manager</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Monthly Executive Briefings</span>
                    </li>
                  </ul>
                  <Button asChild variant="outline" className="w-full border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white">
                    <Link href="/services/growth-ready">Learn More</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-circleTel-lightNeutral py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-6">
                Ready to Get Started?
              </h2>
              <p className="text-lg text-circleTel-secondaryNeutral mb-8">
                Get a personalized quote based on your specific business needs and requirements.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-circleTel-orange hover:bg-circleTel-orange/90">
                  <Link href="/contact">Get Custom Quote</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-circleTel-orange text-circleTel-orange hover:bg-circleTel-orange hover:text-white">
                  <Link href="/bundles">View Service Bundles</Link>
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

export default Pricing;