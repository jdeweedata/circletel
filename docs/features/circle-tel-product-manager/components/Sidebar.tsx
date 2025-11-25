import React from 'react';
import { 
  Home, 
  Users, 
  ShoppingBag, 
  Tag, 
  CreditCard, 
  Clock, 
  Calendar, 
  BarChart2, 
  Settings,
  ChevronRight,
  ChevronDown,
  Box,
  Layers
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-[#1e293b] text-slate-300 flex flex-col h-screen fixed left-0 top-0 z-20 transition-all duration-300 border-r border-slate-700 hidden md:flex">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-slate-700 bg-[#0f172a]">
        <div className="w-8 h-8 bg-primary-500 rounded-md flex items-center justify-center text-white font-bold mr-3">
          C
        </div>
        <span className="text-white font-semibold text-lg tracking-tight">Billing</span>
      </div>

      {/* Getting Started Widget */}
      <div className="p-4">
        <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-white uppercase flex items-center gap-1">
              <span className="text-yellow-400">✦</span> Getting Started
            </span>
            <ChevronRight size={14} />
          </div>
          <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
            <div className="bg-green-500 h-full w-1/3"></div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto py-2 custom-scrollbar">
        <MenuItem icon={<Home size={18} />} label="Home" />
        <MenuItem icon={<Users size={18} />} label="Customers" />
        
        {/* Active Item Group */}
        <div className="bg-slate-800/50 border-l-4 border-primary-500 my-1">
          <MenuItem icon={<ShoppingBag size={18} />} label="Product Catalog" active hasSubmenu expanded />
          <div className="ml-10 flex flex-col gap-1 pb-2">
            <SubMenuItem label="Items" />
            <SubMenuItem label="Subscription Items" active />
            <SubMenuItem label="Pricing Widgets" />
          </div>
        </div>

        <MenuItem icon={<Tag size={18} />} label="Sales" hasSubmenu />
        <MenuItem icon={<CreditCard size={18} />} label="Payments" hasSubmenu />
        <MenuItem icon={<Box size={18} />} label="Expenses" hasSubmenu />
        <MenuItem icon={<Clock size={18} />} label="Time Tracking" />
        <MenuItem icon={<Calendar size={18} />} label="Events" />
        <MenuItem icon={<BarChart2 size={18} />} label="Reports" />
      </nav>

      {/* Footer Settings */}
      <div className="p-4 border-t border-slate-700">
        <MenuItem icon={<Settings size={18} />} label="Configuration" />
      </div>
    </aside>
  );
};

const MenuItem: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  active?: boolean; 
  hasSubmenu?: boolean;
  expanded?: boolean;
}> = ({ icon, label, active, hasSubmenu, expanded }) => (
  <div className={`
    flex items-center justify-between px-6 py-2.5 cursor-pointer text-sm
    ${active ? 'text-white font-medium' : 'hover:text-white hover:bg-slate-800'}
  `}>
    <div className="flex items-center gap-3">
      {icon}
      <span>{label}</span>
    </div>
    {hasSubmenu && (
      expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
    )}
  </div>
);

const SubMenuItem: React.FC<{ label: string; active?: boolean }> = ({ label, active }) => (
  <div className={`
    py-1.5 px-3 rounded-md cursor-pointer text-sm transition-colors
    ${active ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-700'}
  `}>
    {label}
  </div>
);
