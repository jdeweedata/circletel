
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

type NavigationItem = {
  name: string;
  href: string;
};

interface MobileNavigationProps {
  isMenuOpen: boolean;
  setIsMenuOpen: (isOpen: boolean) => void;
  servicesDropdown: NavigationItem[];
  connectivityDropdown: NavigationItem[];
  aboutDropdown: NavigationItem[];
}

const MobileNavigation = ({ 
  isMenuOpen, 
  setIsMenuOpen, 
  servicesDropdown,
  connectivityDropdown,
  aboutDropdown 
}: MobileNavigationProps) => {
  if (!isMenuOpen) return null;
  
  return (
    <nav className="mt-4 bg-white animate-fade-in">
      <div className="flex flex-col gap-4 py-4">
        <Link 
          to="/" 
          className="font-bold text-circleTel-darkNeutral hover:text-circleTel-orange py-2" 
          onClick={() => setIsMenuOpen(false)}
        >
          Home
        </Link>
        
        <Link 
          to="/services" 
          className="font-bold text-circleTel-darkNeutral hover:text-circleTel-orange py-2" 
          onClick={() => setIsMenuOpen(false)}
        >
          Managed IT
        </Link>
        
        <details className="group">
          <summary className="flex cursor-pointer items-center justify-between font-bold text-circleTel-darkNeutral">
            IT Solutions
            <ChevronDown size={16} className="transition-transform group-open:rotate-180" />
          </summary>
          <div className="mt-2 ml-4 flex flex-col gap-2">
            {servicesDropdown.map((item, index) => (
              <Link 
                key={index} 
                to={item.href} 
                className="text-circleTel-darkNeutral hover:text-circleTel-orange py-1" 
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </details>
        
        <Link 
          to="/connectivity/wifi-as-a-service" 
          className="font-bold text-circleTel-darkNeutral hover:text-circleTel-orange py-2" 
          onClick={() => setIsMenuOpen(false)}
        >
          Wi-Fi as a Service
        </Link>
        
        <details className="group">
          <summary className="flex cursor-pointer items-center justify-between font-bold text-circleTel-darkNeutral">
            Connectivity
            <ChevronDown size={16} className="transition-transform group-open:rotate-180" />
          </summary>
          <div className="mt-2 ml-4 flex flex-col gap-2">
            {connectivityDropdown.map((item, index) => (
              <Link 
                key={index} 
                to={item.href} 
                className="text-circleTel-darkNeutral hover:text-circleTel-orange py-1" 
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </details>
        
        <Link 
          to="/pricing" 
          className="font-bold text-circleTel-darkNeutral hover:text-circleTel-orange py-2" 
          onClick={() => setIsMenuOpen(false)}
        >
          Pricing
        </Link>
        
        <details className="group">
          <summary className="flex cursor-pointer items-center justify-between font-bold text-circleTel-darkNeutral">
            About
            <ChevronDown size={16} className="transition-transform group-open:rotate-180" />
          </summary>
          <div className="mt-2 ml-4 flex flex-col gap-2">
            {aboutDropdown.map((item, index) => (
              <Link 
                key={index} 
                to={item.href} 
                className="text-circleTel-darkNeutral hover:text-circleTel-orange py-1" 
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </details>
        
        <Link 
          to="/case-studies" 
          className="font-bold text-circleTel-darkNeutral hover:text-circleTel-orange py-2" 
          onClick={() => setIsMenuOpen(false)}
        >
          Case Studies
        </Link>
        
        <Button asChild className="primary-button w-full">
          <Link to="/contact" onClick={() => setIsMenuOpen(false)}>
            Contact Us
          </Link>
        </Button>
      </div>
    </nav>
  );
};

export default MobileNavigation;
