'use client';

import { PiRadioBold, PiBroadcastBold } from 'react-icons/pi';

type ProviderType = 'tarana' | 'dfa';

interface ProviderSelectorProps {
  provider: ProviderType;
  onChange: (p: ProviderType) => void;
}

export default function ProviderSelector({ provider, onChange }: ProviderSelectorProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-1 flex gap-1 w-fit">
      <button
        type="button"
        onClick={() => onChange('tarana')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          provider === 'tarana'
            ? 'bg-orange-500 text-white shadow-sm'
            : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
        }`}
      >
        <PiRadioBold className="h-4 w-4" />
        Tarana FWB
      </button>
      <button
        type="button"
        onClick={() => onChange('dfa')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          provider === 'dfa'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
        }`}
      >
        <PiBroadcastBold className="h-4 w-4" />
        DFA Fibre
      </button>
    </div>
  );
}
