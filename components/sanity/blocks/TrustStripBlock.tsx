interface TrustBadge {
  _key: string;
  icon: string;
  text: string;
}

interface TrustStripBlockProps {
  badges?: TrustBadge[];
}

export function TrustStripBlock({ badges = [] }: TrustStripBlockProps) {
  if (!badges.length) return null;

  return (
    <section className="py-12 bg-white border-y border-slate-100">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
          {badges.map((badge) => (
            <div
              key={badge._key}
              className="flex items-center gap-2 text-[#1E293B] font-bold whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[#E87A1E]">{badge.icon}</span>
              {badge.text}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
