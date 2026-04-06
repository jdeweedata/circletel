import Link from 'next/link';

interface BizMobileBundleFeature {
  text: string;
}

export interface BizMobileBundleCardProps {
  id: string;
  name: string;
  tagline: string;
  badge: string;
  badgeVariant: 'primary' | 'secondary' | 'navy' | 'purple';
  icon: string;
  priceFrom: string;
  priceSuffix: string;
  features: Readonly<BizMobileBundleFeature[]>;
  ctaLabel: string;
  href: string;
  featured?: boolean;
}

const BADGE_STYLES: Record<string, string> = {
  primary: 'text-[#E87A1E] bg-orange-50',
  secondary: 'text-blue-600 bg-blue-50',
  navy: 'text-[#1E293B] bg-slate-100',
  purple: 'text-purple-600 bg-purple-50',
};

const ICON_BG_STYLES: Record<string, string> = {
  primary: 'bg-orange-50 text-[#E87A1E]',
  secondary: 'bg-blue-50 text-blue-600',
  navy: 'bg-slate-100 text-[#1E293B]',
  purple: 'bg-purple-50 text-purple-600',
};

export function BizMobileBundleCard({
  name,
  badge,
  badgeVariant,
  icon,
  priceFrom,
  priceSuffix,
  features,
  ctaLabel,
  href,
  featured = false,
}: Readonly<BizMobileBundleCardProps>) {
  const badgeStyle = BADGE_STYLES[badgeVariant] ?? BADGE_STYLES.primary;
  const iconBgStyle = ICON_BG_STYLES[badgeVariant] ?? ICON_BG_STYLES.primary;

  if (featured) {
    return (
      <div className="relative bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.08)] border-[3px] border-[#E87A1E] p-8 flex flex-col transition-all hover:-translate-y-2 hover:shadow-[0_4px_24px_rgba(232,122,30,0.15)]">
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#E87A1E] text-white text-[10px] font-bold px-4 py-1 rounded-full uppercase tracking-widest shadow-lg whitespace-nowrap">
          {badge}
        </div>
        <div className="flex justify-between items-start mb-6">
          <div className="p-3 bg-[#E87A1E] rounded-lg text-white">
            <span className="material-symbols-outlined text-3xl">{icon}</span>
          </div>
        </div>
        <h3 className="text-xl font-bold text-[#1E293B] mb-2">{name}</h3>
        <p className="text-2xl font-extrabold text-[#E87A1E] mt-auto mb-6">
          {priceFrom}
          <span className="text-sm font-medium text-[#6B7280]">{priceSuffix}</span>
        </p>
        <ul className="space-y-4 mb-8 text-sm">
          {features.map((f) => (
            <li key={f.text} className="flex items-start gap-3">
              <span
                className="material-symbols-outlined text-[#16A34A] text-lg"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
              <span>{f.text}</span>
            </li>
          ))}
        </ul>
        <Link
          href={href}
          className="w-full py-3 rounded-full bg-[#E87A1E] text-white font-bold hover:bg-[#D66912] transition-colors text-center block"
        >
          {ctaLabel}
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.08)] border-t-[3px] border-[#E87A1E] p-8 flex flex-col transition-all hover:-translate-y-2 hover:shadow-[0_4px_24px_rgba(232,122,30,0.15)] group">
      <div className="flex justify-between items-start mb-6">
        <div className={`p-3 rounded-lg ${iconBgStyle}`}>
          <span className="material-symbols-outlined text-3xl">{icon}</span>
        </div>
        <span className={`text-[10px] font-extrabold tracking-widest px-2 py-1 rounded ${badgeStyle}`}>
          {badge}
        </span>
      </div>
      <h3 className="text-xl font-bold text-[#1E293B] mb-2">{name}</h3>
      <p className="text-2xl font-extrabold text-[#1E293B] mt-auto mb-6">
        {priceFrom}
        <span className="text-sm font-medium text-[#6B7280]">{priceSuffix}</span>
      </p>
      <ul className="space-y-4 mb-8 text-sm">
        {features.map((f) => (
          <li key={f.text} className="flex items-start gap-3">
            <span
              className="material-symbols-outlined text-[#16A34A] text-lg"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
            <span>{f.text}</span>
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className="w-full py-3 rounded-full border-2 border-[#E87A1E] text-[#E87A1E] font-bold group-hover:bg-[#E87A1E] group-hover:text-white transition-colors text-center block"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
