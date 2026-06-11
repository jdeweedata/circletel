import Link from 'next/link';
import type { Metadata } from 'next';
import {
  PiArrowRightBold,
  PiChartLineUpBold,
  PiCheckCircleBold,
  PiCloudArrowUpBold,
  PiFlagPennantBold,
  PiHeadsetBold,
  PiMapPinAreaBold,
  PiRoadHorizonBold,
  PiShieldCheckBold,
  PiUsersThreeBold,
} from 'react-icons/pi';

import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Growth-Ready IT Services | CircleTel',
  description:
    'Managed IT services for scaling South African businesses that need stronger support, security, backup and multi-site readiness.',
};

const growthSignals = [
  {
    icon: PiUsersThreeBold,
    title: 'Hiring is outpacing support',
    description:
      'New users, devices and permissions need a predictable onboarding process instead of ad-hoc fixes.',
  },
  {
    icon: PiMapPinAreaBold,
    title: 'More sites are coming',
    description:
      'Branches, warehouses and remote teams need consistent connectivity, backup and support standards.',
  },
  {
    icon: PiShieldCheckBold,
    title: 'Risk is getting harder to manage',
    description:
      'Security, Microsoft 365 access, backups and user behaviour need a clear operating baseline.',
  },
];

const roadmapItems = [
  {
    icon: PiHeadsetBold,
    label: 'Support model',
    copy: 'Define support hours, priority rules, escalation paths and the user onboarding process.',
  },
  {
    icon: PiCloudArrowUpBold,
    label: 'Cloud and backup',
    copy: 'Stabilise Microsoft 365, cloud backup, mailbox management and recovery expectations.',
  },
  {
    icon: PiShieldCheckBold,
    label: 'Security posture',
    copy: 'Plan firewall, endpoint, email security, VPN and security awareness in the right order.',
  },
  {
    icon: PiRoadHorizonBold,
    label: 'Scale planning',
    copy: 'Turn upcoming headcount, branch and application needs into a practical quarterly IT plan.',
  },
];

const tiers = [
  {
    name: 'Premium Managed IT',
    audience: '25-50 users',
    price: 'From R9,999/mo',
    description:
      'For growing teams that need proactive support, managed security and better operational visibility.',
    features: [
      'Priority helpdesk and monitoring',
      'Managed firewall, endpoint and email protection',
      'Microsoft 365 administration',
      'Expanded cloud backup and recovery planning',
      'Quarterly IT health reviews',
    ],
  },
  {
    name: 'Enterprise Managed IT',
    audience: '50-100 users',
    price: 'From R19,999/mo',
    description:
      'For larger teams that need governance, multi-site planning and a more structured IT operating rhythm.',
    features: [
      'Dedicated account management',
      'Multi-site connectivity and VPN planning',
      'Compliance-aware documentation',
      'Strategic roadmap sessions',
      'Advanced backup and continuity planning',
    ],
    featured: true,
  },
  {
    name: 'Custom Growth Stack',
    audience: '100+ users or complex sites',
    price: 'POA',
    description:
      'For businesses with regulated workflows, specialist applications, complex networks or multiple locations.',
    features: [
      'Custom connectivity and cloud architecture',
      'Security and access-control design',
      'Supplier and migration coordination',
      'Board-ready service reporting',
      'Phased implementation roadmap',
    ],
  },
];

const cadence = [
  'Map the next 6-12 months of hiring, branch, application and compliance pressure.',
  'Standardise support, Microsoft 365, backup, firewall and connectivity baselines.',
  'Move the highest-risk gaps first, then sequence upgrades around business operations.',
  'Review progress quarterly so IT decisions keep matching the business plan.',
];

const proofPoints = [
  'Single provider for connectivity, managed IT, backup and security',
  'Designed for month-to-month business agility where possible',
  'Partner-backed delivery across Microsoft, backup and IT support services',
  'South African SME focus, not generic enterprise theatre',
];

