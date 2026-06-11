import Link from 'next/link';
import type { Metadata } from 'next';
import {
  PiArrowRightBold,
  PiBriefcaseBold,
  PiCheckCircleBold,
  PiClipboardTextBold,
  PiEnvelopeBold,
  PiFileTextBold,
  PiHandshakeBold,
  PiMapPinAreaBold,
  PiShieldCheckBold,
} from 'react-icons/pi';

import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Client Forms | CircleTel',
  description:
    'Find CircleTel quote requests, contact forms, partner onboarding and client-specific audit forms in one place.',
};

const formCategories = [
  {
    icon: PiClipboardTextBold,
    label: 'Quote requests',
    copy: 'Send the details we need to recommend connectivity, managed IT or a bundled solution.',
  },
  {
    icon: PiMapPinAreaBold,
    label: 'Site and service checks',
    copy: 'Capture location, current provider and service context so the team can assess the next step.',
  },
  {
    icon: PiShieldCheckBold,
    label: 'Client-specific audits',
    copy: 'Structured forms for projects where rollout, migration or contract data needs to be consistent.',
  },
  {
    icon: PiHandshakeBold,
    label: 'Partner onboarding',
    copy: 'Partner and supplier-facing forms that help CircleTel route the right commercial workflow.',
  },
];

const primaryForms = [
  {
    title: 'Request a Quote',
    href: '/quotes/request',
    icon: PiBriefcaseBold,
    badge: 'Most used',
    description:
      'For businesses that want pricing on connectivity, Managed IT, CloudWiFi, mobile or service bundles.',
    details: ['Business details', 'Service interest', 'Location and contact context'],
  },
  {
    title: 'Contact CircleTel',
    href: '/contact',
    icon: PiEnvelopeBold,
    badge: 'General',
    description:
      'For support, sales questions, supplier enquiries or requests that do not fit a specialist form yet.',
    details: ['Sales or support route', 'Message details', 'Team follow-up'],
  },
  {
    title: 'Partner Onboarding',
    href: '/partner/onboarding',
    icon: PiHandshakeBold,
    badge: 'Partners',
    description:
      'For partners preparing to work with CircleTel through referral, reseller or delivery channels.',
    details: ['Company details', 'Compliance information', 'Partnership context'],
  },
];

const clientForms = [
  {
    title: 'Unjani Contract Audit',
    href: '/forms/unjani/contract-audit',
    icon: PiFileTextBold,
    client: 'Unjani Clinic Network',
    description:
      'Collect current provider, contract, site-access and contact information for clinic migration planning.',
  },
];

const routingNotes = [
  'Use the quote form when the request needs pricing or package recommendations.',
  'Use the contact form when the request is support-led or does not fit a specialist form.',
  'Use client-specific forms only for the named rollout or audit workflow.',
  'Sensitive customer information should only be submitted through the relevant secure workflow.',
];

