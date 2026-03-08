'use client';

import {
  PiHeadsetBold,
  PiHandshakeBold,
  PiRocketLaunchBold,
} from 'react-icons/pi';

const valueProps = [
  {
    title: 'Local Support',
    description:
      'Real people in South Africa. No offshore call centres, no endless hold music. Chat with us on WhatsApp or call directly.',
    icon: PiHeadsetBold,
  },
  {
    title: 'No Lock-in Contracts',
    description:
      'Month-to-month options available on most plans. Stay because you love us, not because you have to.',
    icon: PiHandshakeBold,
  },
  {
    title: 'Fast Installation',
    description:
      'Most installations completed within 3-5 business days. We move fast so you can get connected sooner.',
    icon: PiRocketLaunchBold,
  },
];

export function WhyCircleTel() {
  return (
    <section className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">
            Why Choose CircleTel?
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            We&apos;re not just another ISP. Here&apos;s what makes us different.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {valueProps.map((prop) => {
            const IconComponent = prop.icon;
            return (
              <div
                key={prop.title}
                className="group text-center p-8 rounded-xl border border-slate-100 hover:border-primary/20 hover:shadow-lg transition-all duration-300"
              >
                {/* Icon */}
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <IconComponent className="w-8 h-8 text-primary" />
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-slate-900 mb-3">
                  {prop.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {prop.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
