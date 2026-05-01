'use client';

import { useState } from 'react';
import { PiPlusBold, PiMinusBold } from 'react-icons/pi';

const faqs = [
  {
    q: 'How long does installation take?',
    a: 'Our technician typically completes the Tarana CPE installation, MikroTik router configuration, and 5G backup setup in approximately 2.5 hours on site. We schedule installation within 5 business days of signing your contract.',
  },
  {
    q: "What happens if there's loadshedding?",
    a: 'Your internet connection depends on your router having power. We recommend pairing with a UPS or inverter. The Tarana tower infrastructure has backup power built in. Your 5G backup also stays live independently if your building has a generator.',
  },
  {
    q: 'Is Business Complete a fixed-term contract?',
    a: 'The default term is 24 months, which includes free installation (saving R2,000). Month-to-month is available at a 10% premium. We don\'t offer 12-month contracts on the Business Complete bundle currently.',
  },
  {
    q: 'Can I upgrade my tier mid-contract?',
    a: 'Yes. Upgrades are processed within 2 business days and prorated on your next invoice. Downgrades are permitted at the annual renewal point only.',
  },
  {
    q: 'How is coverage determined?',
    a: 'Coverage depends on Tarana FWB signal availability at your specific address. Enter your address in the coverage checker — we run a real-time line-of-sight assessment and confirm within 24 hours whether you qualify.',
  },
  {
    q: 'What does "auto-failover" actually mean?',
    a: 'Your MikroTik router monitors both the primary FWB link and the MTN 5G backup simultaneously. If the primary link drops or degrades below threshold, the router automatically routes traffic over 5G — in under 30 seconds. When the primary recovers, traffic switches back without interruption.',
  },
];

export function FAQAccordion() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="grid md:grid-cols-2 gap-3">
      {faqs.map((faq, i) => (
        <div
          key={i}
          className="border border-[#EAECF0] rounded-xl overflow-hidden bg-white"
        >
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className={`w-full text-left flex items-center justify-between gap-4 px-5 py-4 font-semibold text-[15px] transition-colors ${
              open === i
                ? 'bg-[#1B2A4A] text-white'
                : 'text-[#101828] hover:bg-[#F9FAFB]'
            }`}
          >
            <span>{faq.q}</span>
            <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
              open === i ? 'bg-white/20' : 'bg-[#F2F4F7]'
            }`}>
              {open === i
                ? <PiMinusBold className="w-3 h-3" />
                : <PiPlusBold className="w-3 h-3 text-[#475467]" />
              }
            </span>
          </button>
          {open === i && (
            <div className="px-5 py-4 text-[#475467] text-sm leading-relaxed bg-[#F9FAFB]">
              {faq.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