export default function FormsPage() {
  return (
    <div className="min-h-screen bg-circleTel-lightNeutral text-circleTel-navy">
      <Navbar />

      <main>
        <section className="relative overflow-hidden bg-circleTel-navy text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(232,122,30,0.3),transparent_30%),linear-gradient(135deg,rgba(15,20,39,0.95),rgba(27,42,74,0.97))]" />
          <div className="container relative mx-auto grid min-h-[620px] items-center gap-12 px-4 py-20 lg:grid-cols-[1fr_0.95fr] lg:py-28">
            <div className="max-w-3xl">
              <Badge className="mb-5 bg-white/12 text-white ring-1 ring-white/25 hover:bg-white/12">
                Client forms hub
              </Badge>
              <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-normal text-white sm:text-5xl lg:text-6xl">
                Find the right CircleTel form without chasing links.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/82 sm:text-xl">
                Use this hub for quote requests, contact workflows, partner onboarding and client-specific audit forms.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="bg-circleTel-orange text-white hover:bg-circleTel-orange-dark">
                  <Link href="/quotes/request">
                    Start a quote request
                    <PiArrowRightBold className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/70 bg-white/5 text-white hover:bg-white hover:text-circleTel-navy"
                >
                  <Link href="/contact">Contact the team</Link>
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-white/16 bg-white/10 p-5 shadow-2xl backdrop-blur">
              <div className="rounded-xl bg-white p-6 text-circleTel-navy">
                <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.08em] text-circleTel-orange">
                      Form routing
                    </p>
                    <h2 className="mt-1 text-2xl font-bold">What this hub covers</h2>
                  </div>
                  <PiFileTextBold className="h-12 w-12 text-circleTel-orange" />
                </div>

                <div className="mt-6 grid gap-4">
                  {formCategories.map((item) => {
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
                Common workflows
              </Badge>
              <h2 className="text-3xl font-bold text-circleTel-navy md:text-4xl">
                Start with the form that matches the request.
              </h2>
              <p className="mt-4 text-lg leading-8 text-circleTel-secondaryNeutral">
                These are the main public workflows available today for customers, prospects and partners.
              </p>
            </div>

            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {primaryForms.map((form) => {
                const Icon = form.icon;

                return (
                  <Link key={form.title} href={form.href} className="group block">
                    <Card className="h-full border-ui-border bg-white shadow-sm transition duration-200 group-hover:-translate-y-1 group-hover:border-circleTel-orange/40 group-hover:shadow-lg">
                      <CardContent className="flex h-full flex-col p-7">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-circleTel-orange-light text-circleTel-orange">
                            <Icon className="h-7 w-7" />
                          </div>
                          <Badge className="bg-circleTel-orange-light text-circleTel-orange-accessible hover:bg-circleTel-orange-light">
                            {form.badge}
                          </Badge>
                        </div>
                        <h3 className="mt-6 text-2xl font-bold text-circleTel-navy">{form.title}</h3>
                        <p className="mt-3 leading-7 text-circleTel-secondaryNeutral">{form.description}</p>
                        <ul className="mt-6 space-y-3">
                          {form.details.map((detail) => (
                            <li key={detail} className="flex gap-3">
                              <PiCheckCircleBold className="mt-0.5 h-5 w-5 flex-none text-circleTel-orange" />
                              <span className="text-sm leading-6 text-circleTel-secondaryNeutral">{detail}</span>
                            </li>
                          ))}
                        </ul>
                        <span className="mt-7 inline-flex items-center text-sm font-semibold text-circleTel-orange">
                          Open form
                          <PiArrowRightBold className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
                        </span>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container mx-auto grid gap-12 px-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div className="lg:sticky lg:top-32">
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-circleTel-orange-accessible">
                Client-specific forms
              </p>
              <h2 className="mt-3 text-3xl font-bold text-circleTel-navy md:text-4xl">
                Structured forms for named rollout work.
              </h2>
              <p className="mt-5 text-lg leading-8 text-circleTel-secondaryNeutral">
                Some forms are tied to a client project or migration workflow. Use these only when the request belongs to that programme.
              </p>
            </div>

            <div className="grid gap-6">
              {clientForms.map((form) => {
                const Icon = form.icon;

                return (
                  <Link key={form.title} href={form.href} className="group block">
                    <Card className="border-ui-border bg-white shadow-sm transition duration-200 group-hover:-translate-y-1 group-hover:border-circleTel-orange/40 group-hover:shadow-lg">
                      <CardContent className="grid gap-6 p-7 md:grid-cols-[64px_1fr_auto] md:items-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-circleTel-orange-light text-circleTel-orange">
                          <Icon className="h-8 w-8" />
                        </div>
                        <div>
                          <Badge className="mb-3 bg-circleTel-orange-light text-circleTel-orange-accessible hover:bg-circleTel-orange-light">
                            {form.client}
                          </Badge>
                          <h3 className="text-2xl font-bold text-circleTel-navy">{form.title}</h3>
                          <p className="mt-3 leading-7 text-circleTel-secondaryNeutral">{form.description}</p>
                        </div>
                        <span className="inline-flex items-center text-sm font-semibold text-circleTel-orange">
                          Open
                          <PiArrowRightBold className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
                        </span>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-white py-16 md:py-24">
          <div className="container mx-auto grid gap-12 px-4 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <Badge className="mb-4 bg-circleTel-orange-light text-circleTel-orange-accessible hover:bg-circleTel-orange-light">
                Before you submit
              </Badge>
              <h2 className="text-3xl font-bold text-circleTel-navy md:text-4xl">
                A little routing discipline keeps follow-up faster.
              </h2>
              <p className="mt-5 text-lg leading-8 text-circleTel-secondaryNeutral">
                If you are unsure which form to use, send a general contact request and the team will route it internally.
              </p>
            </div>

            <div className="rounded-2xl border border-ui-border bg-circleTel-lightNeutral p-4 md:p-6">
              <div className="grid gap-4">
                {routingNotes.map((note, index) => (
                  <div key={note} className="grid grid-cols-[48px_1fr] gap-4 rounded-xl bg-white p-5 shadow-sm">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-circleTel-navy text-sm font-bold text-white">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <p className="self-center leading-7 text-circleTel-secondaryNeutral">{note}</p>
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
                  Need help choosing?
                </p>
                <h2 className="mt-3 max-w-3xl text-3xl font-bold md:text-4xl">
                  Send the request and we will route it to the right team.
                </h2>
                <p className="mt-4 max-w-2xl text-lg leading-8 text-white/74">
                  The fastest path is usually a quote request for new services, or the contact form for support and general questions.
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
                  <Link href="/contact">Contact CircleTel</Link>
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
