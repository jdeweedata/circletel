'use client';

import React from 'react';
import Link from 'next/link';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Server, Cloud, Shield, Users, Clock, ArrowRight } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const SmallBusinessServices = () => {
  const basicRecipe = {
    title: "Basic IT Recipe",
    description: "Our foundational IT service package designed for small businesses that need reliable support without the complexity.",
    ingredients: [
      "Help Desk Support (8/5)",
      "Basic Security Suite",
      "Cloud Email Setup",
      "Data Backup Solutions"
    ],
    proTips: [
      "Add monthly maintenance for optimal system performance",
      "Consider basic security awareness training for employees"
    ],
    price: "R3,500/mo",
    testimonial: {
      quote: "CircleTel's Basic IT Recipe gave us the perfect amount of support without breaking our budget. Their team is responsive and always explains things in plain language.",
      author: "Sarah Baloyi",
      company: "Green Leaf Accounting"
    }
  };

  const growthRecipe = {
    title: "Growth IT Recipe",
    description: "A comprehensive IT solution for small businesses planning to scale over the next 1-2 years.",
    ingredients: [
      "Help Desk Support (10/5)",
      "Advanced Security Suite",
      "Cloud Migration Services",
      "Disaster Recovery Planning"
    ],
    proTips: [
      "Add quarterly IT strategy sessions to align with business growth",
      "Consider implementing multi-factor authentication across all systems"
    ],
    price: "R6,500/mo",
    testimonial: {
      quote: "CircleTel helped us grow from 8 to 22 employees without any IT headaches. Their Growth IT Recipe scaled perfectly with our business needs.",
      author: "Michael Tshabalala",
      company: "InnovateZA Design Studio"
    }
  };

  const secureRecipe = {
    title: "Secure IT Recipe",
    description: "A specialized security-focused IT solution for small businesses that handle sensitive data or face strict compliance requirements.",
    ingredients: [
      "Help Desk Support (8/5)",
      "Premium Security Stack",
      "Compliance Management",
      "Regular Security Audits"
    ],
    proTips: [
      "Add monthly security awareness training for all staff",
      "Consider penetration testing for critical systems"
    ],
    price: "R8,500/mo",
    testimonial: {
      quote: "As a financial services provider, security is non-negotiable. CircleTel's Secure IT Recipe ensures we meet all compliance requirements while keeping our client data protected.",
      author: "Thandi Moyo",
      company: "TrustWealth Financial Advisors"
    }
  };

  const faqs = [
    {
      question: "How quickly can you respond to IT issues?",
      answer: "For small business clients, we guarantee a response within 1 hour during business hours, with most issues being resolved within 4 hours."
    },
    {
      question: "Can I customize my IT recipe?",
      answer: "Absolutely! Our recipes are starting points, but we can add or remove ingredients based on your specific business needs and budget."
    },
    {
      question: "Do I need to sign a long-term contract?",
      answer: "We offer flexible month-to-month options as well as annual contracts with preferential rates. There's no long-term lock-in if your needs change."
    },
    {
      question: "What if I outgrow my current IT recipe?",
      answer: "We conduct quarterly reviews with all clients and can easily upgrade your recipe as your business grows. Transitions are seamless and planned to avoid disruption."
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
                  Simple IT Recipes for Small Businesses
                </h1>
                <p className="text-lg text-circleTel-secondaryNeutral mb-6">
                  Reliable, affordable IT solutions designed specifically for small businesses with 1-25 employees. No technical jargon, just simple recipes for success.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button asChild className="bg-circleTel-orange hover:bg-circleTel-orange/90">
                    <Link href="/contact">Get a Quote</Link>
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
                Why Small Businesses Choose CircleTel
              </h2>
              <p className="text-lg text-circleTel-secondaryNeutral max-w-3xl mx-auto">
                We understand that small businesses need big results without big budgets
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                  <CardTitle>Designed for Small Teams</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-circleTel-secondaryNeutral">
                    Our recipes are specifically crafted for businesses with 1-25 employees
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <Clock className="h-8 w-8 text-green-600" />
                  </div>
                  <CardTitle>Fast Response Times</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-circleTel-secondaryNeutral">
                    1-hour response guarantee during business hours for all support requests
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                    <Shield className="h-8 w-8 text-orange-600" />
                  </div>
                  <CardTitle>Security First</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-circleTel-secondaryNeutral">
                    All recipes include enterprise-grade security without the enterprise cost
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
              Our Small Business IT Recipes
            </h2>

            <div className="space-y-16">
              {/* Basic Recipe */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <Badge className="bg-blue-100 text-blue-800 mb-4">Most Popular for Startups</Badge>
                  <h3 className="text-2xl font-bold text-circleTel-darkNeutral mb-4">{basicRecipe.title}</h3>
                  <p className="text-circleTel-secondaryNeutral mb-6">{basicRecipe.description}</p>

                  <div className="mb-6">
                    <h4 className="font-bold text-circleTel-darkNeutral mb-3">Ingredients:</h4>
                    <ul className="space-y-2">
                      {basicRecipe.ingredients.map((ingredient, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                          <span>{ingredient}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="text-2xl font-bold text-circleTel-orange mb-4">{basicRecipe.price}</div>
                </div>

                <Card>
                  <CardContent className="p-6">
                    <blockquote className="italic text-circleTel-secondaryNeutral mb-4">
                      "{basicRecipe.testimonial.quote}"
                    </blockquote>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-circleTel-orange text-white rounded-full flex items-center justify-center font-bold mr-4">
                        SB
                      </div>
                      <div>
                        <div className="font-bold text-circleTel-darkNeutral">{basicRecipe.testimonial.author}</div>
                        <div className="text-sm text-circleTel-secondaryNeutral">{basicRecipe.testimonial.company}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Growth Recipe */}
              <div className="bg-circleTel-lightNeutral p-8 rounded-lg">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  <div>
                    <Badge className="bg-purple-100 text-purple-800 mb-4">Best for Growth</Badge>
                    <h3 className="text-2xl font-bold text-circleTel-darkNeutral mb-4">{growthRecipe.title}</h3>
                    <p className="text-circleTel-secondaryNeutral mb-6">{growthRecipe.description}</p>

                    <div className="mb-6">
                      <h4 className="font-bold text-circleTel-darkNeutral mb-3">Ingredients:</h4>
                      <ul className="space-y-2">
                        {growthRecipe.ingredients.map((ingredient, index) => (
                          <li key={index} className="flex items-start">
                            <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                            <span>{ingredient}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="text-2xl font-bold text-circleTel-orange mb-4">{growthRecipe.price}</div>
                  </div>

                  <Card>
                    <CardContent className="p-6">
                      <blockquote className="italic text-circleTel-secondaryNeutral mb-4">
                        "{growthRecipe.testimonial.quote}"
                      </blockquote>
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-circleTel-orange text-white rounded-full flex items-center justify-center font-bold mr-4">
                          MT
                        </div>
                        <div>
                          <div className="font-bold text-circleTel-darkNeutral">{growthRecipe.testimonial.author}</div>
                          <div className="text-sm text-circleTel-secondaryNeutral">{growthRecipe.testimonial.company}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Secure Recipe */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <Badge className="bg-red-100 text-red-800 mb-4">Maximum Security</Badge>
                  <h3 className="text-2xl font-bold text-circleTel-darkNeutral mb-4">{secureRecipe.title}</h3>
                  <p className="text-circleTel-secondaryNeutral mb-6">{secureRecipe.description}</p>

                  <div className="mb-6">
                    <h4 className="font-bold text-circleTel-darkNeutral mb-3">Ingredients:</h4>
                    <ul className="space-y-2">
                      {secureRecipe.ingredients.map((ingredient, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                          <span>{ingredient}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="text-2xl font-bold text-circleTel-orange mb-4">{secureRecipe.price}</div>
                </div>

                <Card>
                  <CardContent className="p-6">
                    <blockquote className="italic text-circleTel-secondaryNeutral mb-4">
                      "{secureRecipe.testimonial.quote}"
                    </blockquote>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-circleTel-orange text-white rounded-full flex items-center justify-center font-bold mr-4">
                        TM
                      </div>
                      <div>
                        <div className="font-bold text-circleTel-darkNeutral">{secureRecipe.testimonial.author}</div>
                        <div className="text-sm text-circleTel-secondaryNeutral">{secureRecipe.testimonial.company}</div>
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
                Ready to Get Started?
              </h2>
              <p className="text-lg text-circleTel-secondaryNeutral mb-8">
                Let's discuss which IT recipe is perfect for your small business needs and budget.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-circleTel-orange hover:bg-circleTel-orange/90">
                  <Link href="/contact">Get Your Custom Quote</Link>
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

export default SmallBusinessServices;