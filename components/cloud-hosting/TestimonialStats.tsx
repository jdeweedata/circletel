import React from 'react'
import { Quote } from 'lucide-react'

interface TestimonialStatsProps {
  data?: {
    statNumber: string
    statText: string
    testimonialText: string
    testimonialAuthor: string
    testimonialRole: string
  }
}

export default function TestimonialStats({ data }: TestimonialStatsProps) {
  const defaultData = {
    statNumber: '58 315',
    statText: 'people just like you use ISP in South Africa',
    testimonialText: 'Managed VPS/Servers! Unrivalled support, availability and consistency! What more could a web agency need! CircleTel has been a cornerstone in our growth and development, and our clients absolutely love them!',
    testimonialAuthor: 'TechAgent CEO',
    testimonialRole: 'Digital Solutions Provider'
  }

  const content = data || defaultData

  return (
    <section className="bg-gradient-to-br from-circleTel-orange via-orange-500 to-orange-600 py-16 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white rounded-full"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-white rounded-full"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Stats Section */}
          <div className="text-white">
            <div className="text-6xl md:text-7xl font-bold mb-4">
              {content.statNumber}
            </div>
            <p className="text-2xl md:text-3xl font-light">
              {content.statText}
            </p>
            <div className="mt-8">
              <button className="px-6 py-3 bg-white text-circleTel-orange font-semibold rounded-lg hover:shadow-xl transition-all transform hover:scale-105">
                Join Our Community
              </button>
            </div>
          </div>

          {/* Testimonial Section */}
          <div className="bg-white rounded-2xl p-8 shadow-2xl relative">
            <Quote className="absolute top-4 right-4 w-12 h-12 text-circleTel-orange/20" />
            
            <div className="space-y-4">
              <div className="flex items-center space-x-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                  </svg>
                ))}
              </div>
              
              <p className="text-gray-700 italic text-lg leading-relaxed">
                "{content.testimonialText}"
              </p>
              
              <div className="pt-4 border-t">
                <p className="font-semibold text-gray-900">{content.testimonialAuthor}</p>
                <p className="text-sm text-gray-600">{content.testimonialRole}</p>
              </div>
            </div>

            <div className="mt-6 text-sm text-gray-500">
              View all Google Reviews
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}