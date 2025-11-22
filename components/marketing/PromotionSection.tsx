import { SanityImage } from '@/components/sanity/SanityImage'
import { cn } from '@/lib/utils'

interface PromotionCard {
  title: string
  badge?: string
  wasPrice?: number
  nowPrice: number
  specs?: string[]
  routerName?: string
  routerImage?: any
}

interface PromotionSectionProps {
  headline: string
  theme: 'blackFriday' | 'standard'
  cards: PromotionCard[]
}

export function PromotionSection({ headline, theme, cards }: PromotionSectionProps) {
  const isDark = theme === 'blackFriday'

  return (
    <section className={cn(
      "py-16 md:py-24 relative overflow-hidden",
      isDark ? "bg-black text-white" : "bg-gray-50 text-gray-900"
    )}>
      {/* Background blobs for dark mode */}
      {isDark && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-yellow-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-yellow-600/10 rounded-full blur-3xl" />
        </div>
      )}

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className={cn(
            "text-4xl md:text-6xl font-bold mb-4",
            isDark ? "text-yellow-400" : "text-circleTel-darkNeutral"
          )}>
            {headline}
          </h2>
          {isDark && <div className="mt-4 flex justify-center"><div className="h-1 w-24 bg-yellow-400 rounded-full" /></div>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {cards?.map((card, index) => (
            <div key={index} className="relative group">
              {/* Card Container */}
              <div className={cn(
                "rounded-3xl p-1 p-[2px] relative h-full",
                isDark ? "bg-gradient-to-b from-yellow-500/50 to-zinc-800" : "bg-gray-200"
              )}>
                <div className={cn(
                  "rounded-[22px] p-6 md:p-8 h-full flex flex-col relative overflow-hidden",
                  isDark ? "bg-zinc-900" : "bg-white"
                )}>
                  
                  {/* Badge */}
                  {card.badge && (
                    <div className="absolute -top-2 -right-2 z-20">
                      <div className="bg-red-600 text-white w-20 h-20 md:w-24 md:h-24 rounded-full flex flex-col items-center justify-center text-center shadow-lg transform rotate-12 border-4 border-white/10">
                        <span className="text-[10px] md:text-xs font-bold uppercase leading-tight">{card.badge}</span>
                      </div>
                    </div>
                  )}

                  {/* Header */}
                  <div className="mb-6 pr-16">
                    <h3 className={cn("text-xl font-bold mb-2", isDark && "text-white")}>
                      {card.title}
                    </h3>
                    <div className="flex items-center gap-2 text-yellow-400 font-semibold text-sm uppercase tracking-wider">
                      Fast <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-8 border-b border-zinc-700 pb-6">
                    {card.wasPrice && (
                      <div className="text-red-500 font-bold text-lg line-through mb-1">
                        WAS R{card.wasPrice}
                      </div>
                    )}
                    <div className="flex items-end gap-1">
                      <span className={cn("text-lg font-bold mb-2", isDark && "text-white")}>NOW</span>
                      <span className={cn("text-5xl md:text-6xl font-bold", isDark && "text-white")}>
                        R{card.nowPrice}
                      </span>
                      <span className="text-zinc-500 font-medium mb-2 text-sm">PMx24</span>
                    </div>
                  </div>

                  {/* Specs */}
                  <div className="space-y-3 mb-8 flex-1">
                    {card.specs?.map((spec, i) => (
                      <div key={i} className={cn(
                        "flex items-center font-medium text-lg",
                        isDark ? "text-white" : "text-gray-800"
                      )}>
                        <span className="text-3xl mr-2 leading-none">•</span> {spec}
                      </div>
                    ))}
                  </div>

                  {/* Router Info */}
                  {card.routerName && (
                    <div className="mt-auto">
                      <div className={cn(
                        "rounded-xl p-4 flex items-center justify-between gap-4",
                        isDark ? "bg-zinc-800 border border-zinc-700" : "bg-gray-100"
                      )}>
                        <div className="text-sm">
                          <div className="text-yellow-400 text-xs font-bold uppercase mb-1">Eligible Router</div>
                          <div className="font-bold">{card.routerName}</div>
                        </div>
                        {card.routerImage && (
                          <div className="w-12 h-16 relative">
                            <SanityImage image={card.routerImage} alt={card.routerName} fill className="object-contain" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* External Router Image (Floating) */}
              {card.routerImage && (
                <div className="hidden lg:block absolute -right-20 bottom-10 w-32 h-48 z-10 drop-shadow-2xl pointer-events-none">
                   <SanityImage image={card.routerImage} alt={card.routerName || 'Router'} fill className="object-contain" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Additional Features Table (Static for now, or could be dynamic) */}
        {isDark && (
          <div className="max-w-4xl mx-auto mt-12 space-y-4">
            <div className="grid grid-cols-3 gap-4 items-center">
              <div className="text-right text-white font-bold">Use Your Own</div>
              <div className="col-span-2 bg-yellow-400 rounded-full py-2 px-6 text-black font-bold text-center">
                COMPATIBLE 5G ROUTER REQUIRED
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 items-center">
              <div className="text-right text-white font-bold">5G Router</div>
              <div className="col-span-2 bg-yellow-400 rounded-full py-2 px-6 text-black font-bold text-center">
                INCLUDED ON 24 MONTH CONTRACT
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
