import Link from 'next/link';
import { CONTACT } from '@/lib/constants/contact';

export function BizMobileCTABanner() {
  return (
    <section className="py-20 px-6 bg-[#1E293B] text-white relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#E87A1E] rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
      </div>

      <div className="max-w-[1200px] mx-auto text-center relative z-10">
        <h2 className="text-3xl md:text-4xl font-extrabold mb-4" style={{ letterSpacing: '-0.02em' }}>
          Not sure which plan fits your business?
        </h2>
        <p className="text-slate-400 text-lg mb-10 max-w-2xl mx-auto">
          Our team will match you to the right solution in under 10 minutes.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href={CONTACT.WHATSAPP_LINK}
            className="px-10 py-4 bg-[#16A34A] rounded-full text-white font-bold text-lg flex items-center justify-center gap-2 hover:opacity-90 transition-all"
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
          <Link
            href={`mailto:${CONTACT.EMAIL_PRIMARY}`}
            className="px-10 py-4 bg-transparent border-2 border-white rounded-full text-white font-bold text-lg flex items-center justify-center gap-2 hover:bg-white hover:text-[#1E293B] transition-all"
          >
            <span className="material-symbols-outlined">mail</span>
            {CONTACT.EMAIL_PRIMARY}
          </Link>
        </div>
      </div>
    </section>
  );
}
