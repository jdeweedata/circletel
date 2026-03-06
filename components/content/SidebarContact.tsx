import { PiWhatsappLogoBold, PiEnvelopeBold } from 'react-icons/pi';
import { CONTACT } from '@/lib/constants/contact';

interface SidebarContactProps {
  heading?: string;
}

export function SidebarContact({ heading = 'Need help?' }: SidebarContactProps) {
  return (
    <div className="bg-circleTel-navy rounded-2xl p-6 text-white">
      <h3 className="font-semibold mb-2">{heading}</h3>
      <p className="text-white/70 text-sm mb-4">
        Our support team is available {CONTACT.SUPPORT_HOURS}.
      </p>
      <div className="space-y-2">
        <a
          href={CONTACT.WHATSAPP_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm hover:text-green-400 transition-colors"
        >
          <PiWhatsappLogoBold className="w-4 h-4" />
          <span>{CONTACT.WHATSAPP_NUMBER}</span>
        </a>
        <a
          href={`mailto:${CONTACT.EMAIL_PRIMARY}`}
          className="flex items-center gap-2 text-sm hover:text-blue-400 transition-colors"
        >
          <PiEnvelopeBold className="w-4 h-4" />
          <span>{CONTACT.EMAIL_PRIMARY}</span>
        </a>
      </div>
    </div>
  );
}
