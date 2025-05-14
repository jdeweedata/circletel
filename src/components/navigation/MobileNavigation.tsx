
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
  aboutDropdown: NavigationItem[];
}

const MobileNavigation = ({ 
  isMenuOpen, 
  setIsMenuOpen, 
  servicesDropdown, 
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
        
        <details className="group">
          <summary className="flex cursor-pointer items-center justify-between font-bold text-circleTel-darkNeutral">
            Services
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
        
        <Link 
          to="/connectivity" 
          className="font-bold text-circleTel-darkNeutral hover:text-circleTel-orange py-2" 
          onClick={() => setIsMenuOpen(false)}
        >
          Connectivity
        </Link>
        
        <Link 
          to="/contact" 
          className="font-bold text-circleTel-darkNeutral hover:text-circleTel-orange py-2" 
          onClick={() => setIsMenuOpen(false)}
        >
          Contact
        </Link>
        
        <Button asChild className="primary-button w-full">
          <Link to="/resources/it-health" onClick={() => setIsMenuOpen(false)}>
            Get a Free IT Assessment
          </Link>
        </Button>
      </div>
    </nav>
  );
};

export default MobileNavigation;
