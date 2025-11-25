import React from 'react';
import { Search, Bell, Settings, HelpCircle, Grid, ChevronDown } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10 shadow-sm">
      {/* Left: Search (Global) */}
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-full max-w-md hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search in Customers (/)" 
            className="w-full bg-slate-50 border border-slate-200 rounded-md py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-400 transition-all"
          />
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
        </div>
      </div>

      {/* Right: Actions & Profile */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Organization Dropdown */}
        <div className="hidden md:flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer hover:bg-slate-50 px-2 py-1 rounded">
          <span>Circle Tel SA (Pty) ...</span>
          <ChevronDown size={14} />
        </div>

        {/* Quick Add */}
        <button className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-md w-8 h-8 flex items-center justify-center shadow-sm transition-colors">
          <span className="text-xl leading-none font-light">+</span>
        </button>

        {/* Icons */}
        <div className="flex items-center gap-2 text-slate-500 border-l border-slate-200 pl-4">
          <button className="p-2 hover:bg-slate-100 rounded-full transition-colors relative">
            <UsersIcon />
          </button>
          <button className="p-2 hover:bg-slate-100 rounded-full transition-colors relative">
            <Bell size={18} />
            <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
          </button>
          <button className="p-2 hover:bg-slate-100 rounded-full transition-colors hidden md:block">
            <Settings size={18} />
          </button>
          <button className="p-2 hover:bg-slate-100 rounded-full transition-colors hidden md:block">
            <HelpCircle size={18} />
          </button>
        </div>

        {/* Profile */}
        <div className="ml-2 relative">
          <img 
            src="https://picsum.photos/100/100" 
            alt="Profile" 
            className="w-9 h-9 rounded-full border border-slate-200 object-cover cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-primary-500 transition-all"
          />
        </div>

         <button className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hidden md:block">
            <Grid size={18} />
          </button>
      </div>
    </header>
  );
};

const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);
