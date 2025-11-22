import React from 'react';
import { 
  LayoutDashboard, 
  Box, 
  FileText, 
  ShoppingCart, 
  Users, 
  CheckSquare, 
  Shield, 
  Bell, 
  Zap, 
  Layers, 
  Globe, 
  Wifi, 
  CreditCard, 
  DollarSign, 
  Settings, 
  ChevronDown,
  ChevronLeft,
  Menu,
  User
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', active: false },
    { icon: Box, label: 'Products', hasSub: true },
    { icon: FileText, label: 'Quotes', hasSub: true },
    { icon: ShoppingCart, label: 'Orders', hasSub: true, active: true, subLabel: 'All Orders' },
    { icon: Users, label: 'Customers' },
    { icon: CheckSquare, label: 'Approvals' },
    { icon: Shield, label: 'KYC Review' },
    { icon: Shield, label: 'KYB Compliance' },
    { icon: Bell, label: 'Notifications' },
    { icon: Zap, label: 'Zoho Integration' },
    { icon: Layers, label: 'Integrations', hasSub: true },
    { icon: Globe, label: 'CMS Management' },
    { icon: Wifi, label: 'Coverage', hasSub: true },
    { icon: FileText, label: 'Billing & Revenue', hasSub: true },
    { icon: DollarSign, label: 'Payments', hasSub: true },
  ];

  return (
    <div className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 h-screen sticky top-0 overflow-y-auto scrollbar-hide">
      {/* Logo Area */}
      <div className="p-4 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-2 font-bold text-xl text-gray-800">
          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white">
             <Zap size={18} fill="white" />
          </div>
          <span>Admin Panel</span>
        </div>
        <ChevronLeft size={20} className="text-gray-400 cursor-pointer" />
      </div>

      {/* Navigation */}
      <div className="flex-1 py-4">
        <nav className="space-y-0.5 px-3">
          {navItems.map((item, idx) => (
            <div key={idx}>
              <div className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer group ${item.active ? 'bg-gray-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                <div className="flex items-center gap-3">
                  <item.icon size={18} className={item.active ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'} />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                {item.hasSub && <ChevronDown size={16} className="text-gray-400" />}
              </div>
              
              {/* Submenu for Orders (Hardcoded for demo visual) */}
              {item.label === 'Orders' && item.active && (
                <div className="ml-9 mt-1 space-y-1">
                   <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md cursor-pointer">
                      <div className="w-1 h-1 rounded-full bg-blue-600"></div>
                      All Orders
                   </div>
                   <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-900 cursor-pointer">
                      <div className="w-4 h-4 flex items-center justify-center"><span className="block w-1 h-1 rounded-full border border-gray-400"></span></div>
                      Installation Schedule
                   </div>
                   <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-900 cursor-pointer">
                      <div className="w-4 h-4 flex items-center justify-center"><span className="block w-1 h-1 rounded-full border border-gray-400"></span></div>
                      Technicians
                   </div>
                </div>
              )}
            </div>
          ))}
          
          <div className="pt-4 pb-2 px-3">
             <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Administration</p>
          </div>
          
          <div className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-md cursor-pointer">
             <Layers size={18} />
             <span className="text-sm font-medium">Orchestrator</span>
          </div>
          <div className="flex items-center justify-between px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-md cursor-pointer">
             <div className="flex items-center gap-3">
                <Users size={18} />
                <span className="text-sm font-medium">Users</span>
             </div>
             <ChevronDown size={16} className="text-gray-400" />
          </div>
          <div className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-md cursor-pointer">
             <Settings size={18} />
             <span className="text-sm font-medium">Settings</span>
          </div>

        </nav>
      </div>

      {/* Footer User */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold text-xs">
            D
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">Dev Admin</p>
            <p className="text-xs text-gray-500 truncate">super admin</p>
          </div>
        </div>
      </div>
    </div>
  );
};
