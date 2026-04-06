interface Testimonial {
  quote: string;
  name: string;
  role: string;
  company: string;
  bundle: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "We used to spend half a day sorting out phones every time a staff member needed an upgrade. Now we WhatsApp CircleTel and everything is sorted — devices delivered to our offices.",
    name: 'Sipho M.',
    role: 'Operations Manager',
    company: 'Retail chain, KZN',
    bundle: 'BusinessMobile',
  },
  {
    quote:
      "One invoice for our router, our voice lines, and our team's mobile contracts. I didn't even know that was possible until CircleTel showed us the OfficeConnect bundle.",
    name: 'Zanele K.',
    role: 'Financial Director',
    company: 'Professional Services, Joburg',
    bundle: 'OfficeConnect',
  },
  {
    quote:
      "Fleet tracking used to mean three different SIM providers and three different bills. CircleTel consolidated everything. Support is just a WhatsApp away.",
    name: 'Johan van der M.',
    role: 'Fleet Manager',
    company: 'Logistics company, Cape Town',
    bundle: 'FleetConnect',
  },
];

export function BizMobileTestimonials() {
  return (
    <section className="py-20 bg-[#F8F9FA]">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-12">
          <h2
            className="text-3xl md:text-4xl font-extrabold text-[#1E293B] mb-4"
            style={{ letterSpacing: '-0.02em' }}
          >
            Trusted by South African businesses
          </h2>
          <p className="text-[#6B7280] max-w-xl mx-auto">
            Real feedback from SA business owners who handed us their mobile admin.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.08)] p-8 flex flex-col"
            >
              {/* Star rating */}
              <div className="flex gap-1 text-[#E87A1E] mb-6">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span
                    key={i}
                    className="material-symbols-outlined text-lg"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    star
                  </span>
                ))}
              </div>

              <blockquote className="text-[#111827] leading-relaxed mb-6 flex-1">
                &ldquo;{t.quote}&rdquo;
              </blockquote>

              <div className="border-t border-slate-100 pt-4">
                <p className="font-bold text-[#1E293B] text-sm">{t.name}</p>
                <p className="text-[#6B7280] text-xs">{t.role}, {t.company}</p>
                <span className="inline-block mt-2 px-3 py-1 bg-orange-50 text-[#E87A1E] text-[11px] font-bold rounded-full uppercase tracking-wide">
                  {t.bundle}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
