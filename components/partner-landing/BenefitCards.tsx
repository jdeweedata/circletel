'use client';
import { PiDeviceMobileBold, PiHeadphonesBold, PiLightningBold, PiMoneyBold, PiUsersBold, PiWifiHighBold } from 'react-icons/pi';

const benefits = [
  {
    icon: PiMoneyBold,
    title: 'High Commissions',
    stat: '30%',
    description: 'recurring commission on every customer you refer.',
  },
  {
    icon: PiWifiHighBold,
    title: 'Full Product Range',
    stat: 'Fibre, LTE, 5G',
    description: 'home, business, and rural connectivity solutions.',
  },
  {
    icon: PiDeviceMobileBold,
    title: 'Work From Anywhere',
    stat: '100%',
    description: 'remote. Share links via WhatsApp, social media, or in person.',
  },
  {
    icon: PiUsersBold,
    title: 'Dedicated Support',
    stat: '1-on-1',
    description: 'partner manager to help you close deals faster.',
  },
  {
    icon: PiHeadphonesBold,
    title: 'Local Support',
    stat: 'SA-based',
    description: 'South African support team. No overseas call centres.',
  },
  {
    icon: PiLightningBold,
    title: 'Fast Onboarding',
    stat: '5 min',
    description: 'to sign up and get your unique referral link.',
  },
];

export function BenefitCards() {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-circleTel-navy mb-4">
            Why Partner With CircleTel?
          </h2>
          <p className="text-circleTel-grey600 max-w-2xl mx-auto">
            Everything you need to start earning from day one.
          </p>
        </div>

        {/* Progression Hint */}
        <div className="text-center mb-10">
          <p className="text-circleTel-grey600 text-sm bg-circleTel-grey200 inline-block px-4 py-2 rounded-full">
            Start as a referral partner. As you grow, talk to us about reseller opportunities.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div
                key={index}
                className="bg-circleTel-grey200 rounded-xl p-6 hover:shadow-lg transition-shadow duration-300"
              >
                {/* Icon */}
                <div className="w-12 h-12 rounded-lg bg-circleTel-orange/10 flex items-center justify-center mb-4">
                  <Icon className="h-6 w-6 text-circleTel-orange" />
                </div>

                {/* Stat */}
                <div className="text-2xl font-bold text-circleTel-orange mb-2">
                  {benefit.stat}
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-circleTel-navy mb-2">
                  {benefit.title}
                </h3>

                {/* Description */}
                <p className="text-circleTel-grey600 text-sm">
                  {benefit.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
