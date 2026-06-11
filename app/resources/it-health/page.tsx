import type { Metadata } from 'next';
import Link from 'next/link';
import {
  PiArrowRightBold,
  PiCalendarCheckBold,
  PiChartLineUpBold,
  PiCheckCircleBold,
  PiClipboardTextBold,
  PiEnvelopeBold,
  PiLockKeyBold,
  PiMagnifyingGlassBold,
  PiPhoneCallBold,
  PiShieldCheckBold,
  PiWarningCircleBold,
  PiWifiHighBold,
} from 'react-icons/pi';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { ITHealthLeadForm } from '@/components/resources/ITHealthLeadForm';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Free IT Health Assessment for South African SMEs | CircleTel',
  description:
    'Request a free IT Health Assessment for your business. CircleTel reviews your connectivity, Wi-Fi, Microsoft 365, backup, security, and IT support risks before recommending next steps.',
  keywords: [
    'IT health assessment South Africa',
    'IT audit for small business',
    'SME IT assessment',
    'managed IT assessment',
    'business IT audit',
    'Microsoft 365 security review',
    'network security assessment',
    'business backup audit',
    'CircleTel IT assessment',
  ],
  alternates: {
    canonical: '/resources/it-health',
  },
  openGraph: {
    title: 'Free IT Health Assessment for South African SMEs',
    description:
      'Find the gaps in your internet, Wi-Fi, Microsoft 365, backup, and security setup before they become expensive outages.',
    url: '/resources/it-health',
    siteName: 'CircleTel',
    type: 'website',
  },
};

const assessmentAreas = [
  {
    title: 'Connectivity and uptime',
    description: 'Review the stability of fibre, fixed wireless, failover, router setup, and service-provider risk.',
    icon: PiWifiHighBold,
  },
  {
    title: 'Security posture',
    description: 'Check practical controls across firewall, endpoint protection, email security, access, and user risk.',
    icon: PiShieldCheckBold,
  },
  {
    title: 'Microsoft 365 and identity',
    description: 'Spot risky mailbox, MFA, licence, domain, and admin-account patterns that weaken daily operations.',
    icon: PiLockKeyBold,
  },
  {
    title: 'Backup and recovery',
    description: 'Confirm where business data lives, how often it is backed up, and whether recovery is realistic.',
    icon: PiClipboardTextBold,
  },
];

const warningSignals = [
  'No clear owner for Microsoft 365, domains, devices, or backups',
  'Wi-Fi complaints keep returning after quick fixes',
  'Internet downtime interrupts card machines, calls, POS, or cloud apps',
  'Staff share passwords or work without multi-factor authentication',
  'Backup status is assumed but not tested',
  'IT invoices come from many vendors with no joined-up roadmap',
];

const processSteps = [
  {
    title: 'Request the assessment',
    description: 'Tell us about your company, team size, location, and the IT risks you already suspect.',
    icon: PiEnvelopeBold,
  },
  {
    title: 'Scope the review',
    description: 'A CircleTel specialist confirms what we should inspect first and whether an on-site audit is needed.',
    icon: PiPhoneCallBold,
  },
  {
    title: 'Assess the environment',
    description: 'We review the agreed areas across connectivity, Wi-Fi, Microsoft 365, backup, security, and support.',
    icon: PiMagnifyingGlassBold,
  },
  {
    title: 'Get a practical roadmap',
    description: 'You receive prioritised next steps that separate urgent risks from sensible improvements.',
    icon: PiChartLineUpBold,
  },
];

