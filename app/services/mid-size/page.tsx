import Link from 'next/link';
import type { Metadata } from 'next';
import {
  PiArrowRightBold,
  PiCheckCircleBold,
  PiCloudBold,
  PiDesktopTowerBold,
  PiHeadsetBold,
  PiLightningBold,
  PiSquaresFourBold,
  PiShieldCheckBold,
  PiTrendUpBold,
  PiUsersThreeBold,
} from 'react-icons/pi';

import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Mid-Size Business IT Services | CircleTel',
  description:
    'Managed IT, connectivity, Microsoft 365, backup and security for growing South African businesses with 10 to 50 users.',
};

const outcomes = [
  {
    icon: PiDesktopTowerBold,
    title: 'One accountable IT partner',
    description:
      'Connectivity, router, helpdesk, Microsoft 365, backup and security managed through one provider and one bill.',
  },
  {
    icon: PiShieldCheckBold,
    title: 'Security built into the stack',
    description:
      'Firewall, endpoint protection, email security and backup workflows are planned with your users and risk profile.',
  },
  {
    icon: PiTrendUpBold,
    title: 'Room to grow',
    description:
      'Support and infrastructure patterns designed for teams moving from owner-managed IT into a more formal operating model.',
  },
];

const bundles = [
  {
    name: 'Professional',
    audience: '10-25 users',
    price: 'From R5,999/mo',
    description:
      'For established teams that need reliable support, managed Microsoft 365 and practical business continuity.',
    features: [
      'Business internet and managed router',
      'IT helpdesk and device support',
      'Microsoft 365 management',
      'Managed firewall and cloud backup',
      'Security baseline and reporting',
    ],
  },
  {
    name: 'Premium',
    audience: '25-50 users',
    price: 'From R9,999/mo',
    description:
      'For growing teams that need stronger security, more proactive management and better operational visibility.',
    features: [
      'Priority support and proactive monitoring',
      'Endpoint, email and firewall protection',
      'Expanded backup and recovery planning',
      'Quarterly IT health reviews',
      'Account management for planned upgrades',
    ],
    featured: true,
  },
  {
    name: 'Enterprise Ready',
    audience: '50+ users',
    price: 'Custom quote',
    description:
      'For multi-site or regulated teams that need tailored connectivity, governance and continuity planning.',
    features: [
      'Multi-site network planning',
      'Advanced security and VPN design',
      'Compliance-aware documentation',
      'Cloud migration and hosting options',
      'Strategic roadmap sessions',
    ],
  },
];

const stack = [
  {
    icon: PiLightningBold,
    label: 'Business connectivity',
    copy: 'SkyFibre, fibre, LTE/5G failover and static IP options matched to the site.',
  },
  {
    icon: PiSquaresFourBold,
    label: 'Microsoft 365 operations',
    copy: 'Licensing, mailbox setup, user onboarding and practical productivity controls.',
  },
  {
    icon: PiCloudBold,
    label: 'Backup and recovery',
    copy: 'Cloud backup and recovery planning so key files and accounts are not left to chance.',
  },
  {
    icon: PiHeadsetBold,
    label: 'Helpdesk and support',
    copy: 'A clear support path for users, devices, connectivity issues and everyday IT requests.',
  },
];

const process = [
  'Assess users, sites, connectivity, Microsoft 365, backup and security gaps.',
  'Match the service tier to your headcount, operating hours and risk profile.',
  'Migrate the essentials first, then stabilise support, backup and reporting.',
  'Review quarterly so your IT plan keeps pace with hiring and new locations.',
];

