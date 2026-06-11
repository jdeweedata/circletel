import Link from 'next/link';
import type { Metadata } from 'next';
import {
  PiArrowRightBold,
  PiCheckCircleBold,
  PiCloudCheckBold,
  PiEnvelopeSimpleBold,
  PiFingerprintBold,
  PiFlagPennantBold,
  PiMonitorBold,
  PiShieldCheckBold,
  PiShieldWarningBold,
  PiWifiHighBold,
} from 'react-icons/pi';

import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Security Solutions | CircleTel',
  description:
    'Managed firewall, endpoint, email, VPN, backup and Microsoft 365 security support for South African businesses.',
};

const securityLayers = [
  {
    icon: PiWifiHighBold,
    label: 'Network edge',
    copy: 'Managed router, firewall rules, VPN access and safer connectivity baselines after the CPE is in place.',
  },
  {
    icon: PiMonitorBold,
    label: 'User devices',
    copy: 'Endpoint protection and support workflows for the devices your team uses every day.',
  },
  {
    icon: PiEnvelopeSimpleBold,
    label: 'Email and identity',
    copy: 'Microsoft 365 administration, mailbox hygiene and practical access-control habits.',
  },
  {
    icon: PiCloudCheckBold,
    label: 'Backup and recovery',
    copy: 'Cloud backup and recovery planning so security incidents do not become permanent data loss.',
  },
];

const fitSignals = [
  {
    icon: PiShieldWarningBold,
    title: 'Your security is split across vendors',
    description:
      'Firewall, internet, Microsoft 365, backup and device support all need to work together when something goes wrong.',
  },
  {
    icon: PiFingerprintBold,
    title: 'Access is getting harder to control',
    description:
      'More users, shared mailboxes, remote access and staff changes create risk if permissions are not reviewed.',
  },
  {
    icon: PiCloudCheckBold,
    title: 'Backup exists, but recovery is unclear',
    description:
      'A backup tool is not enough. The business needs to know what can be restored, how quickly and by whom.',
  },
];

const serviceOptions = [
  {
    name: 'Security Suite Module',
    audience: 'Add-on for active base services',
    price: 'From R249/mo',
    description:
      'For teams that need a practical security layer attached to an existing CircleTel connectivity or managed service.',
    features: [
      'Security baseline review',
      'Endpoint and email protection guidance',
      'Microsoft 365 access hygiene',
      'Router and firewall configuration review',
      'Escalation path for suspicious activity',
    ],
  },
  {
    name: 'Professional Security Baseline',
    audience: 'Managed IT Professional+',
    price: 'Included in managed stack',
    description:
      'For businesses that want security handled as part of the wider IT operating model.',
    features: [
      'Managed firewall from Professional tier',
      'Cloud backup and recovery planning',
      'Endpoint, email and user support workflow',
      'Security awareness from month two',
      'Quarterly risk and backup review',
    ],
    featured: true,
  },
  {
    name: 'Enterprise Governance',
    audience: 'Enterprise and regulated teams',
    price: 'Custom quote',
    description:
      'For multi-site or compliance-sensitive teams that need documentation, reporting and stronger governance.',
    features: [
      'Compliance-aware reporting',
      'VPN and multi-site access design',
      'Breach-response contact workflow',
      'Supplier coordination for complex incidents',
      'POPIA-conscious records and escalation paths',
    ],
  },
];

const process = [
  'Review your connectivity, router, Microsoft 365, endpoint, backup and user-access risks.',
  'Close the highest-risk gaps first, starting with firewall, identity, endpoint and backup basics.',
  'Train users and document escalation paths so suspicious activity is handled consistently.',
  'Review quarterly, with deeper compliance reporting reserved for Enterprise environments.',
];

const boundaries = [
  'Managed firewall and backup are part of Professional+ Managed IT',
  'Security training starts after the core service baseline is stable',
  'Compliance reporting is reserved for Enterprise scope',
  'POPIA obligations guide customer-data handling and incident escalation',
];

