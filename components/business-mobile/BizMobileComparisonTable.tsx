// Managed vs DIY comparison — strongest objection handler.
// Shows the hassle of self-managing mobile contracts vs the CircleTel-managed experience.

const CIRCLETEL_POINTS = [
  'Same market pricing — you pay no premium',
  'Your account manager submits all paperwork',
  'Devices delivered to your office in 2–5 days',
  'Mon–Fri WhatsApp support line',
  'Single monthly CircleTel invoice',
  'Zero CAPEX — no upfront cost',
];

const DIY_POINTS = [
  '45-minute telecom store queue',
  'You fill in all forms yourself',
  'Collect devices in-store during business hours',
  'Call centre queue for any support issue',
  'Separate invoices per contract',
  'Same monthly cost — more of your time',
];

export function BizMobileComparisonTable() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-12">
          <h2
            className="text-3xl md:text-4xl font-extrabold text-[#1E293B] mb-4"
            style={{ letterSpacing: '-0.02em' }}
          >
            Managed for you. Delivered to your door. One invoice.
          </h2>
          <p className="text-[#6B7280] max-w-2xl mx-auto text-lg">
            Skip the telecom queue entirely. We handle contracts, paperwork, and delivery —
            you just use the product.
          </p>
        </div>

        <div className="rounded-[2rem] overflow-hidden shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* CircleTel column */}
            <div className="p-10 md:p-14 bg-[#1E293B] text-white">
              <div className="inline-flex items-center gap-2 bg-[#E87A1E]/20 text-[#E87A1E] px-3 py-1 rounded-full text-xs font-bold uppercase mb-6">
                <span
                  className="material-symbols-outlined text-sm"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  star
                </span>
                CircleTel Advantage
              </div>
              <h3
                className="font-extrabold text-2xl mb-8"
                style={{ letterSpacing: '-0.02em' }}
              >
                CircleTel-Managed
              </h3>
              <ul className="space-y-4">
                {CIRCLETEL_POINTS.map((point) => (
                  <li key={point} className="flex items-start gap-3">
                    <span
                      className="material-symbols-outlined text-[#16A34A] text-xl flex-shrink-0 mt-0.5"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      check_circle
                    </span>
                    <span className="font-medium">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* DIY column */}
            <div className="p-10 md:p-14 bg-slate-800 text-slate-400 border-l border-slate-700">
              <div className="inline-flex items-center gap-2 bg-slate-700 text-slate-400 px-3 py-1 rounded-full text-xs font-bold uppercase mb-6">
                Managing It Yourself
              </div>
              <h3
                className="font-extrabold text-2xl text-slate-400 mb-8"
                style={{ letterSpacing: '-0.02em' }}
              >
                DIY / Self-Managed
              </h3>
              <ul className="space-y-4">
                {DIY_POINTS.map((point) => (
                  <li key={point} className="flex items-start gap-3">
                    <span
                      className="material-symbols-outlined text-slate-500 text-xl flex-shrink-0 mt-0.5"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      cancel
                    </span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
