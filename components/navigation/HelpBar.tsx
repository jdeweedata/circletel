'use client';

import Link from 'next/link';
import { PiWhatsappLogo, PiEnvelope, PiClock } from 'react-icons/pi';
import { CONTACT, getWhatsAppLink } from '@/lib/constants/contact';

interface HelpBarProps {
  className?: string;
}

export function HelpBar({ className = '' }: HelpBarProps) {
  return (
    <div className={`bg-circleTel-navy text-white text-sm ${className}`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-2">
          {/* Left: Support hours */}
          <div className="hidden sm:flex items-center gap-2 text-white/80">
            <PiClock className="w-4 h-4" />
            <span>{CONTACT.SUPPORT_HOURS}</span>
          </div>

          {/* Right: Contact options */}
          <div className="flex items-center gap-4 ml-auto">
            {/* WhatsApp - Primary */}
            <Link
              href={getWhatsAppLink('Hi, I need help with my CircleTel service.')}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-green-400 transition-colors"
            >
              <PiWhatsappLogo className="w-4 h-4" />
              <span className="hidden sm:inline">{CONTACT.WHATSAPP_NUMBER}</span>
              <span className="sm:hidden">WhatsApp</span>
            </Link>

            {/* Divider */}
            <span className="text-white/30">|</span>

            {/* Sales Email */}
            <Link
              href={`mailto:${CONTACT.EMAIL_SALES}`}
              className="flex items-center gap-2 hover:text-circleTel-orange transition-colors"
            >
              <PiEnvelope className="w-4 h-4" />
              <span className="hidden sm:inline">{CONTACT.EMAIL_SALES}</span>
              <span className="sm:hidden">Email</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
