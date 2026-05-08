import { ServiceData, ContentSection } from './types'

/**
 * Helper function to extract plain text from Sanity portable text blocks
 */
function portableTextToString(blocks: any[]): string {
  if (!Array.isArray(blocks)) return ''
  return blocks
    .map((block) => {
      if (block._type === 'block' && Array.isArray(block.children)) {
        return block.children
          .filter((child: any) => child._type === 'span')
          .map((child: any) => child.text || '')
          .join('')
      }
      return ''
    })
    .join('\n')
    .trim()
}

export const services: ServiceData[] = [
  {
    _id: 'yFfLX69x485i4t4ksfcnZ2',
    name: 'Enterprise Managed IT Services',
    slug: 'enterprise-managed-it-services',
    category: 'managed',
    tagline: 'Enterprise-Grade IT Infrastructure Without the Complexity',
    heroImage: undefined,
    seo: {
      metaTitle: 'Enterprise Managed IT Services | CircleTel South Africa',
      metaDescription:
        'Reliable managed IT support, cloud security, and 24/7 help desk for SA enterprises. Keep your business connected and compliant with POPIA.',
    },
    benefits: [
      {
        _key: 'b1',
        title: 'Load Shedding Proof Connectivity',
        description:
          'Our data centres run on redundant power systems. We help you architect failover solutions so your operations stay online, even when the grid goes down.',
        icon: 'zap',
      },
      {
        _key: 'b2',
        title: 'POPIA Compliant Security',
        description:
          'Data sovereignty matters. Our local cloud storage and security protocols are designed to ensure your business remains fully compliant with the Protection of Personal Information Act.',
        icon: 'shield',
      },
      {
        _key: 'b3',
        title: 'Local 24/7 Support Centre',
        description:
          'Speak to local engineers who understand your context. No automated loops—just direct access to certified technicians ready to resolve issues remotely or on-site.',
        icon: 'headset',
      },
    ],
    blocks: [
      {
        _key: 'hero1',
        _type: 'heroBlock',
        headline: 'Enterprise-Grade IT Infrastructure Without the Complexity',
        subheadline:
          'From Cape Town to Johannesburg, we provide South African businesses with proactive IT support, robust cybersecurity, and seamless cloud integration designed for scale.',
        primaryCta: {
          style: 'primary',
          text: 'Schedule a Consultation',
          url: '/contact-enterprise',
        },
        variant: 'fullWidth',
      },
      {
        _key: 'features1',
        _type: 'featureGridBlock',
        headline: 'Why Leading SA Companies Partner with CircleTel',
        eyebrow: 'Why CircleTel',
        columns: 3,
        features: [
          {
            _key: 'feat1',
            title: 'Load Shedding Proof Connectivity',
            description:
              'Our data centres run on redundant power systems. We help you architect failover solutions so your operations stay online, even when the grid goes down.',
            icon: 'zap',
          },
          {
            _key: 'feat2',
            title: 'POPIA Compliant Security',
            description:
              'Data sovereignty matters. Our local cloud storage and security protocols are designed to ensure your business remains fully compliant with the Protection of Personal Information Act.',
            icon: 'shield',
          },
          {
            _key: 'feat3',
            title: 'Local 24/7 Support Centre',
            description:
              'Speak to local engineers who understand your context. No automated loops—just direct access to certified technicians ready to resolve issues remotely or on-site.',
            icon: 'headset',
          },
        ],
      },
      {
        _key: 'pricing1',
        _type: 'pricingBlock',
        headline: 'Managed IT Solutions',
        eyebrow: 'Our Packages',
        description: 'Choose the package that fits your business needs.',
        footnote:
          'Prices are indicative and depend on number of users and complexity. Contact us for a custom quote.',
        showComparison: false,
        plans: [
          {
            _key: 'plan1',
            name: 'The Stability Recipe',
            description:
              'Ideal for medium-sized enterprises needing reliable daily operations and foundational security.',
            price: 8500,
            isPopular: false,
            ctaLabel: 'Get a Quote',
            ctaUrl: '/contact',
            features: [
              'Remote Help Desk (8am - 5pm)',
              'Microsoft 365 Management',
              'Managed Endpoint Antivirus',
              'Daily Off-Site Cloud Backups',
            ],
          },
          {
            _key: 'plan2',
            name: 'The Growth Recipe',
            description:
              'A comprehensive solution for high-demand environments requiring maximum uptime and advanced threat protection.',
            price: 18500,
            isPopular: true,
            ctaLabel: 'Book Assessment',
            ctaUrl: '/contact',
            features: [
              '24/7 Priority Support & Monitoring',
              'Advanced Threat Detection (EDR)',
              'Disaster Recovery Planning',
              'Dedicated Account Manager',
              'Monthly Strategic IT Review',
            ],
          },
        ],
      },
      {
        _key: 'testimonials1',
        _type: 'testimonialBlock',
        headline: 'Trusted by SA Enterprises',
        eyebrow: 'What Our Clients Say',
        variant: 'grid',
        showRatings: false,
      },
      {
        _key: 'quotes1',
        _type: 'textBlock',
        title: 'What Our Clients Say',
        eyebrow: 'Client Success Stories',
        alignment: 'center',
        maxWidth: 'wide',
        content: portableTextToString([
          {
            _key: 'quote1',
            _type: 'block',
            style: 'blockquote',
            children: [
              {
                _key: 'q1s1',
                _type: 'span',
                marks: [],
                text: '"CircleTel migrated our email systems over a weekend with zero downtime. Their team is professional, responsive, and truly understands local business needs." — Thabo Mokoena, Mokoena Logistics',
              },
            ],
            markDefs: [],
          },
          {
            _key: 'quote2',
            _type: 'block',
            style: 'blockquote',
            children: [
              {
                _key: 'q2s1',
                _type: 'span',
                marks: [],
                text: '"Since moving to the Growth package, our cybersecurity worries have vanished. The quarterly strategy sessions have also helped us reduce our hardware costs significantly." — Sarah van der Merwe, Cape FinTech Solutions',
              },
            ],
            markDefs: [],
          },
        ]),
      },
      {
        _key: 'faq1',
        _type: 'faqBlock',
        headline: 'Frequently Asked Questions',
        eyebrow: 'Got Questions?',
        description: 'Common queries about our enterprise IT services.',
        showCategories: false,
        cta: {
          style: 'secondary',
          text: 'Still have questions? Contact us',
          url: '/contact-enterprise',
        },
        questions: [
          {
            _key: 'q1',
            question: 'What are your response times for critical issues?',
            category: 'support',
            answer: portableTextToString([
              {
                _key: 'a1',
                _type: 'block',
                style: 'normal',
                children: [
                  {
                    _key: 'a1s1',
                    _type: 'span',
                    marks: [],
                    text: 'For our Growth Recipe clients, we guarantee a 1-hour response time for critical outages, though our average response is typically under 15 minutes. We define clear SLAs to ensure your business continuity.',
                  },
                ],
                markDefs: [],
              },
            ]),
          },
          {
            _key: 'q2',
            question: 'Is my data stored in South Africa?',
            category: 'technical',
            answer: portableTextToString([
              {
                _key: 'a2',
                _type: 'block',
                style: 'normal',
                children: [
                  {
                    _key: 'a2s1',
                    _type: 'span',
                    marks: [],
                    text: 'Yes. To ensure speed and POPIA compliance, we utilise Tier 3 data centres located in Johannesburg and Cape Town. We also offer geo-redundancy options for disaster recovery.',
                  },
                ],
                markDefs: [],
              },
            ]),
          },
          {
            _key: 'q3',
            question: 'Can you take over from our current IT provider?',
            category: 'general',
            answer: portableTextToString([
              {
                _key: 'a3',
                _type: 'block',
                style: 'normal',
                children: [
                  {
                    _key: 'a3s1',
                    _type: 'span',
                    marks: [],
                    text: 'Absolutely. We have a structured onboarding process to ensure a smooth transition. We will audit your current setup, obtain necessary credentials, and document your network to prevent any service gaps.',
                  },
                ],
                markDefs: [],
              },
            ]),
          },
        ],
      },
      {
        _key: 'cta1',
        _type: 'ctaBlock',
        headline: 'Ready to transform your IT infrastructure?',
        description: 'Schedule a free consultation with our enterprise solutions team.',
        variant: 'banner',
        textColor: 'light',
        primaryButton: {
          style: 'primary',
          text: 'Schedule Consultation',
          url: '/contact-enterprise',
        },
        secondaryButton: {
          style: 'secondary',
          text: 'Download Service Guide',
          url: '/resources/enterprise-it-guide',
        },
      },
    ] as ContentSection[],
  },
]

export function getServiceBySlug(slug: string): ServiceData | undefined {
  return services.find((s) => s.slug === slug)
}
