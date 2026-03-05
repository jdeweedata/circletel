'use client';
import { PiArrowRightBold, PiBuildingsBold, PiCheckCircleBold, PiClockBold, PiDesktopTowerBold, PiEnvelopeBold, PiGaugeBold, PiHeadphonesBold, PiInfoBold, PiMapPinBold, PiPhoneBold, PiRadioBold, PiShieldBold, PiUsersBold, PiWifiHighBold } from 'react-icons/pi';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

// Enterprise Solutions
interface Solution {
  id: string;
  name: string;
  tagline: string;
  description: string;
  priceRange: string;
  icon: React.ElementType;
  features: string[];
  useCases: string[];
  badge?: string;
}

const ENTERPRISE_SOLUTIONS: Solution[] = [
  {
    id: 'parkconnect',
    name: 'ParkConnect DUNE',
    tagline: '60GHz mmWave for Office Parks',
    description: 'High-capacity wireless backhaul connecting multiple buildings in office parks, business estates, and campuses.',
    priceRange: 'R8,500 - R85,000/mo',
    icon: PiRadioBold,
    features: [
      'Up to 10 Gbps capacity',
      '60GHz mmWave technology',
      'Building-to-building connectivity',
      '99.99% SLA available',
      'Dedicated NOC monitoring',
      'Same-day fault response',
    ],
    useCases: [
      'Office parks',
      'Business estates',
      'University campuses',
      'Hospital complexes',
    ],
    badge: 'Enterprise',
  },
  {
    id: 'cloudwifi',
    name: 'CloudWiFi WaaS',
    tagline: 'WiFi-as-a-Service for Venues',
    description: 'Fully managed WiFi infrastructure for commercial venues. We handle everything from design to maintenance.',
    priceRange: 'R1,499 - R14,999/mo',
    icon: PiWifiHighBold,
    features: [
      'Enterprise WiFi 6/6E APs',
      'Cloud-managed dashboard',
      'Guest portal branding',
      'Analytics & reporting',
      'Captive portal integration',
      '24/7 remote monitoring',
    ],
    useCases: [
      'Hotels & hospitality',
      'Shopping centers',
      'Conference venues',
      'Co-working spaces',
    ],
    badge: 'Managed',
  },
];

// Why Enterprise
const ENTERPRISE_BENEFITS = [
  {
    icon: PiShieldBold,
    title: 'Enterprise SLA',
    description: '99.99% uptime guarantee with financial penalties for non-compliance.',
  },
  {
    icon: PiHeadphonesBold,
    title: 'Dedicated Support',
    description: 'Named account manager and priority 24/7 technical support.',
  },
  {
    icon: PiDesktopTowerBold,
    title: 'Custom Solutions',
    description: 'Tailored infrastructure design for your specific requirements.',
  },
  {
    icon: PiGaugeBold,
    title: 'Scalable Capacity',
    description: 'Easily scale bandwidth and coverage as your needs grow.',
  },
];

// Trust logos placeholder
const TRUST_STATS = [
  { value: '500+', label: 'Businesses Connected' },
  { value: '99.99%', label: 'Uptime SLA' },
  { value: '< 4hrs', label: 'Response Time' },
  { value: '24/7', label: 'NOC Monitoring' },
];

