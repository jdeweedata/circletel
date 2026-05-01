'use client';

import { useState } from 'react';

const STEPS = [
  {
    title: 'Coverage check',
    body: "Enter your business address on our coverage checker. We'll confirm signal availability at your specific location using our real-time network map — takes 30 seconds. No signups required.",
  },
  {
    title: 'Choose your plan & sign up',
    body: "Pick the speed that fits your team size and usage. Complete a short online application — business name, VAT number (optional), billing details. No physical paperwork or office visits required.",
  },
  {
    title: 'Site survey & scheduling',
    body: "One of our engineers does a quick remote line-of-sight check, then calls to schedule installation at a time that suits you — before office hours, Saturday mornings, or midweek. We confirm the slot by SMS and email.",
  },
  {
    title: 'Installation day',
    body: "Our engineer mounts a compact antenna on your rooftop or wall, runs a single cable to your router, and configures your static IP. The outdoor unit is weather-sealed and low-profile — most landlords have no objections. Job takes roughly 90 minutes.",
  },
  {
    title: "You're live — and supported",
    body: "We test speeds on-site, hand you your network credentials, and introduce you to your account manager. From that point, your SLA is active. One call or WhatsApp message for any support — no IVR menus, no ticket queues.",
  },
];

export default function InstallAccordion() {
  const [open, setOpen] = useState(0);

  return (
    <div className="border border-[#1B2A4A]/20 overflow-hidden">
      {STEPS.map((step, i) => (
        <div key={i} className="border-b border-[#1B2A4A]/10 last:border-b-0">
          <button
            onClick={() => setOpen(open === i ? -1 : i)}
            className="w-full flex items-center gap-4 px-6 py-[22px] text-left hover:bg-[#F8F8F4] transition-colors"
          >
            <span
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold flex-shrink-0 transition-colors ${
                open === i ? 'bg-[#E87A1E] text-white' : 'bg-[#1B2A4A] text-white'
              }`}
            >
              {i + 1}
            </span>
            <span className="flex-1 text-[15px] font-bold text-[#1B2A4A]">{step.title}</span>
            <span
              className={`text-[#8A95A8] text-lg flex-shrink-0 transition-transform duration-200 ${
                open === i ? 'rotate-180 text-[#E87A1E]' : ''
              }`}
            >
              ▾
            </span>
          </button>
          {open === i && (
            <div className="pb-[22px] px-6 pl-[72px]">
              <p className="text-sm text-[#5A6474] leading-relaxed">{step.body}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
