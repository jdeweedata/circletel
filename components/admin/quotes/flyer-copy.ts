import type { FlyerChip } from '@/lib/products/bundle-template-service';

export const FLYER_CHIP_LABEL: Record<FlyerChip, string> = {
  working: 'Working on it',
  waiting: 'Waiting on finance',
  ready: 'Ready to sell',
  price_change: 'Price change with finance',
  paused: 'Paused',
};

export const FLYER_CHIP_TONE: Record<FlyerChip, string> = {
  working: 'bg-slate-100 text-slate-700',
  waiting: 'bg-amber-50 text-amber-800',
  ready: 'bg-emerald-50 text-emerald-700',
  price_change: 'bg-amber-50 text-amber-800',
  paused: 'bg-slate-100 text-slate-700',
};

export const STEPS = [
  { id: 1, label: 'Who is this for?', helper: 'Name the flyer and who you will sell it to.' },
  { id: 2, label: 'What is in the box?', helper: 'Connectivity, router, and software — same shape as OTG.' },
  { id: 3, label: 'What does the customer pay?', helper: 'Show the monthly price they will see. We keep cost and margin on the right.' },
  { id: 4, label: 'Who can buy it?', helper: 'A few rules so quotes do not go out to the wrong customer.' },
  { id: 5, label: 'How we support it', helper: 'Hours and fair-use in plain words. WhatsApp and email stay the CircleTel standards.' },
  { id: 6, label: 'Check the numbers', helper: 'Does this sell? Can we live with this margin and cash?' },
] as const;
