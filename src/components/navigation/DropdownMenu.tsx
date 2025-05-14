
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';

type DropdownItem = {
  name: string;
  href: string;
};

interface DropdownMenuProps {
  title: string;
  items: DropdownItem[];
}

const DropdownMenu = ({ title, items }: DropdownMenuProps) => {
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

export default DropdownMenu;
