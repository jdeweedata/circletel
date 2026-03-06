import {
  PiMapPinBold,
  PiCurrencyCircleDollarBold,
  PiWrenchBold,
  PiRocketBold,
  PiFileTextBold,
  PiHeadsetBold,
  PiBuildingsBold,
} from 'react-icons/pi';
import type { IconType } from 'react-icons';

// =============================================================================
// Types
// =============================================================================

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface FAQCategory {
  id: string;
  title: string;
  description: string;
  icon: IconType;
  faqs: FAQItem[];
}

// =============================================================================
// FAQ Data
// =============================================================================

export const faqCategories: FAQCategory[] = [
  // ---------------------------------------------------------------------------
  // 1. Coverage & Availability
  // ---------------------------------------------------------------------------
  {
    id: 'coverage',
    title: 'Coverage & Availability',
    description: 'Check if CircleTel fibre and wireless internet is available in your area',
    icon: PiMapPinBold,
    faqs: [
      {
        id: 'coverage-1',
        question: 'Is CircleTel available in my area?',
        answer:
          'CircleTel provides fibre and wireless internet across major South African metros including Johannesburg, Cape Town, Durban, and Pretoria. We also cover many suburban areas and business parks. Use our online coverage checker by entering your address to instantly see which speeds and technologies are available at your location. Coverage varies by area, with fibre available in established suburbs and fixed wireless (5G/LTE) extending our reach to areas without fibre infrastructure.',
      },
      {
        id: 'coverage-2',
        question: 'What internet technologies does CircleTel offer?',
        answer:
          'We offer multiple connectivity options to suit your location and needs. Fibre-to-the-Home (FTTH) delivers speeds up to 1Gbps in covered areas. Fixed Wireless Access using 5G and LTE provides reliable connections where fibre is not yet available. For business parks and commercial complexes, we deploy 60GHz mmWave technology for dedicated high-capacity links. Our coverage checker will show exactly which options are available at your specific address in Johannesburg, Cape Town, Durban, Pretoria, and surrounding areas.',
      },
      {
        id: 'coverage-3',
        question: 'How do I check coverage at my address in Johannesburg or Cape Town?',
        answer:
          'Visit our website and use the coverage checker on the homepage. Simply enter your street address, and our system will instantly query multiple network databases to show available speeds and technologies. For Johannesburg, we cover areas including Sandton, Rosebank, Midrand, Fourways, and the greater Johannesburg metro. In Cape Town, we service the CBD, Southern Suburbs, Northern Suburbs, and the Atlantic Seaboard. Results typically appear within seconds.',
      },
      {
        id: 'coverage-4',
        question: 'What if fibre is not available at my location?',
        answer:
          'If fibre is not yet available at your address, we offer Fixed Wireless Access (FWA) solutions using 5G or LTE technology. These wireless options provide speeds from 25Mbps to 100Mbps depending on signal strength and network capacity in your area. Our team will assess your location and recommend the best alternative. You can also register your interest for fibre, and we will notify you as soon as infrastructure reaches your area in Durban, Pretoria, or other expanding coverage zones.',
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 2. Pricing & Billing
  // ---------------------------------------------------------------------------
  {
    id: 'pricing',
    title: 'Pricing & Billing',
    description: 'Transparent pricing with no hidden fees',
    icon: PiCurrencyCircleDollarBold,
    faqs: [
      {
        id: 'pricing-1',
        question: 'How much does CircleTel internet cost per month?',
        answer:
          'Our residential packages start from R799 per month for 25Mbps uncapped fibre, with options up to 1Gbps at R1,899 per month. Business packages start from R1,299 per month with enhanced SLAs and priority support. All prices include VAT and there are no hidden fees. We offer month-to-month billing with no long-term contracts required, so you only pay for what you use without being locked in.',
      },
      {
        id: 'pricing-2',
        question: 'Are there any installation or setup fees?',
        answer:
          'Standard installation is R0 for fibre connections where infrastructure already exists at your premises. For new fibre installations requiring trenching or additional work, a once-off installation fee may apply, which we quote upfront before any work begins. Fixed wireless installations are typically R0 as they only require mounting a small outdoor antenna. We never charge surprise fees - all costs are disclosed before you sign up.',
      },
      {
        id: 'pricing-3',
        question: 'What payment methods does CircleTel accept?',
        answer:
          'We accept debit orders from all major South African banks, credit card payments (Visa and Mastercard), and EFT payments. Debit orders run on the 1st of each month. For credit card and EFT payments, invoices are issued 7 days before the due date. We partner with NetCash Pay Now to provide over 20 secure payment options. Late payment fees of R150 apply if payment is not received within 7 days of the due date.',
      },
      {
        id: 'pricing-4',
        question: 'Can I upgrade or downgrade my package?',
        answer:
          'Yes, you can change your package at any time through your online account dashboard or by contacting our support team. Upgrades take effect within 24 hours for fibre connections. Downgrades apply from your next billing cycle. There are no fees for changing packages. If you upgrade mid-month, we pro-rate the difference so you only pay for the days at the higher speed.',
      },
      {
        id: 'pricing-5',
        question: 'Do you offer any discounts for annual payments?',
        answer:
          'Yes, we offer a 10% discount when you pay annually upfront instead of monthly. This applies to all residential and business packages. For example, a R999 monthly package becomes R10,789 annually (saving R1,199). Business customers with multiple sites may qualify for volume discounts - contact our business sales team for a custom quote tailored to your requirements.',
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 3. Installation & Setup
  // ---------------------------------------------------------------------------
  {
    id: 'installation',
    title: 'Installation & Setup',
    description: 'Quick professional installation, typically within 7 days',
    icon: PiWrenchBold,
    faqs: [
      {
        id: 'installation-1',
        question: 'How long does installation take?',
        answer:
          'For addresses where fibre infrastructure already exists, installation is typically completed within 5-7 business days from order confirmation. New fibre installations requiring civil works may take 2-4 weeks depending on the complexity. Fixed wireless installations are usually completed within 3-5 business days. We provide real-time installation tracking via SMS and email so you always know the status of your order.',
      },
      {
        id: 'installation-2',
        question: 'Do I need to be home for the installation?',
        answer:
          'Yes, an adult (18+) must be present during the installation appointment. Our technicians need access to install the router, configure your connection, and ensure everything works correctly. Appointments are scheduled in 2-hour windows, and our technician will call 30 minutes before arrival. If you cannot be present, you may authorize another adult to be on-site by providing their name and contact number in advance.',
      },
      {
        id: 'installation-3',
        question: 'What equipment is provided with my connection?',
        answer:
          'All CircleTel packages include a high-performance dual-band WiFi router at no extra cost. The router supports both 2.4GHz and 5GHz frequencies for optimal coverage throughout your home. For larger homes or offices, WiFi mesh extenders are available from R499 each. Fixed wireless installations include an outdoor antenna unit and indoor router. All equipment remains CircleTel property and must be returned if you cancel your service.',
      },
      {
        id: 'installation-4',
        question: 'Can I use my own router instead?',
        answer:
          'Yes, you can use your own router if you prefer. Our fibre connection terminates at an ONT (Optical Network Terminal) which provides an ethernet port for your own equipment. Simply connect your router WAN port to the ONT and configure PPPoE authentication with the credentials we provide. Our support team can assist with configuration, though we cannot guarantee optimal performance with third-party equipment.',
      },
      {
        id: 'installation-5',
        question: 'What happens if installation is delayed?',
        answer:
          'If your installation is delayed beyond the quoted timeframe due to factors within our control, we will credit your first month of service proportionally. You will receive proactive communication via SMS and email about any delays and revised timelines. Delays caused by third-party infrastructure providers (like fibre network operators) are unfortunately outside our control, but we escalate these issues and keep you informed throughout the process.',
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 4. Speed & Performance
  // ---------------------------------------------------------------------------
  {
    id: 'speed',
    title: 'Speed & Performance',
    description: 'Reliable speeds with uncapped data',
    icon: PiRocketBold,
    faqs: [
      {
        id: 'speed-1',
        question: 'Are CircleTel connections really uncapped and unshaped?',
        answer:
          'Yes, all CircleTel packages are truly uncapped with no data limits or throttling based on usage. We do not shape or prioritize traffic types - your streaming, gaming, video calls, and downloads all receive equal treatment. During peak hours (typically 6pm-10pm), you may experience slightly lower speeds due to network congestion, but we continuously invest in network capacity to minimize this.',
      },
      {
        id: 'speed-2',
        question: 'What speeds can I expect in practice?',
        answer:
          'Our fibre connections typically deliver 90-100% of the advertised speed. For example, a 100Mbps package usually achieves 90-100Mbps in speed tests. WiFi speeds may be lower depending on your device, distance from the router, and interference from walls or other electronics. For best results, use a wired ethernet connection for speed tests. Fixed wireless speeds vary based on signal strength and typically achieve 70-90% of the rated speed.',
      },
      {
        id: 'speed-3',
        question: 'Is CircleTel good for gaming and streaming?',
        answer:
          'CircleTel is excellent for gaming and streaming. Our fibre connections offer low latency (typically 5-15ms to local servers) which is crucial for competitive gaming. A 50Mbps connection comfortably supports 4K streaming on multiple devices simultaneously. For households with heavy usage - multiple gamers, streamers, and remote workers - we recommend our 200Mbps or faster packages to ensure everyone gets a smooth experience.',
      },
      {
        id: 'speed-4',
        question: 'What should I do if my connection is slow?',
        answer:
          'First, run a speed test at speedtest.net using a device connected via ethernet cable to isolate WiFi issues. If speeds are below expected, restart your router by unplugging it for 30 seconds. Check for firmware updates in your router admin panel. If problems persist, contact our support team via WhatsApp - we can remotely diagnose line issues and dispatch a technician if needed. Common causes include WiFi interference, outdated router firmware, or too many connected devices.',
      },
      {
        id: 'speed-5',
        question: 'Do you offer static IP addresses?',
        answer:
          'Yes, static IP addresses are available as an add-on for R99 per month. This is useful for hosting servers, VPN access, remote CCTV viewing, and business applications requiring a fixed IP. Static IPs are available for both fibre and fixed wireless connections. To add a static IP to your account, log into your dashboard or contact our support team. The static IP is assigned within 24 hours of request.',
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 5. Contracts & Cancellation
  // ---------------------------------------------------------------------------
  {
    id: 'contracts',
    title: 'Contracts & Cancellation',
    description: 'Month-to-month flexibility, cancel anytime',
    icon: PiFileTextBold,
    faqs: [
      {
        id: 'contracts-1',
        question: 'Does CircleTel require long-term contracts?',
        answer:
          'No, CircleTel operates on a month-to-month basis with no long-term contracts required. You are free to cancel at any time without penalties or early termination fees. We believe in earning your business every month through great service, not locking you into lengthy agreements. Some promotional offers may include optional 12 or 24-month terms with discounted pricing, but these are always clearly disclosed and optional.',
      },
      {
        id: 'contracts-2',
        question: 'How do I cancel my CircleTel service?',
        answer:
          'To cancel, simply submit a cancellation request through your online account dashboard or email support@circletel.co.za with your account number. We require 30 days notice for cancellations. Your final bill will be pro-rated to the cancellation date. Equipment (router, ONT, antenna) must be returned within 14 days of cancellation, or a replacement fee applies. Our team will arrange collection or provide a drop-off location.',
      },
      {
        id: 'contracts-3',
        question: 'What happens to my equipment when I cancel?',
        answer:
          'All CircleTel-provided equipment including routers, ONTs, and antennas must be returned within 14 days of your service end date. We will arrange a convenient collection time or provide details of nearby drop-off points. Equipment in good working condition is accepted with no charge. Damaged or unreturned equipment incurs a replacement fee: R1,500 for routers, R2,500 for ONTs, and R3,000 for wireless antennas.',
      },
      {
        id: 'contracts-4',
        question: 'Can I pause my service instead of cancelling?',
        answer:
          'Yes, we offer service suspension for up to 3 months at R99 per month. This is ideal if you are traveling or temporarily relocating. Your account, settings, and IP address (if static) are preserved during suspension. To suspend your service, contact our support team at least 7 days before your next billing date. Service can be reactivated with 48 hours notice by logging into your dashboard or contacting support.',
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 6. Support & Service
  // ---------------------------------------------------------------------------
  {
    id: 'support',
    title: 'Support & Service',
    description: 'Responsive WhatsApp support during business hours',
    icon: PiHeadsetBold,
    faqs: [
      {
        id: 'support-1',
        question: 'How do I contact CircleTel support?',
        answer:
          'The fastest way to reach us is via WhatsApp at our support number - simply send a message and our team will respond promptly. You can also email support@circletel.co.za or call our support line during business hours. Our support team operates Monday to Friday, 8am to 5pm South African time. For urgent after-hours issues affecting your connection, WhatsApp messages are monitored and critical outages are escalated to our on-call team.',
      },
      {
        id: 'support-2',
        question: 'What are your support hours?',
        answer:
          'Our support team is available Monday to Friday, 8am to 5pm (South African Standard Time). WhatsApp is our primary support channel and offers the fastest response times, typically within 30 minutes during business hours. Outside business hours, you can still send WhatsApp messages or emails, and we will respond the next business day. Network monitoring operates 24/7, and major outages trigger automatic alerts to our technical team.',
      },
      {
        id: 'support-3',
        question: 'How quickly will my issue be resolved?',
        answer:
          'We aim to respond to all support queries within 2 hours during business hours. Simple issues like password resets or billing queries are typically resolved within the same day. Technical issues requiring investigation may take 24-48 hours to diagnose and resolve. If a technician visit is required, we schedule appointments within 3 business days. You will receive ticket updates via WhatsApp or email as your issue progresses through resolution.',
      },
      {
        id: 'support-4',
        question: 'Do you offer on-site technical support?',
        answer:
          'Yes, we dispatch technicians for issues that cannot be resolved remotely. This includes hardware faults, signal problems with fixed wireless, and complex network configuration. For issues within our network, technician visits are included at no extra charge. If the fault is found to be caused by customer equipment or factors outside our control (power issues, damaged cables), a call-out fee of R500 may apply. We always confirm potential charges before dispatching.',
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 7. Business Solutions
  // ---------------------------------------------------------------------------
  {
    id: 'business',
    title: 'Business Solutions',
    description: 'Dedicated connectivity for South African businesses',
    icon: PiBuildingsBold,
    faqs: [
      {
        id: 'business-1',
        question: 'What business internet packages does CircleTel offer?',
        answer:
          'Our SkyFibre SMB packages are designed for small and medium businesses with 1-50 staff, starting from R1,299 per month for 50Mbps with a 4:1 contention ratio and business-grade SLA. For SOHO and remote workers, WorkConnect packages from R799 offer flexible home office connectivity. Enterprise customers benefit from dedicated leased lines and custom solutions. All business packages include priority support and enhanced service level agreements.',
      },
      {
        id: 'business-2',
        question: 'Do you provide SLAs for business customers?',
        answer:
          'Yes, all business packages include Service Level Agreements with guaranteed uptime and response times. Our standard business SLA guarantees 99.5% uptime with 4-hour response time for critical issues. Premium SLAs with 99.9% uptime and 2-hour response times are available for R299 per month extra. SLA credits are automatically applied to your account if we fail to meet the guaranteed service levels - no need to submit a claim.',
      },
      {
        id: 'business-3',
        question: 'Can CircleTel connect multiple office locations?',
        answer:
          'Yes, we specialize in multi-site connectivity for businesses across South Africa. Our SD-WAN solutions provide secure, managed connections between your Johannesburg, Cape Town, Durban, and Pretoria offices with centralized management. Volume discounts apply for 3 or more sites. We handle everything from network design to installation and ongoing management. Contact our business sales team for a customized multi-site proposal.',
      },
      {
        id: 'business-4',
        question: 'What is ParkConnect and who is it for?',
        answer:
          'ParkConnect DUNE is our premium connectivity solution for office parks, commercial complexes, and business estates. Using 60GHz mmWave technology, we deliver dedicated bandwidth from 100Mbps to 10Gbps per tenant. Pricing ranges from R8,500 to R85,000 per month depending on capacity requirements. ParkConnect is ideal for office parks seeking to offer differentiated connectivity to tenants, or businesses requiring carrier-grade reliability without the cost of dedicated fibre.',
      },
      {
        id: 'business-5',
        question: 'Does CircleTel offer cloud and VoIP services?',
        answer:
          'We partner with leading cloud and VoIP providers to offer bundled solutions for businesses. Our connectivity is optimized for Microsoft 365, Google Workspace, and popular VoIP platforms like 3CX and Yealink. QoS (Quality of Service) settings prioritize voice traffic to ensure crystal-clear calls. For unified communications requirements, contact our business team for a tailored solution including connectivity, hosted PBX, and cloud services.',
      },
    ],
  },
];

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Returns all FAQs flattened into a single array.
 * Useful for generating JSON-LD schema or search functionality.
 */
export function getAllFAQs(): FAQItem[] {
  return faqCategories.flatMap((category) => category.faqs);
}

/**
 * Retrieves a specific category by its ID.
 * Returns undefined if the category is not found.
 */
export function getCategoryById(categoryId: string): FAQCategory | undefined {
  return faqCategories.find((category) => category.id === categoryId);
}

/**
 * Retrieves a specific FAQ item by its ID.
 * Searches across all categories.
 */
export function getFAQById(faqId: string): FAQItem | undefined {
  return getAllFAQs().find((faq) => faq.id === faqId);
}

/**
 * Returns the total count of all FAQ items.
 */
export function getFAQCount(): number {
  return getAllFAQs().length;
}
