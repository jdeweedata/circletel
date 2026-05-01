'use client';

import { useState } from 'react';

const FAQS = [
  {
    q: 'How many staff can use SkyFibre Business simultaneously?',
    a: 'Business 50 comfortably handles 5–10 concurrent users for email, browsing, and cloud tools. Business 100 suits 10–25 users, including video conferencing. Business 200 is designed for 25–50 staff or any team with heavy upload requirements like video editing, large file transfers, or VoIP call centres.',
  },
  {
    q: 'Is a static IP really included, or is it an add-on?',
    a: "It's included at no extra charge on all SkyFibre Business plans. We assign you a dedicated public static IP during installation. You can use it for VPNs, remote desktop, hosted servers, CCTV access, or anything else that needs a fixed address.",
  },
  {
    q: 'Can I deduct this as a business expense?',
    a: "Yes. We issue a VAT-compliant tax invoice monthly. The connection qualifies as an operating expense and is deductible for income tax purposes. If your business is VAT-registered, you can also claim the input VAT. Speak to your accountant for specifics.",
  },
  {
    q: 'What happens if my business moves premises?',
    a: "Give us 30 days' notice of your relocation. We'll check coverage at your new address. If we cover it, we'll arrange re-installation — the outdoor unit is removed, the new site is equipped, and your service continues. No new contract, no cancellation fees.",
  },
  {
    q: 'What does "8:1 contention ratio" mean in practice?',
    a: "It means at most 8 businesses share each segment of our business network, versus 20–50:1 on consumer products. Lower contention means less competition for bandwidth during peak hours — your speeds stay consistent throughout the day, even on a Monday morning video call.",
  },
  {
    q: 'Will load-shedding affect my connection?',
    a: "SkyFibre Business operates on MTN's nationally managed infrastructure which includes generator and UPS backup at base stations. Your office router will need a UPS to stay powered — we can recommend compatible units. Many clients also add a 4G LTE failover router as a secondary backup during extended outages.",
  },
  {
    q: 'How long does installation take, and does it disrupt my business?',
    a: "Installation typically takes 90–120 minutes. We keep your existing internet live throughout, so there's zero downtime. Our team cleans up after themselves and leaves you with a brief showing of the router settings and how to reach your account manager.",
  },
  {
    q: "What's the minimum commitment?",
    a: "There is no minimum term. All plans are month-to-month. Cancel any time with 30 days' written notice — no penalties, no early-termination fees. We believe the service should earn your business every month, not a contract.",
  },
];

export default function FAQList() {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const toggle = (i: number) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <div className="flex flex-col">
      {FAQS.map((faq, i) => (
        <div key={i} className="border-b border-[#1B2A4A]/15 first:border-t first:border-[#1B2A4A]/15">
          <button
            onClick={() => toggle(i)}
            className="w-full flex items-center justify-between gap-4 py-[22px] text-left"
          >
            <span className="text-[15px] font-bold text-[#1B2A4A] leading-snug">{faq.q}</span>
            <span
              className={`text-xl flex-shrink-0 transition-transform duration-200 ${
                openItems.has(i) ? 'rotate-180 text-[#E87A1E]' : 'text-[#8A95A8]'
              }`}
            >
              ▾
            </span>
          </button>
          {openItems.has(i) && (
            <div className="pb-[22px]">
              <p className="text-sm text-[#5A6474] leading-relaxed">{faq.a}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
