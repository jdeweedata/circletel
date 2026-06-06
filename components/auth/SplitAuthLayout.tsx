'use client';

import Image from 'next/image';
import Link from 'next/link';

interface SplitAuthLayoutProps {
  children: React.ReactNode;
  /** Left-panel headline (login defaults to "Customer Portal") */
  heading?: string;
  /** Left-panel supporting copy */
  subtitle?: string;
}

const DEFAULT_HEADING = 'Customer Portal';
const DEFAULT_SUBTITLE =
  'Manage your account, view invoices, track your connection and get support — all in one place.';

export default function SplitAuthLayout({
  children,
  heading = DEFAULT_HEADING,
  subtitle = DEFAULT_SUBTITLE,
}: SplitAuthLayoutProps) {
  return (
    <div className="flex min-h-screen">
      {/* Left Panel — orange brand panel with lifestyle photo (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#F5831F]">
        {/* Lifestyle photo fills the panel; its matching orange top is clean
            negative space that the heading copy sits over (no seam). */}
        <Image
          src="/images/auth-hero.jpg"
          alt=""
          fill
          priority
          sizes="50vw"
          className="object-cover object-bottom"
        />

        {/* Copy overlaid on the clean orange upper area */}
        <div className="relative z-10 px-12 pt-16 xl:pt-20">
          <h1 className="text-white text-4xl xl:text-5xl font-bold leading-tight">
            {heading}
          </h1>
          <p className="mt-4 max-w-md text-white/90 text-base xl:text-lg leading-relaxed">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Right Panel — light background with centered logo + card.
          overflow-y-auto keeps any rare overflow inside the panel rather than
          forcing the whole page to scroll. */}
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center overflow-y-auto bg-[#F5F6F7] px-6 py-6 sm:py-8">
        {/* Single logo above the card */}
        <Link href="/" className="mb-4 inline-block">
          <Image
            src="/images/circletel-logo-2026.png"
            alt="CircleTel"
            width={120}
            height={120}
            className="h-12 sm:h-14 w-auto"
            priority
          />
        </Link>

        {/* Form card */}
        <div className="w-full max-w-md rounded-2xl bg-white p-6 sm:p-8 shadow-xl">
          {children}
        </div>
      </div>
    </div>
  );
}
