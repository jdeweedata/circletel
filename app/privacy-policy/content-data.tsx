import { ContentPageData } from '@/lib/content/types';
import {
  PiShieldCheckBold,
  PiUserBold,
  PiDatabaseBold,
  PiShareNetworkBold,
  PiLockBold,
  PiScalesBold,
  PiGlobeBold,
  PiCookieBold,
  PiClockBold,
  PiGlobeHemisphereWestBold,
  PiNotePencilBold,
  PiPhoneBold,
  PiCheckCircleBold,
} from 'react-icons/pi';

export const privacyPolicyData: ContentPageData = {
  meta: {
    title: 'Privacy Policy',
    pageTitle: 'Privacy Policy | CircleTel',
    description:
      'CircleTel Privacy Policy — How we collect, use, and protect your personal information under POPIA.',
    lastUpdated: 'March 2026',
    canonicalPath: '/privacy-policy',
  },
  intro: {
    description:
      'CircleTel is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your information.',
  },
  keyPoints: [
    {
      icon: PiShieldCheckBold,
      title: 'POPIA compliant',
      description: 'South African privacy law',
    },
    {
      icon: PiLockBold,
      title: 'Data encrypted',
      description: 'In transit and at rest',
    },
    {
      icon: PiCheckCircleBold,
      title: 'Your rights protected',
      description: 'Access, correct, delete',
    },
  ],
  sections: [
    {
      id: 'information-we-collect',
      title: '1. Information We Collect',
      icon: PiUserBold,
      content: (
        <>
          <h3>Personal Information</h3>
          <p>We may collect personal information that you voluntarily provide, including:</p>
          <ul>
            <li>Name, email address, and phone number</li>
            <li>Business information and company details</li>
            <li>Billing and payment information</li>
            <li>Technical requirements and service preferences</li>
            <li>Communication preferences</li>
          </ul>

          <h3>Technical Information</h3>
          <p>We automatically collect certain technical information, including:</p>
          <ul>
            <li>IP addresses and device information</li>
            <li>Browser type and operating system</li>
            <li>Website usage data and analytics</li>
            <li>Cookies and similar tracking technologies</li>
          </ul>
        </>
      ),
    },
    {
      id: 'how-we-use-information',
      title: '2. How We Use Your Information',
      icon: PiDatabaseBold,
      content: (
        <>
          <p>We use the information we collect for the following purposes:</p>
          <ul>
            <li>Providing and maintaining our IT services and connectivity solutions</li>
            <li>Processing payments and managing billing</li>
            <li>Communicating with you about services, updates, and support</li>
            <li>Improving our services and developing new offerings</li>
            <li>Ensuring network security and preventing fraud</li>
            <li>Complying with legal obligations and regulatory requirements</li>
            <li>Marketing our services (with your consent where required)</li>
          </ul>
        </>
      ),
    },
    {
      id: 'information-sharing',
      title: '3. Information Sharing and Disclosure',
      icon: PiShareNetworkBold,
      content: (
        <>
          <p>We may share your information in the following circumstances:</p>
          <ul>
            <li>
              <strong>Service Providers:</strong> With third-party vendors who help us provide our services
            </li>
            <li>
              <strong>Business Partners:</strong> With authorized partners for service delivery and support
            </li>
            <li>
              <strong>Legal Requirements:</strong> When required by law or to protect our rights
            </li>
            <li>
              <strong>Business Transfers:</strong> In connection with mergers, acquisitions, or asset sales
            </li>
            <li>
              <strong>Consent:</strong> With your explicit consent for specific purposes
            </li>
          </ul>
        </>
      ),
    },
    {
      id: 'data-security',
      title: '4. Data Security',
      icon: PiLockBold,
      content: (
        <>
          <p>
            We implement appropriate technical and organizational measures to protect your personal information against
            unauthorized access, alteration, disclosure, or destruction. These measures include:
          </p>
          <ul>
            <li>Encryption of data in transit and at rest</li>
            <li>Regular security assessments and audits</li>
            <li>Access controls and authentication measures</li>
            <li>Employee training on data protection</li>
            <li>Incident response procedures</li>
          </ul>
        </>
      ),
    },
    {
      id: 'your-rights',
      title: '5. Your Rights Under POPI Act',
      icon: PiScalesBold,
      content: (
        <>
          <p>
            Under South Africa&apos;s Protection of Personal Information Act (POPI Act), you have the following rights:
          </p>
          <ul>
            <li>
              <strong>Access:</strong> Request access to your personal information
            </li>
            <li>
              <strong>Correction:</strong> Request correction of inaccurate information
            </li>
            <li>
              <strong>Deletion:</strong> Request deletion of your personal information
            </li>
            <li>
              <strong>Objection:</strong> Object to processing of your personal information
            </li>
            <li>
              <strong>Portability:</strong> Request transfer of your information
            </li>
            <li>
              <strong>Withdraw Consent:</strong> Withdraw previously given consent
            </li>
          </ul>
        </>
      ),
    },
    {
      id: 'third-party-services',
      title: '6. Third-Party Services',
      icon: PiGlobeBold,
      content: (
        <>
          <p>
            We use trusted third-party services to provide and improve our platform. These services may process your
            data as described below:
          </p>

          <h3>Google Services</h3>
          <p>
            CircleTel&apos;s use and transfer of information received from Google APIs adheres to the{' '}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-circleTel-orange hover:underline"
            >
              Google API Services User Data Policy
            </a>
            , including the Limited Use requirements.
          </p>
          <ul>
            <li>
              <strong>Google Sign-In:</strong> When you choose to sign in with Google, we access your email address and
              display name solely to create and manage your CircleTel account. We do not access your Google contacts,
              calendar, or any other Google services.
            </li>
            <li>
              <strong>Google Maps &amp; Places:</strong> We use Google Maps to verify your service address and check
              fibre/wireless coverage availability. Your address is sent to Google&apos;s geocoding service to convert
              it to geographic coordinates. This data is used only for coverage verification and is not stored beyond
              what is necessary for service delivery.
            </li>
          </ul>
          <p>
            For more information about how Google handles your data, please review{' '}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-circleTel-orange hover:underline"
            >
              Google&apos;s Privacy Policy
            </a>
            .
          </p>

          <h3>Payment Processing</h3>
          <p>
            We use NetCash, a South African payment gateway, to process payments securely. Your payment information is
            transmitted directly to NetCash and is not stored on our servers. NetCash is PCI-DSS compliant.
          </p>

          <h3>Authentication &amp; Database</h3>
          <p>
            We use Supabase for secure user authentication and data storage. Your account credentials are encrypted and
            stored securely in compliance with industry standards.
          </p>
        </>
      ),
    },
    {
      id: 'cookies',
      title: '7. Cookies and Tracking Technologies',
      icon: PiCookieBold,
      content: (
        <>
          <p>
            We use cookies and similar technologies to improve your browsing experience, analyze website traffic, and
            personalize content. You can control cookie preferences through your browser settings.
          </p>
        </>
      ),
    },
    {
      id: 'data-retention',
      title: '8. Data Retention',
      icon: PiClockBold,
      content: (
        <>
          <p>
            We retain your personal information for as long as necessary to fulfill the purposes outlined in this
            policy, comply with legal obligations, resolve disputes, and enforce our agreements. Specific retention
            periods may vary based on the type of information and applicable legal requirements.
          </p>
        </>
      ),
    },
    {
      id: 'international-transfers',
      title: '9. International Data Transfers',
      icon: PiGlobeHemisphereWestBold,
      content: (
        <>
          <p>
            Your information may be transferred to and processed in countries other than South Africa. We ensure
            appropriate safeguards are in place to protect your information in accordance with applicable data
            protection laws.
          </p>
        </>
      ),
    },
    {
      id: 'policy-changes',
      title: '10. Changes to This Policy',
      icon: PiNotePencilBold,
      content: (
        <>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any material changes by posting
            the new policy on our website and updating the &quot;Last updated&quot; date. Your continued use of our
            services after such changes constitutes acceptance of the updated policy.
          </p>
        </>
      ),
    },
    {
      id: 'contact',
      title: '11. Contact Information',
      icon: PiPhoneBold,
      content: (
        <>
          <p>If you have questions about this Privacy Policy or wish to exercise your rights, please contact us:</p>
          <div className="mt-4 space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p>
              <strong>Email:</strong> privacy@circletel.co.za
            </p>
            <p>
              <strong>WhatsApp:</strong> 082 487 3900
            </p>
            <p>
              <strong>Address:</strong> CircleTel (Pty) Ltd, Johannesburg, South Africa
            </p>
            <p>
              <strong>Information Officer:</strong> privacy-officer@circletel.co.za
            </p>
          </div>
        </>
      ),
    },
  ],
};
