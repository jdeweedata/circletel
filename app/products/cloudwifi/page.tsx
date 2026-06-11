import Link from 'next/link';
import type { Metadata } from 'next';
import {
  PiArrowRightBold,
  PiBuildingsBold,
  PiChartBarBold,
  PiCheckCircleBold,
  PiClipboardTextBold,
  PiCloudBold,
  PiDevicesBold,
  PiDoorOpenBold,
  PiGraduationCapBold,
  PiHeartbeatBold,
  PiMapPinAreaBold,
  PiShieldCheckBold,
  PiStorefrontBold,
  PiUsersThreeBold,
  PiWifiHighBold,
} from 'react-icons/pi';

import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'CloudWiFi Managed Wi-Fi as a Service | CircleTel',
  description:
    'Managed venue Wi-Fi for hospitality, retail, property, healthcare and education sites with survey-led access point design.',
};

const managedStack = [
  {
    icon: PiMapPinAreaBold,
    label: 'Site survey and AP design',
    copy: 'The package is based on access point count and coverage design, not guesswork or budget shortcuts.',
  },
  {
    icon: PiWifiHighBold,
    label: 'Wi-Fi 6 access points',
    copy: 'Reyee Wi-Fi 6 APs, MikroTik or Reyee gateways and Ruijie Cloud management.',
  },
  {
    icon: PiShieldCheckBold,
    label: 'Guest and staff separation',
    copy: 'Network segmentation, guest access and policy controls designed around the venue workflow.',
  },
  {
    icon: PiCloudBold,
    label: 'Ongoing cloud management',
    copy: 'CircleTel owns, monitors and manages the hardware, with refresh planning included in the service model.',
  },
];

const venueTypes = [
  {
    icon: PiDoorOpenBold,
    title: 'Hospitality',
    description:
      'Guest Wi-Fi for lodges, boutique hotels, restaurants and conference spaces with captive portal options.',
  },
  {
    icon: PiStorefrontBold,
    title: 'Retail',
    description:
      'Store and shopping-centre Wi-Fi with staff/guest separation, analytics and optional signage VLANs.',
  },
  {
    icon: PiBuildingsBold,
    title: 'Property',
    description:
      'Managed connectivity for tenant spaces, common areas, reception zones and multi-tenant buildings.',
  },
  {
    icon: PiHeartbeatBold,
    title: 'Healthcare',
    description:
      'Patient and staff Wi-Fi patterns with isolation and POPIA-conscious handling of guest access.',
  },
  {
    icon: PiGraduationCapBold,
    title: 'Education',
    description:
      'Campus and school Wi-Fi with content filtering and controlled access for learners, staff and visitors.',
  },
  {
    icon: PiUsersThreeBold,
    title: 'Public venues',
    description:
      'High-footfall Wi-Fi for waiting rooms, events, halls and service areas where user experience matters.',
  },
];

const tiers = [
  {
    name: 'Essential',
    venue: 'Up to 300 sqm',
    aps: '1-2 APs',
    price: 'From R1,499/mo',
    description: 'For smaller venues that need reliable managed guest and staff Wi-Fi.',
    features: ['Site survey', 'Managed APs', 'Guest network', 'Cloud monitoring'],
  },
  {
    name: 'Professional',
    venue: '300-800 sqm',
    aps: '3-5 APs',
    price: 'From R3,499/mo',
    description: 'For busy venues with more users, more rooms and stronger segmentation needs.',
    features: ['Multi-zone design', 'Staff and guest separation', 'Performance monitoring', 'Upgrade path for captive portal'],
    featured: true,
  },
  {
    name: 'Enterprise',
    venue: '800-2,000 sqm',
    aps: '6-12 APs',
    price: 'From R7,999/mo',
    description: 'For larger sites that need consistent coverage, reporting and operational support.',
    features: ['Higher-density AP design', 'Advanced segmentation', 'Reporting review', 'Optional failover'],
  },
  {
    name: 'Campus',
    venue: 'Large campus sites',
    aps: '12-30+ APs',
    price: 'From R14,999/mo',
    description: 'For schools, estates, property groups and multi-building venues.',
    features: ['Campus coverage plan', 'Phased rollout', 'Content filtering options', 'Custom quote and survey'],
  },
];

