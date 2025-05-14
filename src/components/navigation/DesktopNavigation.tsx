
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
  aboutDropdown: NavigationItem[];
}

const DesktopNavigation = ({ servicesDropdown, aboutDropdown }: DesktopNavigationProps) => {
  return (
    <nav className="flex items-center gap-8">
      <Link to="/" className="font-bold text-circleTel-darkNeutral hover:text-circleTel-orange">Home</Link>
      <DropdownMenu title="Services" items={servicesDropdown} />
      <Link to="/pricing" className="font-bold text-circleTel-darkNeutral hover:text-circleTel-orange">Pricing</Link>
      <DropdownMenu title="About" items={aboutDropdown} />
      <Link to="/case-studies" className="font-bold text-circleTel-darkNeutral hover:text-circleTel-orange">Case Studies</Link>
      <Link to="/connectivity" className="font-bold text-circleTel-darkNeutral hover:text-circleTel-orange">Connectivity</Link>
      
      <Button asChild className="primary-button">
        <Link to="/resources/it-health">Get a Free IT Assessment</Link>
      </Button>
    </nav>
  );
};

export default DesktopNavigation;
