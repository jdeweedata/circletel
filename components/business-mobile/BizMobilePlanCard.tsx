import Link from 'next/link';

interface BizMobilePlanCardProps {
  dataLabel: string;
  contractMonths: number;
  planName: string;
  price: number;
  features: string[];
  badge?: string;
  featured?: boolean;
  ctaHref?: string;
}

export function BizMobilePlanCard({
  dataLabel,
  contractMonths,
  planName,
  price,
  features,
  badge,
  featured = false,
  ctaHref = '/business/mobile#contact',
}: Readonly<BizMobilePlanCardProps>) {
  return (
    <div
      className={`bg-white border rounded-lg overflow-hidden shadow-sm flex flex-col text-center transition-transform hover:scale-105 ${
        featured ? 'border-[#F5831F] ring-2 ring-[#F5831F]/20' : 'border-gray-200'
      }`}
    >
      {/* Badge */}
      {badge && (
        <div className="bg-[#F5831F] text-white text-[9px] font-[900] uppercase tracking-widest py-1.5">
          {badge}
        </div>
      )}

      {/* Data header */}
      <div className="py-6 border-b border-gray-100 bg-gray-50/30">
        <p className="text-[9px] font-[900] text-slate-400 uppercase tracking-widest mb-1">
          {contractMonths} months
        </p>
        <h3 className="text-4xl font-[900] text-[#1E293B] tracking-tighter leading-none">
          {dataLabel}
        </h3>
        <p className="text-[10px] text-slate-500 font-medium mt-1.5 leading-tight px-4">
          {planName}
        </p>
      </div>

      {/* Price band */}
      <div className="bg-[#1E293B] text-white py-5">
        <span className="text-3xl font-[900] tracking-tighter leading-none block">
          R{price}
          <span className="text-base font-bold opacity-70">/mo</span>
        </span>
        <span className="text-[9px] font-bold opacity-80 uppercase tracking-widest mt-1 block">
          Incl. VAT · {contractMonths}-month term
        </span>
      </div>

      {/* Features */}
      <div className="p-5 flex-grow text-left space-y-2.5">
        {features.map((f) => (
          <div key={f} className="flex items-start gap-2">
            <span className="shrink-0 w-4 h-4 rounded-full bg-emerald-50 flex items-center justify-center mt-0.5">
              <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 text-emerald-500" fill="none">
                <path
                  d="M2 6l3 3 5-5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <p className="text-[12px] text-slate-600 leading-snug">{f}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="px-5 pb-5">
        <Link
          href={ctaHref}
          className={`block w-full py-2.5 rounded-md font-[800] text-sm transition-colors ${
            featured
              ? 'bg-[#F5831F] text-white hover:bg-[#e0721a]'
              : 'border-2 border-[#F5831F] text-[#F5831F] hover:bg-[#F5831F] hover:text-white'
          }`}
        >
          Get This Deal
        </Link>
      </div>
    </div>
  );
}
