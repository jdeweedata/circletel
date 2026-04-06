import Link from 'next/link';
import { CONTACT } from '@/lib/constants/contact';

export function BizMobileHero() {
  return (
    <section className="pt-32 pb-20 px-6 bg-white">
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left: copy */}
        <div className="space-y-6">
          <span className="inline-block px-4 py-1.5 rounded-full bg-orange-50 text-[#E87A1E] text-sm font-bold border border-orange-100">
            South Africa&apos;s Best Networks · Zero CAPEX
          </span>
          <h1
            className="text-4xl md:text-5xl lg:text-[48px] leading-tight font-extrabold text-[#1E293B]"
            style={{ letterSpacing: '-0.02em' }}
          >
            One Account. One Invoice. All Your Business Connectivity.
          </h1>
          <p className="text-lg text-[#6B7280] max-w-lg leading-relaxed">
            Business mobile plans your team actually wants — managed entirely by us,
            delivered to your door.
          </p>
          {/* Social proof */}
          <div className="flex items-center gap-1 text-[#E87A1E] py-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                star
              </span>
            ))}
            <span className="ml-2 text-[#1E293B] font-semibold text-sm">
              Trusted by 500+ South African businesses
            </span>
          </div>
          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link
              href="#plans"
              className="px-8 py-4 bg-[#E87A1E] rounded-full text-white font-bold text-lg hover:bg-[#D66912] transition-all shadow-lg shadow-orange-200 text-center"
            >
              Get a Quote in 2 Minutes
            </Link>
            <Link
              href={CONTACT.WHATSAPP_LINK}
              className="px-8 py-4 bg-white border-2 border-[#16A34A] text-[#16A34A] rounded-full font-bold text-lg flex items-center justify-center gap-2 hover:bg-[#16A34A] hover:text-white transition-all"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                chat
              </span>
              WhatsApp {CONTACT.WHATSAPP_NUMBER}
            </Link>
          </div>
        </div>

        {/* Right: visual */}
        <div className="relative hidden lg:block">
          <div className="aspect-square bg-orange-50 rounded-[3rem] overflow-hidden flex items-center justify-center">
            <div className="grid grid-cols-2 gap-6 p-12 opacity-60">
              {(['smartphone', 'corporate_fare', 'home_work', 'local_shipping'] as const).map(
                (icon) => (
                  <div key={icon} className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-md">
                      <span className="material-symbols-outlined text-[#E87A1E] text-3xl">
                        {icon}
                      </span>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
          {/* Floating badge */}
          <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl border border-slate-50 max-w-[240px]">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-[#16A34A]/10 flex items-center justify-center text-[#16A34A]">
                <span className="material-symbols-outlined">receipt_long</span>
              </div>
              <span className="text-sm font-bold text-[#1E293B]">Consolidated Billing</span>
            </div>
            <p className="text-xs text-[#6B7280] leading-tight">
              Manage all your team&apos;s lines on a single monthly invoice.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
