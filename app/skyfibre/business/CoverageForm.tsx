'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CoverageForm() {
  const [address, setAddress] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (address.trim()) {
      router.push(`/coverage?address=${encodeURIComponent(address.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex max-w-[540px] mx-auto mb-7 border border-white/20 overflow-hidden">
      <input
        type="text"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="e.g. 14 Rivonia Road, Sandton"
        className="flex-1 bg-white/[0.06] border-none px-5 py-4 text-sm text-white placeholder:text-white/35 outline-none font-[inherit]"
      />
      <button
        type="submit"
        className="bg-[#E87A1E] hover:bg-[#C96A10] border-none cursor-pointer px-6 py-4 text-xs font-bold tracking-[0.1em] uppercase text-white transition-colors whitespace-nowrap"
      >
        Check Now
      </button>
    </form>
  );
}
