'use client';

import { Quote, Star } from 'lucide-react';

const testimonials = [
  {
    name: 'Thabo Mokoena',
    role: 'Gold Partner',
    location: 'Johannesburg',
    image: null, // Placeholder
    quote: 'CircleTel\'s partner programme transformed my business. The recurring commission model means I earn consistently every month, and the portal makes tracking everything so easy.',
    earnings: 'R28,000/month',
    customers: 120,
    rating: 5,
  },
  {
    name: 'Sarah van der Berg',
    role: 'Platinum Partner',
    location: 'Cape Town',
    image: null,
    quote: 'The training and support are exceptional. My account manager helped me close my first 50 customers in just 3 months. The commission tiers really motivate you to grow.',
    earnings: 'R45,000/month',
    customers: 180,
    rating: 5,
  },
  {
    name: 'Ahmed Patel',
    role: 'Silver Partner',
    location: 'Durban',
    image: null,
    quote: 'I love that CircleTel handles all the technical support and installations. I focus on sales, and they handle the rest. It\'s a perfect partnership.',
    earnings: 'R15,500/month',
    customers: 65,
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
            Partner Success Stories
          </h2>
          <p className="text-xl text-circleTel-secondaryNeutral max-w-3xl mx-auto">
            Hear from partners who are building successful businesses with CircleTel
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
              <blockquote className="text-circleTel-secondaryNeutral leading-relaxed mb-6 relative z-10">
                "{testimonial.quote}"
              </blockquote>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6 py-4 border-t border-b border-gray-200">
                <div>
                  <div className="text-2xl font-bold text-circleTel-orange">
                    {testimonial.earnings}
                  </div>
                  <div className="text-xs text-circleTel-secondaryNeutral">
                    Monthly Earnings
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-circleTel-darkNeutral">
                    {testimonial.customers}
                  </div>
                  <div className="text-xs text-circleTel-secondaryNeutral">
                    Active Customers
                  </div>
                </div>
              </div>

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
            Ready to Write Your Success Story?
          </h3>
          <p className="text-lg mb-6 text-white/90">
            Join hundreds of partners earning recurring commission with CircleTel
          </p>
          <a
            href="/partner/onboarding"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold bg-white text-circleTel-orange rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105"
          >
            Apply Now
            <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
