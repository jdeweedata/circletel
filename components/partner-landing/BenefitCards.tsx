'use client';

const benefits = [
  {
    icon: '👂',
    title: 'We Listen First, Build Second',
    description: 'Your market insights drive our product roadmap. We develop solutions for the customers you know aren\'t being served well by traditional providers.',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    icon: '🌊',
    title: 'Blue Ocean Positioning',
    description: 'Stop competing on price and speed. We target customers frustrated by commodity ISPs—better fit means easier sales and loyal clients.',
    color: 'from-cyan-500 to-blue-600',
  },
  {
    icon: '🤝',
    title: 'True Partnership Model',
    description: 'Up to 30% recurring commission plus real influence on product direction. Your success directly shapes our business strategy.',
    color: 'from-purple-500 to-pink-600',
  },
  {
    icon: '💡',
    title: 'Product-Market Fit Focus',
    description: 'We obsess over whether solutions actually solve customer problems—not just whether they\'re easy to sell.',
    color: 'from-yellow-500 to-orange-600',
  },
  {
    icon: '📊',
    title: 'Transparent Performance',
    description: 'Real-time portal showing what\'s working, what\'s not, and customer feedback that informs our next build.',
    color: 'from-green-500 to-emerald-600',
  },
  {
    icon: '🚀',
    title: 'Fast-Track Enablement',
    description: '5-7 days to full partner access with training, materials, and dedicated support—no upfront costs.',
    color: 'from-orange-500 to-red-600',
  },
];

export function BenefitCards() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-circleTel-darkNeutral mb-4">
            Why Partner With CircleTel?
          </h2>
          <p className="text-xl text-circleTel-secondaryNeutral max-w-3xl mx-auto">
            We are building a different kind of digital services company—one where partners help shape what we build and how we serve customers.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => {
            return (
              <div
                key={index}
                className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100"
              >
                {/* Gradient Background on Hover */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${benefit.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

                {/* Icon */}
                <div className="relative">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br ${benefit.color} mb-6 shadow-lg`}>
                    <div className="text-4xl">{benefit.icon}</div>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-3">
                    {benefit.title}
                  </h3>

                  {/* Description */}
                  <p className="text-circleTel-secondaryNeutral leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
