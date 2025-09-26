'use client';

import React from 'react';
import Link from 'next/link';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Server, Cloud, Shield, Users, Clock, ArrowRight, Zap, TrendingUp } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const MediumEnterpriseServices = () => {
  const professionalRecipe = {
    title: "Professional IT Recipe",
    description: "A comprehensive IT solution designed for medium businesses with 25-100 employees who need reliable infrastructure and advanced security.",
    ingredients: [
      "Priority Help Desk Support (24/7)",
      "Advanced Security Suite + Compliance",
      "Microsoft 365 Business Premium",
      "Cloud Infrastructure Management",
      "Disaster Recovery & Business Continuity",
      "Network Infrastructure Design"
    ],
    proTips: [
      "Add dedicated account management for strategic planning",
      "Consider quarterly security assessments and penetration testing"
    ],
    price: "R12,500/mo",
    testimonial: {
      quote: "CircleTel's Professional IT Recipe transformed our operations. With 45 employees across multiple locations, we needed enterprise-grade reliability without the complexity. Their team became an extension of our business.",
      author: "Nomsa Dlamini",
      company: "Horizon Manufacturing"
    }
  };

  const scaleRecipe = {
    title: "Scale IT Recipe",
    description: "An enterprise-focused IT solution for medium businesses planning aggressive growth and requiring scalable infrastructure.",
    ingredients: [
      "Dedicated IT Support Team (24/7)",
      "Enterprise Security Operations Center",
      "Hybrid Cloud Architecture",
      "Advanced Network Monitoring",
      "Compliance & Audit Management",
      "Strategic IT Consulting"
    ],
    proTips: [
      "Add monthly strategic IT reviews with C-level executives",
      "Consider implementing Zero Trust security architecture"
    ],
    price: "R18,500/mo",
    testimonial: {
      quote: "We went from 30 to 85 employees in 18 months. CircleTel's Scale IT Recipe grew with us seamlessly. Their proactive approach prevented any major issues during our rapid expansion phase.",
      author: "James Mitchell",
      company: "TechFlow Solutions"
    }
  };

  const complianceRecipe = {
    title: "Compliance IT Recipe",
    description: "A specialized IT solution for medium businesses in regulated industries requiring strict compliance and audit readiness.",
    ingredients: [
      "24/7 SOC Monitoring & Response",
      "Compliance Framework Management",
      "Advanced Threat Detection",
      "Audit-Ready Documentation",
      "Data Loss Prevention (DLP)",
      "Regulatory Reporting Automation"
    ],
    proTips: [
      "Add annual third-party security assessments",
      "Consider implementing advanced data governance frameworks"
    ],
    price: "R24,500/mo",
    testimonial: {
      quote: "As a financial services company, compliance isn't optional. CircleTel's Compliance IT Recipe ensures we meet all POPI Act and financial regulations while maintaining operational efficiency.",
      author: "Priya Sharma",
      company: "Stellar Capital Advisors"
    }
  };

  const faqs = [
    {
      question: "How do you handle multi-location businesses?",
      answer: "We specialize in unified IT management across multiple locations with centralized monitoring, standardized configurations, and seamless connectivity between sites."
    },
    {
      question: "Can you integrate with our existing enterprise systems?",
      answer: "Yes, our team has extensive experience integrating with ERP, CRM, and other enterprise systems. We provide seamless migration and integration planning."
    },
    {
      question: "What's included in your 24/7 support?",
      answer: "Our 24/7 support includes immediate response to critical issues, proactive monitoring, regular maintenance, and dedicated account management during business hours."
    },
    {
      question: "How do you ensure business continuity?",
      answer: "We implement comprehensive disaster recovery plans, redundant systems, cloud backups, and business continuity testing to ensure minimal downtime."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main>
        {/* Hero Section */}
        <section className="bg-white py-16">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="md:w-1/2">
                <h1 className="text-4xl font-bold text-circleTel-darkNeutral mb-4">
                  Enterprise IT Recipes for Medium Businesses
                </h1>
                <p className="text-lg text-circleTel-secondaryNeutral mb-6">
                  Scalable, enterprise-grade IT solutions designed for growing businesses with 25-100 employees. Advanced infrastructure, security, and support that adapts to your growth.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button asChild className="bg-circleTel-orange hover:bg-circleTel-orange/90">
                    <Link href="/contact">Get Enterprise Quote</Link>
                  </Button>
                  <Button asChild variant="outline" className="border-circleTel-orange text-circleTel-orange hover:bg-circleTel-orange hover:text-white">
                    <Link href="/resources/it-health">Free IT Assessment</Link>
                  </Button>
                </div>
              </div>
              <div className="md:w-1/2">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-circleTel-lightNeutral rounded-lg shadow-sm border border-circleTel-orange flex items-center justify-center aspect-square">
                    <Server className="h-10 w-10 text-circleTel-orange" />
                  </div>
                  <div className="p-4 bg-circleTel-lightNeutral rounded-lg shadow-sm border border-circleTel-orange flex items-center justify-center aspect-square">
                    <Cloud className="h-10 w-10 text-circleTel-orange" />
                  </div>
                  <div className="p-4 bg-circleTel-lightNeutral rounded-lg shadow-sm border border-circleTel-orange flex items-center justify-center aspect-square">
                    <Shield className="h-10 w-10 text-circleTel-orange" />
                  </div>
                  <div className="p-4 bg-circleTel-lightNeutral rounded-lg shadow-sm border border-circleTel-orange flex items-center justify-center aspect-square">
                    <Zap className="h-10 w-10 text-circleTel-orange" />
                  </div>
                  <div className="p-4 bg-circleTel-lightNeutral rounded-lg shadow-sm border border-circleTel-orange flex items-center justify-center aspect-square">
                    <TrendingUp className="h-10 w-10 text-circleTel-orange" />
                  </div>
                  <div className="p-4 bg-circleTel-lightNeutral rounded-lg shadow-sm border border-circleTel-orange flex items-center justify-center aspect-square">
                    <Users className="h-10 w-10 text-circleTel-orange" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-circleTel-lightNeutral py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-4">
                Why Medium Businesses Trust CircleTel
              </h2>
              <p className="text-lg text-circleTel-secondaryNeutral max-w-3xl mx-auto">
                Enterprise-grade solutions with the flexibility and support that growing businesses need
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <TrendingUp className="h-8 w-8 text-blue-600" />
                  </div>
                  <CardTitle>Scalable Infrastructure</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-circleTel-secondaryNeutral">
                    Built to grow with your business from 25 to 500+ employees
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <Clock className="h-8 w-8 text-green-600" />
                  </div>
                  <CardTitle>24/7 Enterprise Support</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-circleTel-secondaryNeutral">
                    Round-the-clock monitoring and support with dedicated account management
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                    <Shield className="h-8 w-8 text-orange-600" />
                  </div>
                  <CardTitle>Advanced Security</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-circleTel-secondaryNeutral">
                    Enterprise-grade security with compliance management and threat monitoring
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Recipe Details */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-12 text-center">
              Our Medium Enterprise IT Recipes
            </h2>

            <div className="space-y-16">
              {/* Professional Recipe */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <Badge className="bg-blue-100 text-blue-800 mb-4">Most Popular for Growing Teams</Badge>
                  <h3 className="text-2xl font-bold text-circleTel-darkNeutral mb-4">{professionalRecipe.title}</h3>
                  <p className="text-circleTel-secondaryNeutral mb-6">{professionalRecipe.description}</p>

                  <div className="mb-6">
                    <h4 className="font-bold text-circleTel-darkNeutral mb-3">Ingredients:</h4>
                    <ul className="space-y-2">
                      {professionalRecipe.ingredients.map((ingredient, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                          <span>{ingredient}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="text-2xl font-bold text-circleTel-orange mb-4">{professionalRecipe.price}</div>
                </div>

                <Card>
                  <CardContent className="p-6">
                    <blockquote className="italic text-circleTel-secondaryNeutral mb-4">
                      "{professionalRecipe.testimonial.quote}"
                    </blockquote>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-circleTel-orange text-white rounded-full flex items-center justify-center font-bold mr-4">
                        ND
                      </div>
                      <div>
                        <div className="font-bold text-circleTel-darkNeutral">{professionalRecipe.testimonial.author}</div>
                        <div className="text-sm text-circleTel-secondaryNeutral">{professionalRecipe.testimonial.company}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Scale Recipe */}
              <div className="bg-circleTel-lightNeutral p-8 rounded-lg">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  <div>
                    <Badge className="bg-purple-100 text-purple-800 mb-4">Best for Rapid Growth</Badge>
                    <h3 className="text-2xl font-bold text-circleTel-darkNeutral mb-4">{scaleRecipe.title}</h3>
                    <p className="text-circleTel-secondaryNeutral mb-6">{scaleRecipe.description}</p>

                    <div className="mb-6">
                      <h4 className="font-bold text-circleTel-darkNeutral mb-3">Ingredients:</h4>
                      <ul className="space-y-2">
                        {scaleRecipe.ingredients.map((ingredient, index) => (
                          <li key={index} className="flex items-start">
                            <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                            <span>{ingredient}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="text-2xl font-bold text-circleTel-orange mb-4">{scaleRecipe.price}</div>
                  </div>

                  <Card>
                    <CardContent className="p-6">
                      <blockquote className="italic text-circleTel-secondaryNeutral mb-4">
                        "{scaleRecipe.testimonial.quote}"
                      </blockquote>
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-circleTel-orange text-white rounded-full flex items-center justify-center font-bold mr-4">
                          JM
                        </div>
                        <div>
                          <div className="font-bold text-circleTel-darkNeutral">{scaleRecipe.testimonial.author}</div>
                          <div className="text-sm text-circleTel-secondaryNeutral">{scaleRecipe.testimonial.company}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Compliance Recipe */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <Badge className="bg-red-100 text-red-800 mb-4">Maximum Compliance</Badge>
                  <h3 className="text-2xl font-bold text-circleTel-darkNeutral mb-4">{complianceRecipe.title}</h3>
                  <p className="text-circleTel-secondaryNeutral mb-6">{complianceRecipe.description}</p>

                  <div className="mb-6">
                    <h4 className="font-bold text-circleTel-darkNeutral mb-3">Ingredients:</h4>
                    <ul className="space-y-2">
                      {complianceRecipe.ingredients.map((ingredient, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                          <span>{ingredient}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="text-2xl font-bold text-circleTel-orange mb-4">{complianceRecipe.price}</div>
                </div>

                <Card>
                  <CardContent className="p-6">
                    <blockquote className="italic text-circleTel-secondaryNeutral mb-4">
                      "{complianceRecipe.testimonial.quote}"
                    </blockquote>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-circleTel-orange text-white rounded-full flex items-center justify-center font-bold mr-4">
                        PS
                      </div>
                      <div>
                        <div className="font-bold text-circleTel-darkNeutral">{complianceRecipe.testimonial.author}</div>
                        <div className="text-sm text-circleTel-secondaryNeutral">{complianceRecipe.testimonial.company}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="bg-circleTel-lightNeutral py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-12 text-center">
                Frequently Asked Questions
              </h2>

              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                    <AccordionContent>{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-6">
                Ready to Scale Your IT Infrastructure?
              </h2>
              <p className="text-lg text-circleTel-secondaryNeutral mb-8">
                Let's discuss which enterprise IT recipe will support your business growth and strategic objectives.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-circleTel-orange hover:bg-circleTel-orange/90">
                  <Link href="/contact">Get Enterprise Quote</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-circleTel-orange text-circleTel-orange hover:bg-circleTel-orange hover:text-white">
                  <Link href="/resources/it-health">
                    Free IT Assessment <ArrowRight className="ml-2 h-4 w-4" />
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

export default MediumEnterpriseServices;