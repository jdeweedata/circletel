
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { 
  managedITItems, 
  connectivityItems, 
  resourcesItems
} from './NavigationData';

interface MobileMenuProps {
  isMenuOpen: boolean;
  setIsMenuOpen: (isOpen: boolean) => void;
}

const MobileMenu = ({ isMenuOpen, setIsMenuOpen }: MobileMenuProps) => {
  const location = useLocation();
  const currentPath = location.pathname;

  // Helper to check if a path is currently active
  const isActive = (path: string) => {
    return currentPath === path || 
           (path !== '/' && currentPath.startsWith(path));
  };

  // Helper to determine which accordion items should be defaultOpen
  const getDefaultValue = (): string[] => {
    const openSections = [];
    
    if (currentPath.includes('/services/') || currentPath === '/services' || 
        currentPath === '/pricing' || currentPath === '/bundles') {
      openSections.push('managed-it');
    }
    
    if (currentPath.includes('/connectivity/')) {
      openSections.push('connectivity');
    }
    
    if (currentPath.includes('/resources/') || currentPath === '/resources') {
      openSections.push('resources');
    }
    
    return openSections;
  };

  if (!isMenuOpen) return null;
  
  return (
    <nav className="mt-4 bg-white animate-fade-in px-1">
      <div className="flex flex-col gap-2">
        {/* Single links */}
        <Link 
          to="/" 
          className={`py-2.5 px-3 font-medium rounded-md ${isActive('/') ? 'bg-accent text-accent-foreground' : 'hover:bg-muted/50'}`}
          onClick={() => setIsMenuOpen(false)}
        >
          Home
        </Link>
        
        <Link 
          to="/services" 
          className={`py-2.5 px-3 font-medium rounded-md ${isActive('/services') && !currentPath.includes('/services/') ? 'bg-accent text-accent-foreground' : 'hover:bg-muted/50'}`}
          onClick={() => setIsMenuOpen(false)}
        >
          Managed IT
        </Link>
        
        {/* Accordion menus */}
        <Accordion type="multiple" defaultValue={getDefaultValue()} className="w-full">
          <AccordionItem value="managed-it" className="border-0">
            <AccordionTrigger className="py-2.5 px-3 font-medium hover:bg-muted/50 hover:no-underline rounded-md">
              IT Solutions
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col space-y-1 pl-4">
                {managedITItems.map((item) => (
                  <Link 
                    key={item.name}
                    to={item.href}
                    className={`py-2 px-3 rounded-md text-sm ${isActive(item.href) ? 'bg-accent text-accent-foreground' : 'hover:bg-muted/50'}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="connectivity" className="border-0">
            <AccordionTrigger className="py-2.5 px-3 font-medium hover:bg-muted/50 hover:no-underline rounded-md">
              Connectivity
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col space-y-1 pl-4">
                <Link 
                  to="/connectivity"
                  className={`py-2 px-3 rounded-md text-sm ${isActive('/connectivity') && !currentPath.includes('/connectivity/') ? 'bg-accent text-accent-foreground' : 'hover:bg-muted/50'}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Wi-Fi as a Service
                </Link>
                {connectivityItems.map((item) => (
                  <Link 
                    key={item.name}
                    to={item.href}
                    className={`py-2 px-3 rounded-md text-sm ${isActive(item.href) ? 'bg-accent text-accent-foreground' : 'hover:bg-muted/50'}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="resources" className="border-0">
            <AccordionTrigger className="py-2.5 px-3 font-medium hover:bg-muted/50 hover:no-underline rounded-md">
              Resources
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col space-y-1 pl-4">
                {resourcesItems.map((item) => (
                  <Link 
                    key={item.name}
                    to={item.href}
                    className={`py-2 px-3 rounded-md text-sm ${isActive(item.href) ? 'bg-accent text-accent-foreground' : 'hover:bg-muted/50'}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        
        <div className="pt-2">
          <Button asChild className="w-full" onClick={() => setIsMenuOpen(false)}>
            <Link to="/contact">Contact Us</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default MobileMenu;
