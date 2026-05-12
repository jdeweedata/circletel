'use client';

import Image from 'next/image';
import Link from 'next/link';

function StickerBadge({
  text,
  className,
  rotate = 0,
  variant = 'orange',
}: {
  text: string;
  className?: string;
  rotate?: number;
  variant?: 'orange' | 'navy' | 'white';
}) {
  const colors = {
    orange: { bg: '#E87A1E', text: '#FFFFFF', border: '#C45A30' },
    navy: { bg: '#1B2A4A', text: '#FFFFFF', border: '#0F1427' },
    white: { bg: '#FFFFFF', text: '#1B2A4A', border: '#E5E7EB' },
  };
  const c = colors[variant];

  return (
    <div
      className={`absolute select-none ${className}`}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <svg width="140" height="140" viewBox="0 0 140 140" fill="none">
        <path
          d="M70 5 L82 18 L98 12 L100 30 L118 32 L112 48 L128 58 L118 72 L128 86 L112 92 L118 108 L100 110 L98 128 L82 122 L70 135 L58 122 L42 128 L40 110 L22 108 L28 92 L12 86 L22 72 L12 58 L28 48 L22 32 L40 30 L42 12 L58 18 Z"
          fill={c.bg}
          stroke={c.border}
          strokeWidth="2"
        />
        <text
          x="70"
          y="70"
          textAnchor="middle"
          dominantBaseline="central"
          fill={c.text}
          fontSize="13"
          fontWeight="700"
          fontFamily="system-ui, sans-serif"
        >
          {text.length > 16 ? (
            <>
              <tspan x="70" dy="-8">{text.split(' ').slice(0, Math.ceil(text.split(' ').length / 2)).join(' ')}</tspan>
              <tspan x="70" dy="16">{text.split(' ').slice(Math.ceil(text.split(' ').length / 2)).join(' ')}</tspan>
            </>
          ) : (
            text
          )}
        </text>
      </svg>
    </div>
  );
}

export default function SplitAuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Left Panel — sticker illustration (hidden on mobile) */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-[#1B2A4A] to-[#0F1427] relative overflow-hidden items-center justify-center">
        {/* Decorative gradient orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#E87A1E]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-[#1B2A4A]/30 rounded-full blur-3xl" />

        {/* Sticker badges */}
        <StickerBadge
          text="Fast Fibre"
          variant="orange"
          rotate={-12}
          className="top-[12%] left-[10%] animate-float"
        />
        <StickerBadge
          text="No Lock-in"
          variant="white"
          rotate={8}
          className="top-[8%] right-[15%] animate-float [animation-delay:1s]"
        />
        <StickerBadge
          text="Local Support"
          variant="navy"
          rotate={-5}
          className="top-[40%] left-[8%] animate-float [animation-delay:2s]"
        />
        <StickerBadge
          text="24/7 Uptime"
          variant="orange"
          rotate={15}
          className="top-[45%] right-[10%] animate-float [animation-delay:0.5s]"
        />
        <StickerBadge
          text="SA Owned"
          variant="white"
          rotate={-8}
          className="bottom-[15%] left-[25%] animate-float [animation-delay:1.5s]"
        />

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
