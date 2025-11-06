'use client';

import { Quote, Star } from 'lucide-react';

const testimonials = [
  {
    name: 'Thabo M.',
    role: 'Market Development Partner',
    location: 'Soweto',
    image: null, // Placeholder
    quote: 'I told them customers in townships needed better prepaid options. They built it. Now I sell 15-20 connections per month because the product actually fits the market.',
    rating: 5,
  },
  {
    name: 'Sarah N.',
    role: 'Integration Partner',
    location: 'Cape Town',
    image: null,
    quote: 'We integrated their API with our property management system. Now landlords can offer pre-configured WiFi in rental units. Revenue share works for both of us.',
    rating: 5,
  },
  {
    name: 'Johan V.',
    role: 'Channel Partner',
    location: 'Pretoria',
    image: null,
    quote: 'They asked what my corporate clients were frustrated with. Three months later, we had a solution I could actually sell without competing on price. Game changer.',
    rating: 5,
  },
];

export function PartnerTestimonials() {
  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-circleTel-darkNeutral mb-4">
            Partners Who Shape What We Build
          </h2>
          <p className="text-xl text-circleTel-secondaryNeutral max-w-3xl mx-auto">
            Real stories from partners who saw market gaps and helped us fill them
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 border-gray-100"
            >
              {/* Quote Icon */}
              <div className="absolute top-6 right-6 opacity-10">
                <Quote className="h-16 w-16 text-circleTel-orange" />
              </div>

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-circleTel-orange text-circleTel-orange" />
                ))}
              </div>

              {/* Quote */}
              <blockquote className="text-circleTel-secondaryNeutral leading-relaxed mb-6 relative z-10 text-lg">
                "{testimonial.quote}"
              </blockquote>

              {/* Author */}
              <div className="flex items-center gap-4">
                {/* Avatar Placeholder */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-circleTel-orange to-orange-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                  {testimonial.name.charAt(0)}
                </div>

                <div>
                  <div className="font-bold text-circleTel-darkNeutral">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-circleTel-secondaryNeutral">
                    {testimonial.role} • {testimonial.location}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center bg-gradient-to-r from-circleTel-orange to-orange-600 rounded-2xl p-8 text-white shadow-xl">
          <h3 className="text-2xl font-bold mb-3">
            Got Market Insights We Should Hear?
          </h3>
          <p className="text-lg mb-6 text-white/90">
            Join partners who are helping us build solutions that actually solve customer problems
          </p>
          <a
            href="/partner/onboarding"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold bg-white text-circleTel-orange rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105"
          >
            Start the Conversation
            <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
