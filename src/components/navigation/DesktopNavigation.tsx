
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import DropdownMenu from './DropdownMenu';

type NavigationItem = {
  name: string;
  href: string;
};

interface DesktopNavigationProps {
  servicesDropdown: NavigationItem[];
  connectivityDropdown: NavigationItem[];
  aboutDropdown: NavigationItem[];
}

const DesktopNavigation = ({ 
  servicesDropdown, 
  connectivityDropdown,
  aboutDropdown 
}: DesktopNavigationProps) => {
  return (
    <nav className="flex items-center gap-6">
      <Link to="/" className="font-bold text-circleTel-darkNeutral hover:text-circleTel-orange">Home</Link>
      
      <Link to="/services" className="font-bold text-circleTel-darkNeutral hover:text-circleTel-orange">Managed IT</Link>
      
      <DropdownMenu title="IT Solutions" items={servicesDropdown} />
      
      <Link to="/connectivity" className="font-bold text-circleTel-darkNeutral hover:text-circleTel-orange">Wi-Fi as a Service</Link>
      
      <DropdownMenu title="Connectivity" items={connectivityDropdown} />
      
      <Link to="/pricing" className="font-bold text-circleTel-darkNeutral hover:text-circleTel-orange">Pricing</Link>
      
      <DropdownMenu title="About" items={aboutDropdown} />
      
      <Link to="/case-studies" className="font-bold text-circleTel-darkNeutral hover:text-circleTel-orange">Case Studies</Link>
      
      <Button asChild className="primary-button">
        <Link to="/contact">Contact Us</Link>
      </Button>
    </nav>
  );
};

export default DesktopNavigation;
