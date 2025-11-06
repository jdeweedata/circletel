'use client';

const partnershipTypes = [
  {
    icon: '🎯',
    title: 'Market Development Partner',
    description: 'For partners who identify underserved customer segments',
    color: 'from-blue-500 to-indigo-600',
    benefits: [
      '30% recurring commission on all referred customers',
      'Quarterly roadmap input sessions',
      'Co-branded marketing materials',
      'Dedicated account manager',
    ],
  },
  {
    icon: '🔌',
    title: 'Integration Partner',
    description: 'For technology companies building complementary services',
    color: 'from-purple-500 to-pink-600',
    benefits: [
      'API access to our platform',
      'Revenue share on integrated services',
      'Joint go-to-market opportunities',
      'Technical integration support',
    ],
  },
];

export function PartnershipModels() {
  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-circleTel-darkNeutral mb-4">
            Two Ways to Partner
          </h2>
          <p className="text-xl text-circleTel-secondaryNeutral max-w-3xl mx-auto">
            Choose the partnership model that fits your business goals
          </p>
        </div>

        {/* Partnership Cards Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {partnershipTypes.map((partnership, index) => (
            <div
              key={index}
              className="group relative bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 border-gray-100 hover:border-circleTel-orange/30"
            >
              {/* Gradient Background on Hover */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${partnership.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

              {/* Content */}
              <div className="relative">
                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br ${partnership.color} mb-6 shadow-lg`}>
                  <div className="text-5xl">{partnership.icon}</div>
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-circleTel-darkNeutral mb-3">
                  {partnership.title}
                </h3>

                {/* Description */}
                <p className="text-circleTel-secondaryNeutral mb-6 leading-relaxed">
                  {partnership.description}
                </p>

                {/* Benefits List */}
                <ul className="space-y-3">
                  {partnership.benefits.map((benefit, benefitIndex) => (
                    <li key={benefitIndex} className="flex items-start gap-3">
                      <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-circleTel-orange flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-circleTel-secondaryNeutral leading-relaxed">
                        {benefit}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <div className="mt-8">
                  <a
                    href="/partner/onboarding"
                    className="inline-flex items-center justify-center w-full px-6 py-3 text-base font-semibold text-white bg-circleTel-orange rounded-lg shadow-md hover:bg-circleTel-orange/90 hover:shadow-lg transition-all duration-300 hover:scale-105"
                  >
                    Learn More
                    <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <p className="text-circleTel-secondaryNeutral">
            Not sure which model fits? <a href="mailto:partners@circletel.co.za" className="text-circleTel-orange hover:underline font-semibold">Let us talk through your options</a>
          </p>
        </div>
      </div>
    </section>
  );
}