export default function MidSizeBusinessITPage() {
  return (
    <div className="min-h-screen bg-circleTel-lightNeutral text-circleTel-navy">
      <Navbar />

      <main>
        <section className="relative overflow-hidden bg-circleTel-navy text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(232,122,30,0.28),transparent_34%),linear-gradient(135deg,rgba(15,20,39,0.92),rgba(27,42,74,0.96))]" />
          <div className="container relative mx-auto grid min-h-[640px] items-center gap-12 px-4 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
            <div className="max-w-3xl">
              <Badge className="mb-5 bg-white/12 text-white ring-1 ring-white/25 hover:bg-white/12">
                Managed IT for 10-50 user teams
              </Badge>
              <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-normal text-white sm:text-5xl lg:text-6xl">
                Mid-size business IT, managed from connectivity to cloud.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/82 sm:text-xl">
                CircleTel helps growing South African teams replace scattered vendors with one managed stack for internet, support, Microsoft 365, backup and security.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="bg-circleTel-orange text-white hover:bg-circleTel-orange-dark">
                  <Link href="/quotes/request">
                    Request an IT quote
                    <PiArrowRightBold className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/70 bg-white/5 text-white hover:bg-white hover:text-circleTel-navy"
                >
                  <Link href="/resources/it-health">Book an IT health check</Link>
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-white/16 bg-white/10 p-5 shadow-2xl backdrop-blur">
              <div className="rounded-xl bg-white p-6 text-circleTel-navy">
                <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.08em] text-circleTel-orange">Managed stack</p>
                    <h2 className="mt-1 text-2xl font-bold">What we take off your desk</h2>
                  </div>
                  <PiUsersThreeBold className="h-12 w-12 text-circleTel-orange" />
                </div>

                <div className="mt-6 grid gap-4">
                  {stack.map((item) => {
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
                Built for the messy middle
              </Badge>
              <h2 className="text-3xl font-bold text-circleTel-navy md:text-4xl">
                Enough structure for scale, without enterprise complexity.
              </h2>
              <p className="mt-4 text-lg leading-8 text-circleTel-secondaryNeutral">
                Mid-size businesses usually have too much at stake for ad-hoc IT, but not enough time to manage multiple vendors. This service is designed for that exact stage.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {outcomes.map((outcome) => {
                const Icon = outcome.icon;

                return (
                  <Card key={outcome.title} className="border-ui-border bg-white shadow-sm">
                    <CardContent className="p-7">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-circleTel-orange-light text-circleTel-orange">
                        <Icon className="h-7 w-7" />
                      </div>
                      <h3 className="mt-6 text-xl font-bold text-circleTel-navy">{outcome.title}</h3>
                      <p className="mt-3 leading-7 text-circleTel-secondaryNeutral">{outcome.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-circleTel-orange-accessible">
                  Service tiers
                </p>
                <h2 className="mt-3 text-3xl font-bold text-circleTel-navy md:text-4xl">
                  Pick the operating model that matches your team.
                </h2>
              </div>
              <p className="max-w-xl text-circleTel-secondaryNeutral">
                Pricing follows the 2026 managed IT catalogue and is refined after a short technical assessment.
              </p>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {bundles.map((bundle) => (
                <Card
                  key={bundle.name}
                  className={
                    bundle.featured
                      ? 'border-circleTel-navy bg-circleTel-navy text-white shadow-2xl'
                      : 'border-ui-border bg-white shadow-sm'
                  }
                >
                  <CardContent className="flex h-full flex-col p-7">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className={bundle.featured ? 'text-sm font-semibold text-white/70' : 'text-sm font-semibold text-circleTel-orange-accessible'}>
                          {bundle.audience}
                        </p>
                        <h3 className="mt-2 text-2xl font-bold">{bundle.name}</h3>
                      </div>
                      {bundle.featured && (
                        <Badge className="bg-circleTel-orange text-white hover:bg-circleTel-orange">
                          Best fit
                        </Badge>
                      )}
                    </div>
                    <p className={bundle.featured ? 'mt-5 text-white/74' : 'mt-5 text-circleTel-secondaryNeutral'}>
                      {bundle.description}
                    </p>
                    <p className={bundle.featured ? 'mt-7 text-3xl font-bold text-white' : 'mt-7 text-3xl font-bold text-circleTel-navy'}>
                      {bundle.price}
                    </p>
                    <ul className="mt-7 space-y-3">
                      {bundle.features.map((feature) => (
                        <li key={feature} className="flex gap-3">
                          <PiCheckCircleBold
                            className={
                              bundle.featured
                                ? 'mt-0.5 h-5 w-5 flex-none text-circleTel-orange'
                                : 'mt-0.5 h-5 w-5 flex-none text-circleTel-orange'
                            }
                          />
                          <span className={bundle.featured ? 'text-sm leading-6 text-white/82' : 'text-sm leading-6 text-circleTel-secondaryNeutral'}>
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
        </section>

        <section className="bg-white py-16 md:py-24">
          <div className="container mx-auto grid gap-12 px-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <Badge className="mb-4 bg-circleTel-orange-light text-circleTel-orange-accessible hover:bg-circleTel-orange-light">
                How onboarding works
              </Badge>
              <h2 className="text-3xl font-bold text-circleTel-navy md:text-4xl">
                We stabilise the essentials before adding more tools.
              </h2>
              <p className="mt-5 text-lg leading-8 text-circleTel-secondaryNeutral">
                The goal is not to sell a bigger stack. It is to give your team a dependable operating base, then improve it in the right order.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild className="bg-circleTel-orange text-white hover:bg-circleTel-orange-dark">
                  <Link href="/contact">Speak to a consultant</Link>
                </Button>
                <Button asChild variant="outline" className="border-circleTel-navy text-circleTel-navy hover:bg-circleTel-navy hover:text-white">
                  <Link href="/services/mid-size/medium-enterprise">View detailed legacy page</Link>
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-ui-border bg-circleTel-lightNeutral p-4 md:p-6">
              <ol className="grid gap-4">
                {process.map((step, index) => (
                  <li key={step} className="grid grid-cols-[48px_1fr] gap-4 rounded-xl bg-white p-5 shadow-sm">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-circleTel-navy text-sm font-bold text-white">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <p className="self-center leading-7 text-circleTel-secondaryNeutral">{step}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section className="bg-circleTel-navy py-16 text-white md:py-20">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-circleTel-orange">
                  Next step
                </p>
                <h2 className="mt-3 max-w-3xl text-3xl font-bold md:text-4xl">
                  Find out what your current IT setup is costing your team.
                </h2>
                <p className="mt-4 max-w-2xl text-lg leading-8 text-white/74">
                  We will review your users, sites, tools and support gaps, then recommend the smallest managed stack that gives you dependable coverage.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Button asChild size="lg" className="bg-circleTel-orange text-white hover:bg-circleTel-orange-dark">
                  <Link href="/quotes/request">Request a quote</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/70 bg-transparent text-white hover:bg-white hover:text-circleTel-navy"
                >
                  <Link href="/resources/it-health">Start with an IT health check</Link>
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
