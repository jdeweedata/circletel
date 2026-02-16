'use client';

import { usePathname } from 'next/navigation';
import { FaWhatsapp } from 'react-icons/fa';
import { getWhatsAppLink } from '@/lib/constants/contact';

export function WhatsAppFloatingButton() {
  const pathname = usePathname();

  // Hide on admin, partner, and auth routes
  const shouldHide =
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/partners') ||
    pathname?.startsWith('/auth/');

  if (shouldHide) return null;

  return (
    <a
      href={getWhatsAppLink('Hi CircleTel, I need assistance')}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with CircleTel on WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2"
    >
      <FaWhatsapp className="h-7 w-7" />
    </a>
  );
}
