interface DualColumn {
  label: string;
  badgeLabel?: string;
  items?: string[];
}

interface DualListBlockProps {
  headline?: string;
  description?: string;
  leftColumn?: DualColumn;
  rightColumn?: DualColumn;
}

export function DualListBlock({
  headline,
  description,
  leftColumn,
  rightColumn,
}: DualListBlockProps) {
  if (!leftColumn && !rightColumn) return null;

  return (
    <section className="py-20 bg-white">
      <div className="max-w-[1200px] mx-auto px-6">
        {(headline || description) && (
          <div className="text-center mb-12">
            {headline && (
              <h2
                className="text-3xl md:text-4xl font-extrabold text-[#1E293B] mb-4"
                style={{ letterSpacing: '-0.02em' }}
              >
                {headline}
              </h2>
            )}
            {description && (
              <p className="text-[#6B7280] max-w-2xl mx-auto text-lg">{description}</p>
            )}
          </div>
        )}

        <div className="rounded-[2rem] overflow-hidden shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Left column — CircleTel advantage */}
            {leftColumn && (
              <div className="p-10 md:p-14 bg-[#1E293B] text-white">
                {leftColumn.badgeLabel && (
                  <div className="inline-flex items-center gap-2 bg-[#E87A1E]/20 text-[#E87A1E] px-3 py-1 rounded-full text-xs font-bold uppercase mb-6">
                    <span
                      className="material-symbols-outlined text-sm"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                    {leftColumn.badgeLabel}
                  </div>
                )}
                <h3
                  className="font-extrabold text-2xl mb-8"
                  style={{ letterSpacing: '-0.02em' }}
                >
                  {leftColumn.label}
                </h3>
                <ul className="space-y-4">
                  {(leftColumn.items ?? []).map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span
                        className="material-symbols-outlined text-[#16A34A] text-xl flex-shrink-0 mt-0.5"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        check_circle
                      </span>
                      <span className="font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Right column — DIY */}
            {rightColumn && (
              <div className="p-10 md:p-14 bg-slate-800 text-slate-400 border-l border-slate-700">
                {rightColumn.badgeLabel && (
                  <div className="inline-flex items-center gap-2 bg-slate-700 text-slate-400 px-3 py-1 rounded-full text-xs font-bold uppercase mb-6">
                    {rightColumn.badgeLabel}
                  </div>
                )}
                <h3
                  className="font-extrabold text-2xl text-slate-400 mb-8"
                  style={{ letterSpacing: '-0.02em' }}
                >
                  {rightColumn.label}
                </h3>
                <ul className="space-y-4">
                  {(rightColumn.items ?? []).map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span
                        className="material-symbols-outlined text-slate-500 text-xl flex-shrink-0 mt-0.5"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        cancel
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