export default function GrowthReadyITPage() {
  return (
    <div className="min-h-screen bg-circleTel-lightNeutral text-circleTel-navy">
      <Navbar />

      <main>
        <section className="relative overflow-hidden bg-circleTel-navy text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_88%_18%,rgba(232,122,30,0.34),transparent_28%),linear-gradient(135deg,rgba(15,20,39,0.94),rgba(27,42,74,0.96))]" />
          <div className="container relative mx-auto grid min-h-[660px] items-center gap-12 px-4 py-20 lg:grid-cols-[1fr_0.95fr] lg:py-28">
            <div className="max-w-3xl">
              <Badge className="mb-5 bg-white/12 text-white ring-1 ring-white/25 hover:bg-white/12">
                Managed IT for scaling teams
              </Badge>
              <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-normal text-white sm:text-5xl lg:text-6xl">
                Growth-ready IT for the next version of your business.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/82 sm:text-xl">
                When your team, sites and risk profile start changing faster than your IT can keep up, CircleTel helps turn the mess into a managed operating rhythm.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="bg-circleTel-orange text-white hover:bg-circleTel-orange-dark">
                  <Link href="/quotes/request">
                    Plan my growth stack
                    <PiArrowRightBold className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/70 bg-white/5 text-white hover:bg-white hover:text-circleTel-navy"
                >
                  <Link href="/resources/it-health">Start with an assessment</Link>
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-white/16 bg-white/10 p-5 shadow-2xl backdrop-blur">
              <div className="rounded-xl bg-white p-6 text-circleTel-navy">
                <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.08em] text-circleTel-orange">
                      Growth operating model
                    </p>
                    <h2 className="mt-1 text-2xl font-bold">What changes when IT is ready to scale</h2>
                  </div>
                  <PiChartLineUpBold className="h-12 w-12 text-circleTel-orange" />
                </div>

                <div className="mt-6 grid gap-4">
                  {roadmapItems.map((item) => {
                    const Icon = item.icon;

                    return (
                      <div key={item.label} className="grid grid-cols-[44px_1fr] gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-circleTel-orange-light text-circleTel-orange">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-circleTel-navy">{item.label}</h3>
                          <p className="mt-1 text-sm leading-6 text-circleTel-secondaryNeutral">{item.copy}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <Badge className="mb-4 bg-circleTel-orange-light text-circleTel-orange-accessible hover:bg-circleTel-orange-light">
                When to upgrade the IT model
              </Badge>
              <h2 className="text-3xl font-bold text-circleTel-navy md:text-4xl">
                Growth does not break IT all at once. It shows up in patterns.
              </h2>
              <p className="mt-4 text-lg leading-8 text-circleTel-secondaryNeutral">
                These are the signals that the business has outgrown informal support and needs a managed operating base.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {growthSignals.map((signal) => {
                const Icon = signal.icon;

                return (
                  <Card key={signal.title} className="border-ui-border bg-white shadow-sm">
                    <CardContent className="p-7">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-circleTel-orange-light text-circleTel-orange">
                        <Icon className="h-7 w-7" />
                      </div>
                      <h3 className="mt-6 text-xl font-bold text-circleTel-navy">{signal.title}</h3>
                      <p className="mt-3 leading-7 text-circleTel-secondaryNeutral">{signal.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
              <div className="lg:sticky lg:top-32">
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-circleTel-orange-accessible">
                  Scale packages
                </p>
                <h2 className="mt-3 text-3xl font-bold text-circleTel-navy md:text-4xl">
                  Move from reactive IT to a managed growth plan.
                </h2>
                <p className="mt-5 text-lg leading-8 text-circleTel-secondaryNeutral">
                  The right package depends on users, locations, applications, operating hours and risk. We start with the smallest stack that creates control.
                </p>
              </div>

              <div className="grid gap-6">
                {tiers.map((tier) => (
                  <Card
                    key={tier.name}
                    className={
                      tier.featured
                        ? 'border-circleTel-navy bg-circleTel-navy text-white shadow-2xl'
                        : 'border-ui-border bg-white shadow-sm'
                    }
                  >
                    <CardContent className="p-7">
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                        <div>
                          <p className={tier.featured ? 'text-sm font-semibold text-white/70' : 'text-sm font-semibold text-circleTel-orange-accessible'}>
                            {tier.audience}
                          </p>
                          <h3 className="mt-2 text-2xl font-bold">{tier.name}</h3>
                        </div>
                        <div className="flex items-center gap-3">
                          {tier.featured && (
                            <Badge className="bg-circleTel-orange text-white hover:bg-circleTel-orange">
                              Growth fit
                            </Badge>
                          )}
                          <p className={tier.featured ? 'text-2xl font-bold text-white' : 'text-2xl font-bold text-circleTel-navy'}>
                            {tier.price}
                          </p>
                        </div>
                      </div>
                      <p className={tier.featured ? 'mt-5 max-w-3xl text-white/76' : 'mt-5 max-w-3xl text-circleTel-secondaryNeutral'}>
                        {tier.description}
                      </p>
                      <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                        {tier.features.map((feature) => (
                          <li key={feature} className="flex gap-3">
                            <PiCheckCircleBold className="mt-0.5 h-5 w-5 flex-none text-circleTel-orange" />
                            <span className={tier.featured ? 'text-sm leading-6 text-white/82' : 'text-sm leading-6 text-circleTel-secondaryNeutral'}>
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-16 md:py-24">
          <div className="container mx-auto grid gap-12 px-4 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="rounded-2xl border border-ui-border bg-circleTel-lightNeutral p-4 md:p-6">
              <ol className="grid gap-4">
                {cadence.map((step, index) => (
                  <li key={step} className="grid grid-cols-[48px_1fr] gap-4 rounded-xl bg-white p-5 shadow-sm">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-circleTel-navy text-sm font-bold text-white">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <p className="self-center leading-7 text-circleTel-secondaryNeutral">{step}</p>
                  </li>
                ))}
              </ol>
            </div>

            <div>
              <Badge className="mb-4 bg-circleTel-orange-light text-circleTel-orange-accessible hover:bg-circleTel-orange-light">
                Quarterly rhythm
              </Badge>
              <h2 className="text-3xl font-bold text-circleTel-navy md:text-4xl">
                Growth-ready IT is a cadence, not a one-time install.
              </h2>
              <p className="mt-5 text-lg leading-8 text-circleTel-secondaryNeutral">
                CircleTel keeps the plan practical: first stabilise the essentials, then use regular reviews to decide what changes next.
              </p>
              <div className="mt-8 grid gap-3">
                {proofPoints.map((point) => (
                  <div key={point} className="flex gap-3">
                    <PiFlagPennantBold className="mt-1 h-5 w-5 flex-none text-circleTel-orange" />
                    <p className="leading-7 text-circleTel-secondaryNeutral">{point}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-circleTel-navy py-16 text-white md:py-20">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-circleTel-orange">
                  Plan the next stage
                </p>
                <h2 className="mt-3 max-w-3xl text-3xl font-bold md:text-4xl">
                  Give your next growth phase an IT plan before the pressure arrives.
                </h2>
                <p className="mt-4 max-w-2xl text-lg leading-8 text-white/74">
                  We will review where your team is going, then recommend the support, connectivity, cloud and security stack that keeps the business moving.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Button asChild size="lg" className="bg-circleTel-orange text-white hover:bg-circleTel-orange-dark">
                  <Link href="/quotes/request">Request a growth quote</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/70 bg-transparent text-white hover:bg-white hover:text-circleTel-navy"
                >
                  <Link href="/services/mid-size">Compare mid-size IT</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
