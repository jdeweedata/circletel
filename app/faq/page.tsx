import { Metadata } from 'next';
import Link from 'next/link';
import {
  PiArrowLeftBold,
  PiEnvelopeBold,
  PiWhatsappLogoBold,
  PiMapPinBold,
  PiCheckCircleBold,
  PiClockBold,
  PiShieldCheckBold,
} from 'react-icons/pi';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { faqCategories, getAllFAQs } from './faq-data';

// =============================================================================
// Metadata
// =============================================================================

export const metadata: Metadata = {
  title: 'FAQ | CircleTel Internet South Africa - Your Questions Answered',
  description:
    'Get answers about CircleTel fibre, 5G, and LTE internet in South Africa. Coverage, pricing, installation, speeds, contracts, and support — all explained.',
  keywords: [
    'CircleTel FAQ',
    'internet South Africa',
    'fibre FAQ',
    '5G internet questions',
    'LTE internet help',
    'ISP South Africa',
  ],
  openGraph: {
    title: 'FAQ | CircleTel Internet South Africa',
    description:
      'Get answers about CircleTel fibre, 5G, and LTE internet in South Africa.',
    url: 'https://www.circletel.co.za/faq',
    type: 'website',
    siteName: 'CircleTel',
  },
  alternates: {
    canonical: 'https://www.circletel.co.za/faq',
  },
};

// =============================================================================
// JSON-LD Schema Functions
// =============================================================================

function generateFAQSchema() {
  const allFAQs = getAllFAQs();
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: allFAQs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'CircleTel',
    url: 'https://www.circletel.co.za',
    logo: 'https://www.circletel.co.za/logo.png',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+27-87-073-0000',
      contactType: 'customer service',
      areaServed: 'ZA',
      availableLanguage: 'English',
    },
  };
}

function generateSpeakableSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'CircleTel FAQ',
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['.faq-answer', '.stat-callout'],
    },
    url: 'https://www.circletel.co.za/faq',
  };
}

// =============================================================================
// Page Component
// =============================================================================

