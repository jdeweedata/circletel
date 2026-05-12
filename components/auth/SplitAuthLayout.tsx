'use client';

import Image from 'next/image';
import Link from 'next/link';

const STICKERS = [
  { src: '/stickers/make_payment_badge_1778569500917.png', alt: 'Make Payment', className: 'top-[8%] left-[8%] w-40 h-40 animate-float', rotate: -12 },
  { src: '/stickers/account_access_badge_1778569518398.png', alt: 'Account Access', className: 'top-[5%] right-[12%] w-36 h-36 animate-float [animation-delay:1s]', rotate: 8 },
  { src: '/stickers/see_your_bill_badge_1778569530823.png', alt: 'See Your Bill', className: 'bottom-[12%] left-[20%] w-44 h-36 animate-float [animation-delay:2s]', rotate: -5 },
];

export default function SplitAuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Left Panel — sticker illustration (hidden on mobile) */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-[#1B2A4A] to-[#0F1427] relative overflow-hidden items-center justify-center">
        {/* Decorative gradient orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#E87A1E]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-[#1B2A4A]/30 rounded-full blur-3xl" />

        {/* Sticker badges */}
        {STICKERS.map((s) => (
          <div
            key={s.alt}
            className={`absolute select-none ${s.className}`}
            style={{ transform: `rotate(${s.rotate}deg)` }}
          >
            <Image src={s.src} alt={s.alt} width={180} height={180} className="w-full h-full object-contain drop-shadow-2xl" />
          </div>
        ))}

        {/* Central tagline */}
        <div className="relative z-10 text-center px-8">
          <h2 className="text-white text-3xl xl:text-4xl font-bold mb-4 leading-tight">
            South Africa's<br />
            <span className="text-[#E87A1E]">Connected</span> ISP
          </h2>
          <p className="text-white/70 text-lg max-w-md mx-auto">
            Fibre, LTE, and business connectivity — built for you.
          </p>
        </div>
      </div>

      {/* Right Panel — form */}
      <div className="flex flex-col w-full lg:w-[480px] xl:w-[520px] bg-white">
        {/* Logo */}
        <div className="px-6 sm:px-10 pt-8 pb-4">
          <Link href="/" className="inline-block">
            <Image
              src="/images/circletel-logo.png"
              alt="CircleTel"
              width={160}
              height={40}
              className="h-10 w-auto"
              priority
            />
          </Link>
        </div>

        {/* Form content — vertically centered */}
        <div className="flex-1 flex items-center">
          <div className="w-full px-6 sm:px-10 py-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
