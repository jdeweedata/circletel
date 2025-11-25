import React from 'react';
import { MOCK_PRODUCTS } from '../constants';

export const StatsBar: React.FC = () => {
    const total = MOCK_PRODUCTS.length;
    const active = MOCK_PRODUCTS.filter(p => !p.isHidden).length;
    const draft = 0;
    const archived = 43; // Mock number from screenshot
    const featured = MOCK_PRODUCTS.filter(p => p.isFeatured).length + 1; // Mock +1
    const popular = MOCK_PRODUCTS.filter(p => p.isPopular).length + 3; // Mock +3

  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
      <StatChip label="Total" count={total + archived} active />
      <StatChip label="Active" count={active} />
      <StatChip label="Draft" count={draft} />
      <StatChip label="Archived" count={archived} />
      <StatChip label="Featured" count={featured} />
      <StatChip label="Popular" count={popular} />
    </div>
  );
};

const StatChip: React.FC<{ label: string; count: number; active?: boolean }> = ({ label, count, active }) => (
  <button className={`
    flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-medium transition-all whitespace-nowrap
    ${active 
        ? 'bg-slate-800 text-white border-slate-800 shadow-sm' 
        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
    }
  `}>
    <span>{label}</span>
    <span className={`px-1.5 py-0.5 rounded text-[10px] ${active ? 'bg-slate-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
        {count}
    </span>
  </button>
);
