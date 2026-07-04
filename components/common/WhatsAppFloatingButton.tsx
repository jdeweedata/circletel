'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { FaWhatsapp } from 'react-icons/fa';
import { getWhatsAppLink } from '@/lib/constants/contact';

export function WhatsAppFloatingButton() {
  const pathname = usePathname();
  // Hide while the coverage-check form is on screen so the float never
  // occludes the primary CTA (observed overlapping "Find my plan" on mobile).
  const [formInView, setFormInView] = useState(false);

  useEffect(() => {
    setFormInView(false);
    let observer: IntersectionObserver | null = null;
    let cancelled = false;
    let attempts = 0;

    // The form is client-rendered, so it may mount after this effect runs —
    // retry briefly until it exists (or give up on pages without it).
    const attach = () => {
      if (cancelled) return;
      const form = document.getElementById('coverage-checker');
      if (form) {
        observer = new IntersectionObserver(
          ([entry]) => setFormInView(entry.isIntersecting),
          { threshold: 0.1 }
        );
        observer.observe(form);
        return;
      }
      if (attempts++ < 20) setTimeout(attach, 250);
    };
    attach();

    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, [pathname]);

  // Hide on admin, partner, auth, and quote routes
  const shouldHide =
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/partners') ||
    pathname?.startsWith('/auth/') ||
    pathname?.startsWith('/quotes');

  if (shouldHide) return null;

  return (
    <a
      href={getWhatsAppLink('Hi CircleTel, I need assistance')}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with CircleTel on WhatsApp"
      className={`fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2 print:hidden ${
        formInView ? 'pointer-events-none scale-0 opacity-0' : 'scale-100 opacity-100'
      }`}
    >
      <FaWhatsapp className="h-7 w-7" />
    </a>
  );
}
