import React from 'react'
import { Trophy, Star, Award, Users } from 'lucide-react'

interface AwardItem {
  title: string
  description: string
  year?: string
  icon?: {
    url: string
  }
}

interface AwardsSectionProps {
  awards?: AwardItem[]
}

const defaultAwards = [
  {
    title: '7x Broadband ISP of the Year',
    description: 'Voted best broadband provider',
    year: '2023'
  },
  {
    title: '5x ASA Africa Category Winner',
    description: 'Excellence in African hosting',
    year: '2023'
  },
  {
    title: '3x IT Person of the Year Winner',
    description: 'Industry leadership recognition',
    year: '2022'
  }
]

export default function AwardsSection({ awards = defaultAwards }: AwardsSectionProps) {
  return (
    <section className="py-16 bg-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            You're in good hands.
          </h2>
          <p className="text-lg text-gray-600">
            Award-winning hosting backed by industry recognition
          </p>
        </div>

        {/* Awards Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {awards.map((award, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow group">
              <div className="mb-4">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Trophy className="w-10 h-10 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{award.title}</h3>
              <p className="text-gray-600 mb-2">{award.description}</p>
              {award.year && (
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  {award.year}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-circleTel-orange mb-2">25+</div>
              <p className="text-gray-600">Years of Experience</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-circleTel-orange mb-2">50K+</div>
              <p className="text-gray-600">Happy Customers</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-circleTel-orange mb-2">99.9%</div>
              <p className="text-gray-600">Uptime Guarantee</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-circleTel-orange mb-2">24/7</div>
              <p className="text-gray-600">Support Available</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-12 text-center">
          <h3 className="text-2xl font-semibold text-gray-900 mb-6">
            Ready to experience award-winning hosting?
          </h3>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-3 bg-circleTel-orange text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors shadow-lg">
              Get Started Today
            </button>
            <button className="px-8 py-3 bg-white text-gray-700 font-semibold rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-colors">
              Talk to Sales
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}