export default function SecuritySolutionsPage() {
  return (
    <div className="min-h-screen bg-circleTel-lightNeutral text-circleTel-navy">
      <Navbar />

      <main>
        <section className="relative overflow-hidden bg-circleTel-navy text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(232,122,30,0.32),transparent_30%),linear-gradient(135deg,rgba(15,20,39,0.95),rgba(27,42,74,0.97))]" />
          <div className="container relative mx-auto grid min-h-[660px] items-center gap-12 px-4 py-20 lg:grid-cols-[1fr_0.95fr] lg:py-28">
            <div className="max-w-3xl">
              <Badge className="mb-5 bg-white/12 text-white ring-1 ring-white/25 hover:bg-white/12">
                Managed security for business IT
              </Badge>
              <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-normal text-white sm:text-5xl lg:text-6xl">
                Security that is built into the way your office runs.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/82 sm:text-xl">
                CircleTel helps businesses connect firewall, endpoint, email, VPN, Microsoft 365 and backup into one managed security baseline.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="bg-circleTel-orange text-white hover:bg-circleTel-orange-dark">
                  <Link href="/quotes/request">
                    Request security support
                    <PiArrowRightBold className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/70 bg-white/5 text-white hover:bg-white hover:text-circleTel-navy"
                >
                  <Link href="/resources/it-health">Start with an IT health check</Link>
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-white/16 bg-white/10 p-5 shadow-2xl backdrop-blur">
              <div className="rounded-xl bg-white p-6 text-circleTel-navy">
                <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.08em] text-circleTel-orange">
                      Security layers
                    </p>
                    <h2 className="mt-1 text-2xl font-bold">What we help connect</h2>
                  </div>
                  <PiShieldCheckBold className="h-12 w-12 text-circleTel-orange" />
                </div>

                <div className="mt-6 grid gap-4">
                  {securityLayers.map((item) => {
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
                When security needs structure
              </Badge>
              <h2 className="text-3xl font-bold text-circleTel-navy md:text-4xl">
                The risk is rarely one tool. It is the gaps between tools.
              </h2>
              <p className="mt-4 text-lg leading-8 text-circleTel-secondaryNeutral">
                Security becomes easier to manage when internet, devices, users, backup and support follow one operating model.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {fitSignals.map((signal) => {
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
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-circleTel-orange-accessible">
                  Service options
                </p>
                <h2 className="mt-3 text-3xl font-bold text-circleTel-navy md:text-4xl">
                  Choose the security layer that matches your IT maturity.
                </h2>
              </div>
              <p className="max-w-xl text-circleTel-secondaryNeutral">
                Security can be added as a module or handled as part of the wider Managed IT service, depending on your current base service.
              </p>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {serviceOptions.map((option) => (
                <Card
                  key={option.name}
                  className={
                    option.featured
                      ? 'border-circleTel-navy bg-circleTel-navy text-white shadow-2xl'
                      : 'border-ui-border bg-white shadow-sm'
                  }
                >
                  <CardContent className="flex h-full flex-col p-7">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className={option.featured ? 'text-sm font-semibold text-white/70' : 'text-sm font-semibold text-circleTel-orange-accessible'}>
                          {option.audience}
                        </p>
                        <h3 className="mt-2 text-2xl font-bold">{option.name}</h3>
                      </div>
                      {option.featured && (
                        <Badge className="bg-circleTel-orange text-white hover:bg-circleTel-orange">
                          Best fit
                        </Badge>
                      )}
                    </div>
                    <p className={option.featured ? 'mt-5 text-white/74' : 'mt-5 text-circleTel-secondaryNeutral'}>
                      {option.description}
                    </p>
                    <p className={option.featured ? 'mt-7 text-3xl font-bold text-white' : 'mt-7 text-3xl font-bold text-circleTel-navy'}>
                      {option.price}
                    </p>
                    <ul className="mt-7 space-y-3">
                      {option.features.map((feature) => (
                        <li key={feature} className="flex gap-3">
                          <PiCheckCircleBold className="mt-0.5 h-5 w-5 flex-none text-circleTel-orange" />
                          <span className={option.featured ? 'text-sm leading-6 text-white/82' : 'text-sm leading-6 text-circleTel-secondaryNeutral'}>
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
          <div className="container mx-auto grid gap-12 px-4 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <Badge className="mb-4 bg-circleTel-orange-light text-circleTel-orange-accessible hover:bg-circleTel-orange-light">
                Security operating rhythm
              </Badge>
              <h2 className="text-3xl font-bold text-circleTel-navy md:text-4xl">
                We stabilise the basics before layering on governance.
              </h2>
              <p className="mt-5 text-lg leading-8 text-circleTel-secondaryNeutral">
                The sequence matters: connectivity first, then Microsoft 365, backup, firewall and user training. That keeps security practical for the team that has to use it.
              </p>
              <div className="mt-8 grid gap-3">
                {boundaries.map((point) => (
                  <div key={point} className="flex gap-3">
                    <PiFlagPennantBold className="mt-1 h-5 w-5 flex-none text-circleTel-orange" />
                    <p className="leading-7 text-circleTel-secondaryNeutral">{point}</p>
                  </div>
                ))}
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
                  Close the gaps
                </p>
                <h2 className="mt-3 max-w-3xl text-3xl font-bold md:text-4xl">
                  Turn security from a tool list into an operating baseline.
                </h2>
                <p className="mt-4 max-w-2xl text-lg leading-8 text-white/74">
                  We will review your current setup and recommend the smallest practical security layer for your team, sites and base services.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Button asChild size="lg" className="bg-circleTel-orange text-white hover:bg-circleTel-orange-dark">
                  <Link href="/quotes/request">Request a security quote</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/70 bg-transparent text-white hover:bg-white hover:text-circleTel-navy"
                >
                  <Link href="/services/growth-ready">View growth-ready IT</Link>
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
