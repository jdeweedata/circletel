
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

// Dropdown menu component
const DropdownMenu = ({ title, items }: { title: string, items: { name: string, href: string }[] }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative group">
      <button 
        className="flex items-center gap-1 font-bold text-circleTel-darkNeutral hover:text-circleTel-orange"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        {title}
        <ChevronDown size={16} />
      </button>
      {isOpen && (
        <div 
          className="absolute top-full left-0 mt-2 w-48 bg-circleTel-lightNeutral rounded-lg shadow-lg py-2 z-50"
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
        >
          {items.map((item, index) => (
            <Link 
              key={index} 
              to={item.href} 
              className="block px-4 py-2 text-circleTel-darkNeutral hover:bg-white hover:text-circleTel-orange"
              onClick={() => setIsOpen(false)}
            >
              {item.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  
  const servicesDropdown = [
    { name: "Small Business Recipes", href: "/services/small-business" },
    { name: "Mid-Size Business Recipes", href: "/services/mid-size" },
    { name: "Growth-Ready Recipes", href: "/services/growth-ready" }
  ];

  const aboutDropdown = [
    { name: "Our Story", href: "/about/story" },
    { name: "Our Team", href: "/about/team" },
    { name: "Certifications", href: "/about/certifications" }
  ];

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm w-full">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <div className="h-10 w-10 bg-circleTel-orange rounded-full flex items-center justify-center text-white font-bold">CT</div>
            <span className="ml-2 text-xl font-bold text-circleTel-darkNeutral">CircleTel</span>
          </Link>

          {/* Mobile Menu Button */}
          {isMobile && (
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-circleTel-darkNeutral focus:outline-none"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}

          {/* Desktop Navigation */}
          {!isMobile && (
            <nav className="flex items-center gap-8">
              <Link to="/" className="font-bold text-circleTel-darkNeutral hover:text-circleTel-orange">Home</Link>
              <DropdownMenu title="Services" items={servicesDropdown} />
              <Link to="/pricing" className="font-bold text-circleTel-darkNeutral hover:text-circleTel-orange">Pricing</Link>
              <DropdownMenu title="About" items={aboutDropdown} />
              <Link to="/case-studies" className="font-bold text-circleTel-darkNeutral hover:text-circleTel-orange">Case Studies</Link>
              <Link to="/blog" className="font-bold text-circleTel-darkNeutral hover:text-circleTel-orange">Blog</Link>
              <Link to="/contact" className="font-bold text-circleTel-darkNeutral hover:text-circleTel-orange">Contact</Link>
              <Button asChild className="primary-button">
                <Link to="/resources/it-health">Get a Free IT Assessment</Link>
              </Button>
            </nav>
          )}
        </div>

        {/* Mobile Navigation */}
        {isMobile && isMenuOpen && (
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
                to="/blog" 
                className="font-bold text-circleTel-darkNeutral hover:text-circleTel-orange py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Blog
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
        )}
      </div>
    </header>
  );
};

export default Navbar;
