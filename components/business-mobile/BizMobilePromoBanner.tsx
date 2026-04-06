'use client';

import { useEffect, useState } from 'react';

interface BizMobilePromoBannerProps {
  /** ISO date string for promo end — if undefined or in the past, banner is hidden */
  promoEndsAt?: string;
  message?: string;
}

function getTimeLeft(endsAt: string): { days: number; hours: number; mins: number } | null {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return null;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return { days, hours, mins };
}

export function BizMobilePromoBanner({
  promoEndsAt,
  message = 'Limited-time pricing active — lock in your rate today.',
}: Readonly<BizMobilePromoBannerProps>) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; mins: number } | null>(
    null
  );

  useEffect(() => {
    if (!promoEndsAt) return;
    setTimeLeft(getTimeLeft(promoEndsAt));
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(promoEndsAt));
    }, 60_000);
    return () => clearInterval(interval);
  }, [promoEndsAt]);

  // Hide if no promo date or promo has expired
  if (!promoEndsAt || timeLeft === null) return null;

  return (
    <div className="bg-amber-500 text-white">
      <div className="max-w-[1200px] mx-auto px-6 py-3 flex flex-col sm:flex-row items-center justify-center gap-3 text-sm font-semibold text-center">
        <span
          className="material-symbols-outlined text-base"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          timer
        </span>
        <span>{message}</span>

        <div className="flex items-center gap-2 font-bold">
          <span className="bg-amber-600/40 px-2 py-0.5 rounded-md">
            {timeLeft.days}d
          </span>
          <span className="bg-amber-600/40 px-2 py-0.5 rounded-md">
            {timeLeft.hours}h
          </span>
          <span className="bg-amber-600/40 px-2 py-0.5 rounded-md">
            {timeLeft.mins}m
          </span>
          <span className="text-amber-100 font-normal">remaining</span>
        </div>
      </div>
    </div>
  );
}