const faqs = [
  {
    question: 'What is an IT Health Assessment?',
    answer:
      'An IT Health Assessment is a structured review of the systems that keep a business running, including internet connectivity, Wi-Fi, Microsoft 365, backups, security controls, support processes, and vendor ownership.',
  },
  {
    question: 'Is this the same as a full technical audit?',
    answer:
      'No. The assessment request is the starting point. CircleTel first confirms the scope with your team, then recommends whether a remote review, on-site audit, or managed IT proposal is the right next step.',
  },
  {
    question: 'Who is the assessment for?',
    answer:
      'It is built for South African SMEs, multi-site teams, clinics, retail branches, offices, schools, hospitality venues, and growing companies that need clearer control over IT risk and support.',
  },
  {
    question: 'What happens after I submit the form?',
    answer:
      'Your request is sent to CircleTel as a qualified lead. A specialist reviews your details and contacts you to confirm the assessment scope before any audit work is performed.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'IT Health Assessment',
  provider: {
    '@type': 'Organization',
    name: 'CircleTel',
    url: 'https://www.circletel.co.za',
  },
  areaServed: {
    '@type': 'Country',
    name: 'South Africa',
  },
  serviceType: 'Managed IT health assessment and business IT audit scoping',
  description:
    'A lead-gated IT Health Assessment request for South African businesses covering connectivity, Wi-Fi, Microsoft 365, backup, security, and IT support risk.',
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
};

export default function ITHealthAssessmentPage() {
  return (
    <div className="min-h-screen bg-ui-bg text-ui-text-primary">
      <Navbar />

      <main>
        <HeroSection />
        <WarningSignalsSection />
        <AssessmentScopeSection />
        <ProcessSection />
        <BestFitSection />
        <FaqSection />
        <FinalCtaSection />
      </main>

      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-circleTel-navy py-16 text-white md:py-24">
      <div className="container relative mx-auto px-4">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-3xl">
            <Badge className="mb-5 rounded-full bg-circleTel-orange-light px-4 py-1.5 text-circleTel-orange-accessible hover:bg-circleTel-orange-light">
              Free IT Health Assessment request
            </Badge>
            <h1 className="font-heading text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl">
              Find the IT risks hiding inside your daily operations.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-circleTel-lightNeutral">
              Request a CircleTel IT Health Assessment before small issues become downtime, security gaps, backup failures, or expensive support surprises.
            </p>
            <HeroProofPoints />
            <HeroActions />
          </div>

          <div id="assessment-request" className="scroll-mt-28">
            <ITHealthLeadForm />
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroProofPoints() {
  return (
    <div className="mt-8 grid gap-3 sm:grid-cols-3">
      {['Connectivity', 'Security', 'Backups'].map((item) => (
        <div key={item} className="rounded-lg border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
          <PiCheckCircleBold className="mb-2 h-5 w-5 text-circleTel-orange" />
          <p className="text-sm font-semibold">{item} reviewed</p>
        </div>
      ))}
    </div>
  );
}

function HeroActions() {
  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
      <Button asChild size="lg" className="bg-circleTel-orange font-semibold text-white hover:bg-circleTel-orange-dark">
        <a href="#assessment-request">
          Request assessment <PiArrowRightBold className="ml-2 h-5 w-5" />
        </a>
      </Button>
      <Button asChild size="lg" variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white hover:text-circleTel-navy">
        <Link href="/services/security">View security services</Link>
      </Button>
    </div>
  );
}

function WarningSignalsSection() {
  return (
    <section className="bg-white py-14 md:py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase text-circleTel-orange-accessible">Why request it</p>
          <h2 className="mt-3 font-heading text-3xl font-bold text-circleTel-navy md:text-4xl">
            An IT audit should start with the right questions.
          </h2>
          <p className="mt-4 text-lg leading-8 text-circleTel-secondaryNeutral">
            Many IT problems are not one broken device. They are the result of unmanaged vendors, weak ownership, incomplete backups, and support that only reacts after the business is already affected.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {warningSignals.map((signal) => (
            <div key={signal} className="flex gap-3 rounded-lg border border-ui-border bg-ui-bg p-5">
              <PiWarningCircleBold className="mt-1 h-5 w-5 flex-shrink-0 text-circleTel-orange" />
              <p className="text-sm leading-6 text-circleTel-secondaryNeutral">{signal}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AssessmentScopeSection() {
  return (
    <section className="bg-circleTel-orange-light py-14 md:py-20">
      <div className="container mx-auto px-4">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-semibold uppercase text-circleTel-orange-accessible">Assessment scope</p>
            <h2 className="mt-3 font-heading text-3xl font-bold text-circleTel-navy md:text-4xl">
              What CircleTel checks before recommending a roadmap.
            </h2>
            <p className="mt-4 leading-7 text-circleTel-secondaryNeutral">
              The assessment is scoped around your environment. We focus on the everyday systems that affect uptime, staff productivity, and operational risk.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {assessmentAreas.map((area) => {
              const Icon = area.icon;
              return (
                <Card key={area.title} className="border-ui-border bg-white">
                  <CardContent className="p-6">
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-circleTel-orange-light text-circleTel-orange-accessible">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-heading text-xl font-bold text-circleTel-navy">{area.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-circleTel-secondaryNeutral">{area.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function ProcessSection() {
  return (
    <section className="bg-white py-14 md:py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase text-circleTel-orange-accessible">Gated process</p>
          <h2 className="mt-3 font-heading text-3xl font-bold text-circleTel-navy md:text-4xl">
            Capture first, assess properly, then act with confidence.
          </h2>
          <p className="mt-4 text-lg leading-8 text-circleTel-secondaryNeutral">
            The form is intentionally first. It gives CircleTel enough context to qualify the request and match your business with the right assessment path.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {processSteps.map((step, index) => (
            <ProcessStep key={step.title} step={step} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

type ProcessStepProps = {
  step: (typeof processSteps)[number];
  index: number;
};

function ProcessStep({ step, index }: ProcessStepProps) {
  const Icon = step.icon;

  return (
    <div className="rounded-lg border border-ui-border bg-ui-bg p-6">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-circleTel-navy text-white">
          <Icon className="h-6 w-6" />
        </div>
        <span className="font-mono text-sm font-semibold text-circleTel-orange-accessible">0{index + 1}</span>
      </div>
      <h3 className="font-heading text-lg font-bold text-circleTel-navy">{step.title}</h3>
      <p className="mt-3 text-sm leading-6 text-circleTel-secondaryNeutral">{step.description}</p>
    </div>
  );
}

function BestFitSection() {
  const customerFits = [
    'Professional offices and finance teams',
    'Clinics, practices, and healthcare sites',
    'Retail, hospitality, and branch networks',
    'Schools, training centres, and campuses',
  ];

  return (
    <section className="bg-circleTel-navy py-14 text-white md:py-20">
      <div className="container mx-auto px-4">
        <div className="grid items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-semibold uppercase text-circleTel-orange">Best fit</p>
            <h2 className="mt-3 font-heading text-3xl font-bold md:text-4xl">
              Built for South African businesses that need one accountable IT partner.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {customerFits.map((fit) => (
              <div key={fit} className="rounded-lg border border-white/15 bg-white/10 p-4">
                <PiCheckCircleBold className="mb-3 h-5 w-5 text-circleTel-orange" />
                <p className="text-sm font-semibold leading-6">{fit}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FaqSection() {
  return (
    <section className="bg-white py-14 md:py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 text-center">
            <p className="text-sm font-semibold uppercase text-circleTel-orange-accessible">FAQ</p>
            <h2 className="mt-3 font-heading text-3xl font-bold text-circleTel-navy md:text-4xl">
              IT Health Assessment questions
            </h2>
          </div>

          <div className="divide-y divide-ui-border rounded-lg border border-ui-border bg-ui-bg">
            {faqs.map((faq) => (
              <article key={faq.question} className="p-6">
                <h3 className="font-heading text-lg font-bold text-circleTel-navy">{faq.question}</h3>
                <p className="mt-3 leading-7 text-circleTel-secondaryNeutral">{faq.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCtaSection() {
  return (
    <section className="bg-circleTel-orange-light py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-start justify-between gap-6 rounded-2xl bg-white p-6 shadow-lg md:flex-row md:items-center md:p-8">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-circleTel-orange-accessible">
              <PiCalendarCheckBold className="h-5 w-5" />
              Ready to start
            </div>
            <h2 className="font-heading text-2xl font-bold text-circleTel-navy">Request your IT Health Assessment before the next outage tells you what is wrong.</h2>
          </div>
          <Button asChild size="lg" className="bg-circleTel-orange font-semibold text-white hover:bg-circleTel-orange-dark">
            <a href="#assessment-request">Start the request</a>
          </Button>
        </div>
      </div>
    </section>
  );
}
