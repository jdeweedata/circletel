'use client';

import React from 'react';
import Link from 'next/link';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  Battery,
  Globe,
  Wifi,
  FileText,
  Download,
  ArrowRight,
  BookOpen,
  CheckCircle,
  Clock,
  Users,
  ShieldCheck
} from 'lucide-react';

const Resources = () => {
  const mainResources = [
    {
      id: "it-health",
      title: "IT Health Assessment",
      description: "Get a comprehensive evaluation of your current IT infrastructure with actionable recommendations",
      icon: <Activity className="h-8 w-8 text-green-600" />,
      badge: "Free",
      badgeColor: "bg-green-500",
      features: ["Network Security Audit", "Performance Analysis", "Risk Assessment", "Improvement Roadmap"],
      cta: "Start Free Assessment",
      link: "/resources/it-health",
      time: "15 minutes",
      popular: true
    },
    {
      id: "power-backup",
      title: "Power Backup Solutions",
      description: "Protect your business from power outages with our comprehensive UPS and backup power guide",
      icon: <Battery className="h-8 w-8 text-blue-600" />,
      badge: "Guide",
      badgeColor: "bg-blue-500",
      features: ["UPS Sizing Calculator", "Backup Time Estimates", "Cost Analysis", "Installation Guide"],
      cta: "View Power Guide",
      link: "/resources/power-backup",
      time: "10 minutes",
      popular: false
    },
    {
      id: "connectivity-guide",
      title: "Business Connectivity Guide",
      description: "Complete guide to choosing the right internet connectivity for your business needs",
      icon: <Globe className="h-8 w-8 text-purple-600" />,
      badge: "Guide",
      badgeColor: "bg-purple-500",
      features: ["Speed Requirements", "Technology Comparison", "Cost Calculator", "Provider Evaluation"],
      cta: "View Connectivity Guide",
      link: "/resources/connectivity-guide",
      time: "12 minutes",
      popular: true
    },
    {
      id: "wifi-toolkit",
      title: "Wi-Fi Planning Toolkit",
      description: "Professional tools and calculators for planning your business Wi-Fi deployment",
      icon: <Wifi className="h-8 w-8 text-orange-600" />,
      badge: "Tools",
      badgeColor: "bg-orange-500",
      features: ["Coverage Calculator", "Access Point Planner", "Speed Requirements", "Security Checklist"],
      cta: "Open Wi-Fi Toolkit",
      link: "/resources/wifi-toolkit",
      time: "5 minutes",
      popular: false
    }
  ];

  const quickResources = [
    {
      title: "IT Budget Template",
      description: "Spreadsheet template for planning your annual IT budget",
      type: "Download",
      icon: <Download className="h-5 w-5" />,
      link: "#"
    },
    {
      title: "Security Checklist",
      description: "25-point security checklist for small businesses",
      type: "PDF",
      icon: <ShieldCheck className="h-5 w-5" />,
      link: "#"
    },
    {
      title: "Network Documentation Template",
      description: "Template for documenting your network infrastructure",
      type: "Download",
      icon: <FileText className="h-5 w-5" />,
      link: "#"
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
                IT <span className="text-circleTel-orange">Resources Hub</span>
              </h1>
              <p className="text-xl text-circleTel-secondaryNeutral mb-8">
                Free tools, guides, and assessments to help you make informed IT decisions for your business. Get expert insights without the cost.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-circleTel-orange hover:bg-circleTel-orange/90">
                  <Link href="/resources/it-health">Start IT Assessment</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-circleTel-orange text-circleTel-orange hover:bg-circleTel-orange hover:text-white">
                  <Link href="/contact">Talk to Expert</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
              <div>
                <div className="text-3xl font-bold text-circleTel-orange mb-2">2,500+</div>
                <p className="text-circleTel-secondaryNeutral">Assessments Completed</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-circleTel-orange mb-2">R2.5M+</div>
                <p className="text-circleTel-secondaryNeutral">Savings Identified</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-circleTel-orange mb-2">15 min</div>
                <p className="text-circleTel-secondaryNeutral">Average Completion</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-circleTel-orange mb-2">100%</div>
                <p className="text-circleTel-secondaryNeutral">Free to Use</p>
              </div>
            </div>
          </div>
        </section>

        {/* Main Resources */}
        <section className="bg-circleTel-lightNeutral py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-4">Featured Resources</h2>
              <p className="text-lg text-circleTel-secondaryNeutral max-w-3xl mx-auto">
                Comprehensive tools and guides created by our IT experts to help you make better technology decisions
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {mainResources.map((resource, index) => (
                <Card
                  key={resource.id}
                  className={`relative ${resource.popular ? 'border-2 border-circleTel-orange shadow-lg' : ''} transition-all duration-300 hover:shadow-xl`}
                >
                  {resource.badge && (
                    <div className="absolute -top-3 -right-3">
                      <Badge className={`${resource.badgeColor} text-white px-3 py-1`}>
                        {resource.badge}
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <div className="p-3 bg-gray-50 rounded-lg mr-4">
                          {resource.icon}
                        </div>
                        <div>
                          <CardTitle className="text-xl mb-2">{resource.title}</CardTitle>
                          <div className="flex items-center text-sm text-circleTel-secondaryNeutral">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>{resource.time} to complete</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-circleTel-secondaryNeutral">{resource.description}</p>
                  </CardHeader>

                  <CardContent>
                    <div className="mb-6">
                      <h4 className="font-semibold text-circleTel-darkNeutral mb-3">What's Included:</h4>
                      <ul className="space-y-2">
                        {resource.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-center text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Button
                      asChild
                      className={resource.popular ? 'w-full bg-circleTel-orange hover:bg-circleTel-orange/90' : 'w-full'}
                      variant={resource.popular ? 'default' : 'outline'}
                    >
                      <Link href={resource.link}>
                        {resource.cta} <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Quick Resources */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-4">Quick Downloads</h2>
              <p className="text-lg text-circleTel-secondaryNeutral">
                Useful templates and checklists you can download and use immediately
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {quickResources.map((item, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start mb-4">
                      <div className="p-2 bg-circleTel-lightNeutral rounded mr-3">
                        {item.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-circleTel-darkNeutral mb-1">{item.title}</h4>
                        <Badge variant="secondary" className="text-xs mb-2">{item.type}</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-circleTel-secondaryNeutral mb-4">{item.description}</p>
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href={item.link}>
                        Download {item.icon}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Expert Support CTA */}
        <section className="bg-circleTel-lightNeutral py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <Card className="bg-gradient-to-r from-circleTel-orange/10 to-circleTel-orange/5 border border-circleTel-orange/20">
                <CardContent className="p-8 text-center">
                  <Users className="h-12 w-12 text-circleTel-orange mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-circleTel-darkNeutral mb-4">
                    Need Expert Guidance?
                  </h3>
                  <p className="text-circleTel-secondaryNeutral mb-6 max-w-2xl mx-auto">
                    While our resources are comprehensive, sometimes you need personalized advice. Our IT experts are available to discuss your specific situation and provide tailored recommendations.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button asChild size="lg" className="bg-circleTel-orange hover:bg-circleTel-orange/90">
                      <Link href="/contact">Book Free Consultation</Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="border-circleTel-orange text-circleTel-orange hover:bg-circleTel-orange hover:text-white">
                      <Link href="/services">View IT Services</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Resources;