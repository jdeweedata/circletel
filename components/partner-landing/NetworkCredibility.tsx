'use client';
import { PiCheckCircleBold, PiMapPinBold, PiHeadphonesBold, PiUsersBold } from 'react-icons/pi';

const stats = [
  {
    icon: PiMapPinBold,
    value: '200+',
    label: 'suburbs covered',
  },
  {
    icon: PiUsersBold,
    value: '94%',
    label: 'customer retention',
  },
  {
    icon: PiHeadphonesBold,
    value: 'SA-based',
    label: 'support team',
  },
];

const networks = [
  { name: 'Vumatel', logo: '/images/network-logos/vumatel.svg' },
  { name: 'Frogfoot', logo: '/images/network-logos/frogfoot.svg' },
  { name: 'Octotel', logo: '/images/network-logos/octotel.svg' },
  { name: 'MetroFibre', logo: '/images/network-logos/metrofibre.svg' },
];

export function NetworkCredibility() {
  return (
    <section className="py-12 bg-circleTel-grey200">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-circleTel-navy mb-2">
              Why our products sell themselves
            </h2>
            <p className="text-circleTel-grey600">
              We partner with South Africa&apos;s leading fibre networks
            </p>
          </div>

          {/* Network Logos */}
          <div className="flex flex-wrap items-center justify-center gap-8 mb-10">
            {networks.map((network) => (
              <div
                key={network.name}
                className="bg-white px-6 py-4 rounded-lg shadow-sm flex items-center justify-center min-w-[120px]"
              >
                <span className="text-circleTel-navy font-semibold text-sm">
                  {network.name}
                </span>
              </div>
            ))}
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl p-5 flex items-center gap-4 shadow-sm"
                >
                  <div className="w-12 h-12 rounded-full bg-circleTel-orange/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-circleTel-orange" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-circleTel-navy">{stat.value}</div>
                    <div className="text-sm text-circleTel-grey600">{stat.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
