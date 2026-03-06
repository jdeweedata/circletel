import { Metadata } from 'next';
import Link from 'next/link';
import {
  PiArrowLeftBold,
  PiQuestionBold,
  PiPhoneBold,
  PiEnvelopeBold,
  PiWhatsappLogoBold,
  PiMapPinBold,
} from 'react-icons/pi';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { faqCategories, getAllFAQs } from './faq-data';
import { CategoryNav } from '@/components/faq/CategoryNav';
import { StatCallouts } from '@/components/faq/StatCallouts';

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

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-circleTel-orange to-orange-600 text-white py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-6"
          >
            <PiArrowLeftBold className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>

          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <PiQuestionBold className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-heading">
                Frequently Asked Questions
              </h1>
              <p className="mt-4 text-lg md:text-xl text-white/90 max-w-2xl">
                Everything you need to know about CircleTel fibre, 5G, and LTE
                internet in South Africa. Find answers about coverage, pricing,
                installation, and support.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stat Callouts - Overlapping Hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
        <StatCallouts />
      </div>

      {/* Category Navigation - Sticky */}
      <CategoryNav />

      {/* FAQ Sections */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-16">
          {faqCategories.map((category) => {
            const Icon = category.icon;

            return (
              <section
                key={category.id}
                id={`faq-${category.id}`}
                className="scroll-mt-36"
              >
                {/* Category Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-circleTel-orange/10 rounded-lg">
                    <Icon className="w-6 h-6 text-circleTel-orange" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-circleTel-navy font-heading">
                      {category.title}
                    </h2>
                    <p className="text-gray-600 text-sm">{category.description}</p>
                  </div>
                </div>

                {/* Accordion */}
                <Accordion type="single" collapsible className="space-y-3">
                  {category.faqs.map((faq) => (
                    <AccordionItem
                      key={faq.id}
                      value={faq.id}
                      className="bg-white border border-gray-200 rounded-lg px-4 shadow-sm"
                    >
                      <AccordionTrigger className="text-left text-circleTel-navy hover:no-underline">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="faq-answer text-gray-700 leading-relaxed">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>
            );
          })}
        </div>
      </main>

      {/* CTA Section */}
      <section className="bg-circleTel-navy text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold font-heading mb-4">
            Still have questions?
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            Check your coverage or get in touch with our friendly support team.
            We are here to help.
          </p>

          {/* Primary CTA */}
          <Link href="/">
            <Button variant="cta" size="xl" className="mb-8">
              <PiMapPinBold className="w-5 h-5" />
              Check Your Coverage
            </Button>
          </Link>

          {/* Contact Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {/* WhatsApp */}
            <a
              href="https://wa.me/27870730000"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 p-4 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
            >
              <PiWhatsappLogoBold className="w-6 h-6 text-green-400" />
              <div className="text-left">
                <p className="font-semibold">WhatsApp</p>
                <p className="text-sm text-white/70">Quick responses</p>
              </div>
            </a>

            {/* Phone */}
            <a
              href="tel:+27870730000"
              className="flex items-center justify-center gap-3 p-4 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
            >
              <PiPhoneBold className="w-6 h-6 text-circleTel-orange" />
              <div className="text-left">
                <p className="font-semibold">087 073 0000</p>
                <p className="text-sm text-white/70">Mon-Fri 8am-5pm</p>
              </div>
            </a>

            {/* Email */}
            <a
              href="mailto:support@circletel.co.za"
              className="flex items-center justify-center gap-3 p-4 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
            >
              <PiEnvelopeBold className="w-6 h-6 text-blue-400" />
              <div className="text-left">
                <p className="font-semibold">Email Us</p>
                <p className="text-sm text-white/70">support@circletel.co.za</p>
              </div>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
