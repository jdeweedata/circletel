import { PiEnvelopeBold, PiMapPinBold } from 'react-icons/pi';
import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/navigation/Logo';
import { CONTACT, getWhatsAppLink, formatAddressFooter } from '@/lib/constants/contact';

const SOCIAL_LINKS = [
  {
    href: 'https://www.facebook.com/circletelsa',
    label: 'CircleTel on Facebook',
    src: '/images/social/social-facebook-orange.svg',
  },
  {
    href: 'https://www.linkedin.com/company/circle-tel-sa',
    label: 'CircleTel on LinkedIn',
    src: '/images/social/social-linkedin-orange.svg',
  },
  {
    href: 'https://x.com/CircleTel',
    label: 'CircleTel on X',
    src: '/images/social/social-x-orange.svg',
  },
  {
    href: CONTACT.WHATSAPP_LINK,
    label: 'Message CircleTel on WhatsApp',
    src: '/images/social/social-whatsapp-orange.svg',
  },
] as const;

export const Footer = () => {
  return (
    <footer className="bg-circleTel-navy text-white py-12">
      <div className="container mx-auto px-4">
        {/* Contact Bar */}
        <div className="bg-circleTel-secondaryNeutral bg-opacity-20 rounded-lg p-4 mb-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 mb-4 md:mb-0">
            <a
              href={getWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center hover:text-white transition-colors"
            >
              <img
                src="/images/social/social-whatsapp-orange.svg"
                alt=""
                width={20}
                height={20}
                className="mr-2 h-5 w-5"
              />
              <span className="text-circleTel-lightNeutral">{CONTACT.WHATSAPP_NUMBER}</span>
            </a>
            <div className="flex items-center">
              <PiEnvelopeBold size={18} className="mr-2 text-circleTel-orange" />
              <span className="text-circleTel-lightNeutral">contactus@circletel.co.za</span>
            </div>
          </div>
          <Link href="/contact" className="inline-block bg-circleTel-orange text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-opacity-90 transition">
            Contact Us
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Intro */}
          <div className="col-span-1 md:col-span-1">
            <div className="bg-white rounded-md p-1 inline-block">
              <Logo variant="footer" />
            </div>
            <p className="mt-4 text-circleTel-lightNeutral">
              Making IT simple and affordable for businesses of all sizes. We provide expert IT services with a recipe for success.
            </p>
            <div className="mt-4 flex items-center gap-2">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.href}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="inline-flex rounded-full transition-opacity duration-300 hover:opacity-80"
                >
                  <img
                    src={social.src}
                    alt=""
                    width={32}
                    height={32}
                    className="h-8 w-8"
                  />
                </a>
              ))}
            </div>
          </div>

          {/* Managed IT Services */}
          <div className="col-span-1">
            <h3 className="font-bold text-lg mb-4">Managed IT</h3>
            <ul className="space-y-2">
              <li><Link href="/services" className="hover:text-circleTel-orange transition-colors">Complete IT Management</Link></li>
              <li><Link href="/services/small-business" className="hover:text-circleTel-orange transition-colors">Small Business IT</Link></li>
              <li><Link href="/services/mid-size" className="hover:text-circleTel-orange transition-colors">Mid-Size Business IT</Link></li>
              <li><Link href="/services/growth-ready" className="hover:text-circleTel-orange transition-colors">Growth-Ready IT</Link></li>
              <li><Link href="/services/security" className="hover:text-circleTel-orange transition-colors">Security Solutions</Link></li>
              <li><Link href="/pricing" className="hover:text-circleTel-orange transition-colors">Pricing</Link></li>
            </ul>
          </div>

          {/* Connectivity */}
          <div className="col-span-1">
            <h3 className="font-bold text-lg mb-4">Connectivity</h3>
            <ul className="space-y-2">
              <li><Link href="/products/skyfibre-smb" className="hover:text-circleTel-orange transition-colors">SkyFibre SMB</Link></li>
              <li><Link href="/products/workconnect-soho" className="hover:text-circleTel-orange transition-colors">WorkConnect SOHO</Link></li>
              <li><Link href="/products/cloudwifi" className="hover:text-circleTel-orange transition-colors">CloudWiFi</Link></li>
              <li><Link href="/products/bizfibreconnect" className="hover:text-circleTel-orange transition-colors">BizFibreConnect</Link></li>
              <li><Link href="/connectivity/fibre" className="hover:text-circleTel-orange transition-colors">Consumer Fibre</Link></li>
              <li><Link href="/bundles" className="hover:text-circleTel-orange transition-colors">Service Bundles</Link></li>
            </ul>
          </div>

          {/* Resources & Support */}
          <div className="col-span-1">
            <h3 className="font-bold text-lg mb-4">Resources & Support</h3>
            <ul className="space-y-2">
              <li><Link href="/resources" className="hover:text-circleTel-orange transition-colors">Resources Hub</Link></li>
              <li><Link href="/resources/it-health" className="hover:text-circleTel-orange transition-colors">IT Assessment</Link></li>
              <li><Link href="/resources/power-backup" className="hover:text-circleTel-orange transition-colors">Power Backup</Link></li>
              <li><Link href="/resources/connectivity-guide" className="hover:text-circleTel-orange transition-colors">Connectivity Guide</Link></li>
              <li><Link href="/become-a-partner" className="hover:text-circleTel-orange transition-colors">Become a Partner</Link></li>
              <li><Link href="/partner/login" className="hover:text-circleTel-orange transition-colors">Partner Login</Link></li>
              <li><Link href="/privacy-policy" className="hover:text-circleTel-orange transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms-of-service" className="hover:text-circleTel-orange transition-colors">Terms & Conditions</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-circleTel-lightNeutral mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} CircleTel. All rights reserved.
            </p>
            <div className="flex items-center">
              <PiMapPinBold size={16} className="mr-2 text-circleTel-orange" />
              <p className="text-sm text-circleTel-lightNeutral">
                {formatAddressFooter()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};