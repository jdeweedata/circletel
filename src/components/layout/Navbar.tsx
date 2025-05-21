
import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import Logo from '@/components/navigation/Logo';
import DesktopNavigation from '@/components/navigation/DesktopNavigation';
import MobileNavigation from '@/components/navigation/MobileNavigation';
import { servicesDropdownItems, aboutDropdownItems, connectivityDropdownItems } from '@/components/navigation/NavigationData';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  
  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm w-full">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Logo />

          {/* Mobile Menu Button */}
          {isMobile && (
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-circleTel-darkNeutral focus:outline-none">
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}

          {/* Desktop Navigation */}
          {!isMobile && (
            <DesktopNavigation 
              servicesDropdown={servicesDropdownItems} 
              connectivityDropdown={connectivityDropdownItems}
              aboutDropdown={aboutDropdownItems} 
            />
          )}
        </div>

        {/* Mobile Navigation */}
        <MobileNavigation 
          isMenuOpen={isMobile && isMenuOpen} 
          setIsMenuOpen={setIsMenuOpen}
          servicesDropdown={servicesDropdownItems}
          connectivityDropdown={connectivityDropdownItems}
          aboutDropdown={aboutDropdownItems}
        />
      </div>
    </header>
  );
};

export default Navbar;
