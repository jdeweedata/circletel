'use client';

import React from 'react';
import Link from 'next/link';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Wifi, Shield, Clock, TrendingUp, Users, DollarSign, ArrowRight, Zap, Settings } from 'lucide-react';

const WifiAsAService = () => {
  const benefits = [
    {
      icon: <DollarSign className="h-8 w-8 text-green-600" />,
      title: "No Capital Expenditure",
      description: "Get enterprise-grade Wi-Fi without the upfront hardware costs"
    },
    {
      icon: <Shield className="h-8 w-8 text-blue-600" />,
      title: "Enterprise Security",
      description: "Advanced security protocols and network segmentation included"
    },
    {
      icon: <Clock className="h-8 w-8 text-purple-600" />,
      title: "24/7 Monitoring",
      description: "Proactive monitoring and management for optimal performance"
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-orange-600" />,
      title: "Scalable Solution",
      description: "Easily expand coverage as your business grows"
    }
  ];

  const features = [
    "Enterprise-grade access points and infrastructure",
    "Professional site survey and network design",
    "24/7 proactive monitoring and management",
    "Advanced security with WPA3 and network segmentation",
    "Automatic firmware updates and maintenance",
    "Real-time performance analytics and reporting",
    "Guest network setup and management",
    "Bandwidth management and QoS prioritization"
  ];

  const process = [
    {
      step: "1",
      title: "Site Survey",
      description: "Our engineers conduct a comprehensive site survey to understand your coverage requirements and identify optimal access point placement."
    },
    {
      step: "2",
      title: "Design & Quote",
      description: "We design a custom Wi-Fi solution tailored to your space and provide transparent pricing with no hidden costs."
    },
    {
      step: "3",
      title: "Professional Installation",
      description: "Certified technicians install and configure your Wi-Fi infrastructure with minimal disruption to your business operations."
    },
    {
      step: "4",
      title: "Ongoing Management",
      description: "We continuously monitor, maintain, and optimize your Wi-Fi network to ensure peak performance and security."
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
                <Badge className="mb-4 bg-circleTel-orange">Enterprise Wi-Fi</Badge>
                <h1 className="text-4xl md:text-5xl font-bold text-circleTel-darkNeutral mb-6">
                  Wi-Fi as a Service
                </h1>
                <p className="text-xl text-circleTel-secondaryNeutral mb-8">
                  Enterprise-grade Wi-Fi infrastructure delivered as a service. No capital expenditure, just reliable, managed connectivity that scales with your business.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button asChild size="lg" className="bg-circleTel-orange hover:bg-circleTel-orange/90">
                    <Link href="/contact">Get Quote</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="border-circleTel-orange text-circleTel-orange hover:bg-circleTel-orange hover:text-white">
                    <Link href="/resources/wifi-toolkit">Wi-Fi Planning Tool</Link>
                  </Button>
                </div>
              </div>
              <div className="lg:w-1/2">
                <div className="grid grid-cols-2 gap-6">
                  <Card className="p-6 text-center">
                    <Wifi className="h-12 w-12 text-circleTel-orange mx-auto mb-4" />
                    <h3 className="font-bold text-circleTel-darkNeutral mb-2">99.9% Uptime</h3>
                    <p className="text-sm text-circleTel-secondaryNeutral">Guaranteed reliability</p>
                  </Card>
                  <Card className="p-6 text-center">
                    <Zap className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                    <h3 className="font-bold text-circleTel-darkNeutral mb-2">Gigabit Speeds</h3>
                    <p className="text-sm text-circleTel-secondaryNeutral">High-performance connectivity</p>
                  </Card>
                  <Card className="p-6 text-center">
                    <Shield className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <h3 className="font-bold text-circleTel-darkNeutral mb-2">Bank-Grade Security</h3>
                    <p className="text-sm text-circleTel-secondaryNeutral">WPA3 & network isolation</p>
                  </Card>
                  <Card className="p-6 text-center">
                    <Settings className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                    <h3 className="font-bold text-circleTel-darkNeutral mb-2">Zero Maintenance</h3>
                    <p className="text-sm text-circleTel-secondaryNeutral">Fully managed solution</p>
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
              <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-4">Why Choose Wi-Fi as a Service?</h2>
              <p className="text-lg text-circleTel-secondaryNeutral max-w-3xl mx-auto">
                Transform your business connectivity with a solution that eliminates capital expenditure and ongoing IT headaches
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, index) => (
                <Card key={index} className="text-center p-6">
                  <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    {benefit.icon}
                  </div>
                  <h3 className="font-bold text-circleTel-darkNeutral mb-3">{benefit.title}</h3>
                  <p className="text-circleTel-secondaryNeutral">{benefit.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-circleTel-lightNeutral py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-6">
                  Everything You Need for Enterprise Wi-Fi
                </h2>
                <p className="text-circleTel-secondaryNeutral mb-8">
                  Our Wi-Fi as a Service solution includes all the components and services needed for a world-class wireless network.
                </p>

                <ul className="space-y-4">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="h-6 w-6 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-circleTel-darkNeutral">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <Card className="p-6">
                    <Users className="h-8 w-8 text-circleTel-orange mb-4" />
                    <h4 className="font-bold text-circleTel-darkNeutral mb-2">500+ Concurrent Users</h4>
                    <p className="text-sm text-circleTel-secondaryNeutral">Support for high-density environments</p>
                  </Card>
                  <Card className="p-6">
                    <Shield className="h-8 w-8 text-blue-600 mb-4" />
                    <h4 className="font-bold text-circleTel-darkNeutral mb-2">Guest Network Isolation</h4>
                    <p className="text-sm text-circleTel-secondaryNeutral">Secure guest access separate from corporate network</p>
                  </Card>
                </div>
                <div className="space-y-6 sm:mt-12">
                  <Card className="p-6">
                    <Clock className="h-8 w-8 text-green-600 mb-4" />
                    <h4 className="font-bold text-circleTel-darkNeutral mb-2">Real-time Analytics</h4>
                    <p className="text-sm text-circleTel-secondaryNeutral">Detailed usage and performance insights</p>
                  </Card>
                  <Card className="p-6">
                    <TrendingUp className="h-8 w-8 text-purple-600 mb-4" />
                    <h4 className="font-bold text-circleTel-darkNeutral mb-2">Automatic Scaling</h4>
                    <p className="text-sm text-circleTel-secondaryNeutral">Add capacity as your business grows</p>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-4">Our Implementation Process</h2>
              <p className="text-lg text-circleTel-secondaryNeutral max-w-3xl mx-auto">
                From initial assessment to ongoing management, we handle every aspect of your Wi-Fi deployment
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {process.map((step, index) => (
                <Card key={index} className="relative">
                  <CardHeader className="text-center">
                    <div className="w-12 h-12 bg-circleTel-orange text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">
                      {step.step}
                    </div>
                    <CardTitle className="text-lg">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-circleTel-secondaryNeutral text-center">{step.description}</p>
                  </CardContent>
                  {index < process.length - 1 && (
                    <div className="hidden lg:block absolute -right-6 top-1/2 transform -translate-y-1/2">
                      <ArrowRight className="h-6 w-6 text-circleTel-orange" />
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="bg-circleTel-lightNeutral py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-4">Simple, Transparent Pricing</h2>
              <p className="text-lg text-circleTel-secondaryNeutral">
                No surprise fees, no hidden costs. Just reliable Wi-Fi at a predictable monthly rate.
              </p>
            </div>

            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="text-center">
                <CardHeader>
                  <CardTitle>Small Office</CardTitle>
                  <div className="text-3xl font-bold text-circleTel-darkNeutral">R2,500<span className="text-base font-normal text-circleTel-secondaryNeutral">/month</span></div>
                  <p className="text-circleTel-secondaryNeutral">Up to 50 users</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-left">
                    <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" />2-3 Access Points</li>
                    <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" />Basic Analytics</li>
                    <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" />8/5 Support</li>
                    <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" />Guest Network</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="text-center border-2 border-circleTel-orange">
                <CardHeader>
                  <Badge className="mx-auto mb-2 bg-circleTel-orange">Most Popular</Badge>
                  <CardTitle>Medium Business</CardTitle>
                  <div className="text-3xl font-bold text-circleTel-darkNeutral">R5,500<span className="text-base font-normal text-circleTel-secondaryNeutral">/month</span></div>
                  <p className="text-circleTel-secondaryNeutral">Up to 200 users</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-left">
                    <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" />5-8 Access Points</li>
                    <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" />Advanced Analytics</li>
                    <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" />24/7 Support</li>
                    <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" />Network Segmentation</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <CardTitle>Enterprise</CardTitle>
                  <div className="text-3xl font-bold text-circleTel-darkNeutral">R12,000<span className="text-base font-normal text-circleTel-secondaryNeutral">/month</span></div>
                  <p className="text-circleTel-secondaryNeutral">500+ users</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-left">
                    <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" />10+ Access Points</li>
                    <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" />Real-time Monitoring</li>
                    <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" />Priority Support</li>
                    <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" />Custom Configuration</li>
                  </ul>
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
                Ready to Upgrade Your Wi-Fi?
              </h2>
              <p className="text-lg text-circleTel-secondaryNeutral mb-8">
                Get enterprise-grade Wi-Fi without the capital expenditure. Let's discuss your requirements and provide a custom quote.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-circleTel-orange hover:bg-circleTel-orange/90">
                  <Link href="/contact">Get Custom Quote</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-circleTel-orange text-circleTel-orange hover:bg-circleTel-orange hover:text-white">
                  <Link href="/resources/wifi-toolkit">
                    Wi-Fi Planning Tool <ArrowRight className="ml-2 h-4 w-4" />
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

export default WifiAsAService;