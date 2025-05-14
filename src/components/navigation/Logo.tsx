
import React from 'react';
import { Link } from 'react-router-dom';

const Logo = () => {
  return (
    <Link to="/" className="flex items-center">
      <img 
        src="/lovable-uploads/0d94be75-5c0a-44bf-95fa-777a85da966e.png" 
        alt="CircleTel Logo" 
        className="h-8 sm:h-10 md:h-12 w-auto"
        width="500"
        height="500"
      />
    </Link>
  );
};

export default Logo;