export default function EnterprisePage() {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    solution: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Submit to API
      const response = await fetch('/api/leads/enterprise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          source: 'enterprise-landing',
        }),
      });

      if (!response.ok) throw new Error('Submission failed');

      setSubmitted(true);
    } catch (error) {
      console.error('Form submission failed:', error);
      alert('Submission failed. Please try again or contact us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-circleTel-navy py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-6">
              <PiBuildingsBold className="w-4 h-4 text-circleTel-orange" />
              <span className="text-sm font-medium text-white">
                Enterprise Solutions
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Connectivity for<br />
              <span className="text-circleTel-orange">Large-Scale Operations</span>
            </h1>

            {/* Subheadline */}
            <p className="font-body text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              High-capacity connectivity solutions for office parks, commercial venues,
              and enterprise campuses. Custom-designed for your needs.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-circleTel-orange hover:bg-circleTel-orange-dark text-white px-8"
                asChild
              >
                <a href="#contact">
                  Request a Quote
                  <PiArrowRightBold className="ml-2 h-5 w-5" />
                </a>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-circleTel-navy px-8"
                asChild
              >
                <a href="tel:+27100000000">
                  <PiPhoneBold className="mr-2 h-4 w-4" />
                  Call Sales
                </a>
              </Button>
            </div>

            {/* Trust Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 pt-12 border-t border-white/20">
              {TRUST_STATS.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="font-heading text-3xl md:text-4xl font-bold text-circleTel-orange">
                    {stat.value}
                  </p>
                  <p className="font-body text-sm text-gray-400 mt-1">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <h2 className="font-heading text-2xl md:text-3xl lg:text-4xl font-bold text-circleTel-navy text-center mb-4">
            Enterprise Solutions
          </h2>
          <p className="font-body text-circleTel-grey600 text-center mb-12 max-w-2xl mx-auto">
            Purpose-built connectivity solutions for large-scale commercial and enterprise deployments.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {ENTERPRISE_SOLUTIONS.map((solution) => {
              const Icon = solution.icon;
              return (
                <div
                  key={solution.id}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow"
                >
                  {/* Header */}
                  <div className="bg-circleTel-navy p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-circleTel-orange/20 rounded-xl flex items-center justify-center">
                          <Icon className="w-6 h-6 text-circleTel-orange" />
                        </div>
                        <div>
                          <h3 className="font-heading text-xl font-semibold text-white">
                            {solution.name}
                          </h3>
                          <p className="font-body text-sm text-gray-400">
                            {solution.tagline}
                          </p>
                        </div>
                      </div>
                      {solution.badge && (
                        <span className="px-3 py-1 bg-circleTel-orange text-white text-xs font-semibold rounded-full">
                          {solution.badge}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <p className="font-body text-circleTel-grey600 mb-4">
                      {solution.description}
                    </p>

                    {/* Price Range */}
                    <div className="mb-6 pb-4 border-b border-gray-100">
                      <span className="font-heading text-2xl font-bold text-circleTel-navy">
                        {solution.priceRange}
                      </span>
                    </div>

                    {/* Features */}
                    <div className="mb-6">
                      <h4 className="font-heading text-sm font-semibold text-circleTel-navy mb-3">
                        Features
                      </h4>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {solution.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <PiCheckCircleBold className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-circleTel-navy">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Use Cases */}
                    <div className="mb-6">
                      <h4 className="font-heading text-sm font-semibold text-circleTel-navy mb-3">
                        Ideal For
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {solution.useCases.map((useCase) => (
                          <span
                            key={useCase}
                            className="px-3 py-1 bg-circleTel-grey200 text-circleTel-navy text-xs font-medium rounded-full"
                          >
                            {useCase}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* CTA */}
                    <Button
                      className="w-full bg-circleTel-navy hover:bg-circleTel-navy/90 text-white"
                      asChild
                    >
                      <a href="#contact">
                        Request Quote
                        <PiArrowRightBold className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-circleTel-grey200 py-16 md:py-20">
        <div className="container mx-auto px-4">
          <h2 className="font-heading text-2xl md:text-3xl lg:text-4xl font-bold text-circleTel-navy text-center mb-12">
            Why Choose CircleTel Enterprise?
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {ENTERPRISE_BENEFITS.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={benefit.title}
                  className="bg-white rounded-2xl p-6 shadow-lg text-center"
                >
                  <div className="w-14 h-14 bg-circleTel-orange/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-7 h-7 text-circleTel-orange" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-circleTel-navy mb-2">
                    {benefit.title}
                  </h3>
                  <p className="font-body text-sm text-circleTel-grey600">
                    {benefit.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section id="contact" className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Left: PiInfoBold */}
              <div>
                <h2 className="font-heading text-2xl md:text-3xl font-bold text-circleTel-navy mb-4">
                  Let&apos;s Discuss Your Requirements
                </h2>
                <p className="font-body text-circleTel-grey600 mb-8">
                  Our enterprise team will design a custom solution tailored to your
                  specific needs. Fill out the form and we&apos;ll be in touch within 24 hours.
                </p>

                {/* Contact Info */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-circleTel-orange/10 rounded-lg flex items-center justify-center">
                      <PiPhoneBold className="w-5 h-5 text-circleTel-orange" />
                    </div>
                    <div>
                      <p className="font-body text-sm text-circleTel-grey600">Sales Hotline</p>
                      <p className="font-heading font-semibold text-circleTel-navy">010 XXX XXXX</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-circleTel-orange/10 rounded-lg flex items-center justify-center">
                      <PiEnvelopeBold className="w-5 h-5 text-circleTel-orange" />
                    </div>
                    <div>
                      <p className="font-body text-sm text-circleTel-grey600">Email</p>
                      <p className="font-heading font-semibold text-circleTel-navy">enterprise@circletel.co.za</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-circleTel-orange/10 rounded-lg flex items-center justify-center">
                      <PiMapPinBold className="w-5 h-5 text-circleTel-orange" />
                    </div>
                    <div>
                      <p className="font-body text-sm text-circleTel-grey600">Office</p>
                      <p className="font-heading font-semibold text-circleTel-navy">Johannesburg, South Africa</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Form */}
              <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100">
                {submitted ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <PiCheckCircleBold className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="font-heading text-xl font-semibold text-circleTel-navy mb-2">
                      Thank You!
                    </h3>
                    <p className="font-body text-circleTel-grey600">
                      We&apos;ve received your inquiry. Our enterprise team will contact you within 24 hours.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-circleTel-navy mb-1">
                          Your Name *
                        </label>
                        <Input
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          placeholder="John Smith"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-circleTel-navy mb-1">
                          Company *
                        </label>
                        <Input
                          name="company"
                          value={formData.company}
                          onChange={handleInputChange}
                          required
                          placeholder="Company Name"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-circleTel-navy mb-1">
                          Email *
                        </label>
                        <Input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          placeholder="john@company.co.za"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-circleTel-navy mb-1">
                          Phone
                        </label>
                        <Input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="010 XXX XXXX"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-circleTel-navy mb-1">
                        Solution Interest *
                      </label>
                      <select
                        name="solution"
                        value={formData.solution}
                        onChange={handleInputChange}
                        required
                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                      >
                        <option value="">Select a solution</option>
                        <option value="parkconnect">ParkConnect DUNE - Office Parks</option>
                        <option value="cloudwifi">CloudWiFi WaaS - Venue WiFi</option>
                        <option value="custom">Custom Enterprise Solution</option>
                        <option value="unsure">Not Sure - Need Consultation</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-circleTel-navy mb-1">
                        Tell us about your requirements
                      </label>
                      <Textarea
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        rows={4}
                        placeholder="Describe your connectivity needs, number of sites, expected capacity, etc."
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-circleTel-orange hover:bg-circleTel-orange-dark text-white"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          Submit Inquiry
                          <PiArrowRightBold className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
