
import React from 'react';
import { Link } from 'react-router-dom';
import { Linkedin, X } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-circleTel-darkNeutral text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Intro - Updated with responsive sizing */}
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center">
              <img 
                src="/lovable-uploads/0d94be75-5c0a-44bf-95fa-777a85da966e.png" 
                alt="CircleTel Logo" 
                className="h-10 sm:h-12 bg-white rounded-md p-1 w-auto" 
                width="500"
                height="500"
              />
            </Link>
            <p className="mt-4 text-circleTel-lightNeutral">
              Simplified IT solutions for businesses of all sizes. We provide expert IT services with a recipe for success.
            </p>
            <div className="mt-4 flex space-x-2">
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="bg-circleTel-secondaryNeutral hover:bg-circleTel-orange rounded-full p-2 transition-colors duration-300">
                <Linkedin size={18} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="bg-circleTel-secondaryNeutral hover:bg-circleTel-orange rounded-full p-2 transition-colors duration-300">
                <X size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-span-1">
            <h3 className="font-bold text-lg mb-4">Services</h3>
            <ul className="space-y-2">
              <li><Link to="/services/small-business" className="hover:text-circleTel-orange transition-colors">Small Business IT</Link></li>
              <li><Link to="/services/mid-size" className="hover:text-circleTel-orange transition-colors">Mid-Size Business IT</Link></li>
              <li><Link to="/services/growth-ready" className="hover:text-circleTel-orange transition-colors">Growth-Ready IT</Link></li>
              <li><Link to="/pricing" className="hover:text-circleTel-orange transition-colors">Pricing</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div className="col-span-1">
            <h3 className="font-bold text-lg mb-4">Company</h3>
            <ul className="space-y-2">
              <li><Link to="/about/story" className="hover:text-circleTel-orange transition-colors">Our Story</Link></li>
              <li><Link to="/about/team" className="hover:text-circleTel-orange transition-colors">Our Team</Link></li>
              <li><Link to="/about/certifications" className="hover:text-circleTel-orange transition-colors">Certifications</Link></li>
              <li><Link to="/case-studies" className="hover:text-circleTel-orange transition-colors">Case Studies</Link></li>
              <li><Link to="/blog" className="hover:text-circleTel-orange transition-colors">Blog</Link></li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div className="col-span-1">
            <h3 className="font-bold text-lg mb-4">Support</h3>
            <ul className="space-y-2">
              <li><Link to="/contact" className="hover:text-circleTel-orange transition-colors">Contact Us</Link></li>
              <li><Link to="/resources" className="hover:text-circleTel-orange transition-colors">Resources</Link></li>
              <li><Link to="/resources/it-health" className="hover:text-circleTel-orange transition-colors">IT Assessment</Link></li>
              <li><a href="#" className="hover:text-circleTel-orange transition-colors">Support Portal</a></li>
              <li><a href="#" className="hover:text-circleTel-orange transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-circleTel-orange transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-circleTel-lightNeutral">
          <p>&copy; {new Date().getFullYear()} CircleTel. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
