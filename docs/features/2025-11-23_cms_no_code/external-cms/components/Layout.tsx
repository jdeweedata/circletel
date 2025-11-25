import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Layout as LayoutIcon, PlusCircle, Settings } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const isPublic = location.pathname.startsWith('/p/');

  if (isPublic) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 fixed h-full z-10 hidden md:flex flex-col">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
            AI
          </div>
          <span className="font-bold text-lg tracking-tight">ContentStudio</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <NavLink to="/" icon={<LayoutIcon size={20} />} label="Dashboard" active={location.pathname === '/'} />
          <NavLink to="/create" icon={<PlusCircle size={20} />} label="New Page" active={location.pathname === '/create'} />
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2 text-sm text-gray-500 hover:text-gray-900 cursor-pointer transition-colors">
            <Settings size={18} />
            <span>Settings</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 transition-all duration-300">
        {children}
      </main>
    </div>
  );
};

interface NavLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}

const NavLink: React.FC<NavLinkProps> = ({ to, icon, label, active }) => (
  <Link
    to={to}
    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
      active
        ? 'bg-blue-50 text-blue-700'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`}
  >
    {icon}
    <span>{label}</span>
  </Link>
);

export default Layout;