export default function FAQPage() {
  // Flatten all FAQs with global numbering
  let globalIndex = 0;

  return (
    <>
      {/* JSON-LD Structured Data - Safe: generated from static FAQ data, not user input */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateFAQSchema()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateOrganizationSchema()),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateSpeakableSchema()),
        }}
      />

      {/* Clean Header */}
      <section className="bg-gradient-to-br from-circleTel-orange via-circleTel-orange to-orange-500 text-white">
        {/* Decorative curve */}
        <div className="relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
            {/* Breadcrumb */}
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm mb-8"
            >
              <PiArrowLeftBold className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading">
              Frequently Asked Questions
            </h1>
          </div>

          {/* Curved bottom edge */}
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gray-50 rounded-t-[2rem]" />
        </div>
      </section>

      {/* Main Content - Two Column Layout */}
      <main className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">

            {/* Left Sidebar - Sticky */}
            <aside className="lg:w-80 flex-shrink-0">
              <div className="lg:sticky lg:top-24 space-y-6">

                {/* Intro Text */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <p className="text-circleTel-navy font-medium mb-4">
                    Find answers to common questions about CircleTel internet services.
                  </p>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    By using our website and services, you agree to the terms outlined
                    in our service agreement. If you have additional questions, our
                    support team is ready to help.
                  </p>
                </div>

                {/* Quick Navigation */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="font-semibold text-circleTel-navy mb-4 text-sm uppercase tracking-wide">
                    Jump to section
                  </h3>
                  <nav className="space-y-1">
                    {faqCategories.map((category) => {
                      const Icon = category.icon;
                      return (
                        <a
                          key={category.id}
                          href={`#faq-${category.id}`}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-circleTel-orange/5 hover:text-circleTel-orange transition-colors group"
                        >
                          <Icon className="w-4 h-4 text-gray-400 group-hover:text-circleTel-orange transition-colors" />
                          <span className="text-sm font-medium">{category.title}</span>
                        </a>
                      );
                    })}
                  </nav>
                </div>

                {/* Key Facts */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="font-semibold text-circleTel-navy mb-4 text-sm uppercase tracking-wide">
                    Quick facts
                  </h3>
                  <div className="space-y-4">
                    <div className="stat-callout flex items-start gap-3">
                      <PiClockBold className="w-5 h-5 text-circleTel-orange flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-circleTel-navy text-sm">3-7 days installation</p>
                        <p className="text-gray-500 text-xs">Free standard installation</p>
                      </div>
                    </div>
                    <div className="stat-callout flex items-start gap-3">
                      <PiCheckCircleBold className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-circleTel-navy text-sm">No contracts</p>
                        <p className="text-gray-500 text-xs">Cancel anytime, 30 days notice</p>
                      </div>
                    </div>
                    <div className="stat-callout flex items-start gap-3">
                      <PiShieldCheckBold className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-circleTel-navy text-sm">99.5% uptime SLA</p>
                        <p className="text-gray-500 text-xs">Business plans with guarantees</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Need Help CTA */}
                <div className="bg-circleTel-navy rounded-2xl p-6 text-white">
                  <h3 className="font-semibold mb-2">Need more help?</h3>
                  <p className="text-white/70 text-sm mb-4">
                    Our support team is available Mon-Fri, 8am-5pm.
                  </p>
                  <div className="space-y-2">
                    <a
                      href="https://wa.me/27824873900"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm hover:text-green-400 transition-colors"
                    >
                      <PiWhatsappLogoBold className="w-4 h-4" />
                      <span>082 487 3900</span>
                    </a>
                    <a
                      href="mailto:contactus@circletel.co.za"
                      className="flex items-center gap-2 text-sm hover:text-blue-400 transition-colors"
                    >
                      <PiEnvelopeBold className="w-4 h-4" />
                      <span>contactus@circletel.co.za</span>
                    </a>
                  </div>
                </div>
              </div>
            </aside>

            {/* Right Content - FAQ List */}
            <div className="flex-1 min-w-0">
              <div className="space-y-8">
                {faqCategories.map((category) => {
                  const Icon = category.icon;

                  return (
                    <section
                      key={category.id}
                      id={`faq-${category.id}`}
                      className="scroll-mt-24"
                    >
                      {/* Category Header */}
                      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-200">
                        <Icon className="w-5 h-5 text-circleTel-orange" />
                        <h2 className="text-lg font-bold text-circleTel-navy font-heading">
                          {category.title}
                        </h2>
                      </div>

                      {/* FAQ Items */}
                      <Accordion type="single" collapsible className="space-y-0">
                        {category.faqs.map((faq) => {
                          globalIndex++;
                          const questionNumber = String(globalIndex).padStart(2, '0');

                          return (
                            <AccordionItem
                              key={faq.id}
                              value={faq.id}
                              className="border-b border-gray-100 last:border-b-0"
                            >
                              <AccordionTrigger className="text-left text-circleTel-navy hover:no-underline py-5 gap-4 [&[data-state=open]]:text-circleTel-orange">
                                <div className="flex items-start gap-4 flex-1">
                                  <span className="text-gray-400 text-sm font-mono flex-shrink-0 mt-0.5">
                                    {questionNumber}.
                                  </span>
                                  <span className="font-medium text-[15px] leading-relaxed">
                                    {faq.question}
                                  </span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="faq-answer text-gray-600 leading-relaxed pl-12 pr-4 pb-5">
                                {faq.answer}
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    </section>
                  );
                })}
              </div>

              {/* Bottom CTA */}
              <div className="mt-12 bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
                <h3 className="text-xl font-bold text-circleTel-navy mb-2">
                  Ready to get started?
                </h3>
                <p className="text-gray-600 mb-6">
                  Check if CircleTel is available at your address.
                </p>
                <Link href="/">
                  <Button className="bg-circleTel-orange hover:bg-circleTel-orange/90 text-white px-8">
                    <PiMapPinBold className="w-5 h-5 mr-2" />
                    Check Coverage
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