const addOns = [
  {
    icon: PiClipboardTextBold,
    label: 'Captive portal',
    detail: 'Branded sign-in, guest journeys and optional ThinkWiFi or PowerLynx integrations.',
  },
  {
    icon: PiChartBarBold,
    label: 'Analytics',
    detail: 'Usage and performance views for venue teams that need more than uptime checks.',
  },
  {
    icon: PiDevicesBold,
    label: 'Failover',
    detail: 'LTE/5G backup connectivity for venues where Wi-Fi downtime affects trading.',
  },
  {
    icon: PiShieldCheckBold,
    label: 'Content filtering',
    detail: 'Policy controls for education, family venues and managed public-access environments.',
  },
];

const process = [
  'Confirm the venue type, floor area, user density, backhaul and guest-access requirements.',
  'Run the site survey and design the access point count, placement and network segmentation.',
  'Install and configure CircleTel-owned APs, gateway, VLANs, guest access and monitoring.',
  'Manage the network through Ruijie Cloud with reviews, changes and add-ons handled through CircleTel.',
];

export default function CloudWiFiPage() {
  return (
    <div className="min-h-screen bg-circleTel-lightNeutral text-circleTel-navy">
      <Navbar />

      <main>
        <section className="relative overflow-hidden bg-circleTel-navy text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_84%_16%,rgba(232,122,30,0.34),transparent_30%),linear-gradient(135deg,rgba(15,20,39,0.95),rgba(27,42,74,0.97))]" />
          <div className="container relative mx-auto grid min-h-[660px] items-center gap-12 px-4 py-20 lg:grid-cols-[1fr_0.95fr] lg:py-28">
            <div className="max-w-3xl">
              <Badge className="mb-5 bg-white/12 text-white ring-1 ring-white/25 hover:bg-white/12">
                Managed Wi-Fi as a Service
              </Badge>
              <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-normal text-white sm:text-5xl lg:text-6xl">
                CloudWiFi for venues that cannot afford messy guest Wi-Fi.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/82 sm:text-xl">
                CircleTel designs, installs and manages venue Wi-Fi for hospitality, retail, property, healthcare and education sites, with hardware owned and managed by us.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="bg-circleTel-orange text-white hover:bg-circleTel-orange-dark">
                  <Link href="/quotes/request">
                    Request a site survey
                    <PiArrowRightBold className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/70 bg-white/5 text-white hover:bg-white hover:text-circleTel-navy"
                >
                  <Link href="/resources/wifi-toolkit">Open Wi-Fi toolkit</Link>
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-white/16 bg-white/10 p-5 shadow-2xl backdrop-blur">
              <div className="rounded-xl bg-white p-6 text-circleTel-navy">
                <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.08em] text-circleTel-orange">
                      Managed venue Wi-Fi
                    </p>
                    <h2 className="mt-1 text-2xl font-bold">What CircleTel runs for you</h2>
                  </div>
                  <PiWifiHighBold className="h-12 w-12 text-circleTel-orange" />
                </div>

                <div className="mt-6 grid gap-4">
                  {managedStack.map((item) => {
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
                Designed around the venue
              </Badge>
              <h2 className="text-3xl font-bold text-circleTel-navy md:text-4xl">
                Guest Wi-Fi is part of the customer experience.
              </h2>
              <p className="mt-4 text-lg leading-8 text-circleTel-secondaryNeutral">
                The right design changes by venue type, user density, guest journey and whether the Wi-Fi carries operations, customers or both.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {venueTypes.map((venue) => {
                const Icon = venue.icon;

                return (
                  <Card key={venue.title} className="border-ui-border bg-white shadow-sm">
                    <CardContent className="p-7">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-circleTel-orange-light text-circleTel-orange">
                        <Icon className="h-7 w-7" />
                      </div>
                      <h3 className="mt-6 text-xl font-bold text-circleTel-navy">{venue.title}</h3>
                      <p className="mt-3 leading-7 text-circleTel-secondaryNeutral">{venue.description}</p>
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
                  Survey-led tiers
                </p>
                <h2 className="mt-3 text-3xl font-bold text-circleTel-navy md:text-4xl">
                  Pricing follows the access point design.
                </h2>
              </div>
              <p className="max-w-xl text-circleTel-secondaryNeutral">
                A site survey is mandatory because walls, floor area, density and backhaul matter. If the design exceeds the tier, the package moves up.
              </p>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-4">
              {tiers.map((tier) => (
                <Card
                  key={tier.name}
                  className={
                    tier.featured
                      ? 'border-circleTel-navy bg-circleTel-navy text-white shadow-2xl'
                      : 'border-ui-border bg-white shadow-sm'
                  }
                >
                  <CardContent className="flex h-full flex-col p-7">
                    <p className={tier.featured ? 'text-sm font-semibold text-white/70' : 'text-sm font-semibold text-circleTel-orange-accessible'}>
                      {tier.venue}
                    </p>
                    <div className="mt-2 flex items-start justify-between gap-3">
                      <h3 className="text-2xl font-bold">{tier.name}</h3>
                      {tier.featured && (
                        <Badge className="bg-circleTel-orange text-white hover:bg-circleTel-orange">
                          Popular
                        </Badge>
                      )}
                    </div>
                    <p className={tier.featured ? 'mt-2 text-sm font-semibold text-white/70' : 'mt-2 text-sm font-semibold text-circleTel-secondaryNeutral'}>
                      {tier.aps}
                    </p>
                    <p className={tier.featured ? 'mt-5 text-white/74' : 'mt-5 text-circleTel-secondaryNeutral'}>
                      {tier.description}
                    </p>
                    <p className={tier.featured ? 'mt-7 text-3xl font-bold text-white' : 'mt-7 text-3xl font-bold text-circleTel-navy'}>
                      {tier.price}
                    </p>
                    <ul className="mt-7 space-y-3">
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
        </section>

        <section className="bg-white py-16 md:py-24">
          <div className="container mx-auto grid gap-12 px-4 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <Badge className="mb-4 bg-circleTel-orange-light text-circleTel-orange-accessible hover:bg-circleTel-orange-light">
                Add-ons and control
              </Badge>
              <h2 className="text-3xl font-bold text-circleTel-navy md:text-4xl">
                Add the guest journey and resilience your venue needs.
              </h2>
              <p className="mt-5 text-lg leading-8 text-circleTel-secondaryNeutral">
                CloudWiFi can stay simple, or it can support branded portals, analytics, backup connectivity and controlled public access.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {addOns.map((addOn) => {
                  const Icon = addOn.icon;

                  return (
                    <div key={addOn.label} className="rounded-xl border border-ui-border bg-white p-5 shadow-sm">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-circleTel-orange-light text-circleTel-orange">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="mt-4 font-bold text-circleTel-navy">{addOn.label}</h3>
                      <p className="mt-2 text-sm leading-6 text-circleTel-secondaryNeutral">{addOn.detail}</p>
                    </div>
                  );
                })}
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
                  Start with the site
                </p>
                <h2 className="mt-3 max-w-3xl text-3xl font-bold md:text-4xl">
                  Find the right CloudWiFi tier before you buy hardware.
                </h2>
                <p className="mt-4 max-w-2xl text-lg leading-8 text-white/74">
                  We will survey the venue, confirm the AP count and design the managed Wi-Fi stack around how people actually use the space.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Button asChild size="lg" className="bg-circleTel-orange text-white hover:bg-circleTel-orange-dark">
                  <Link href="/quotes/request">Request a CloudWiFi quote</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/70 bg-transparent text-white hover:bg-white hover:text-circleTel-navy"
                >
                  <Link href="/connectivity/wifi-as-a-service">View Wi-Fi as a Service</Link>
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
