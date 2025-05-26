
import React from 'react';
import { Link } from 'react-router-dom';
import { Linkedin, X, Mail, Phone, MapPin, Facebook } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-circleTel-darkNeutral text-white py-12">
      <div className="container mx-auto px-4">
        {/* Contact Bar */}
        <div className="bg-circleTel-secondaryNeutral bg-opacity-20 rounded-lg p-4 mb-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 mb-4 md:mb-0">
            <div className="flex items-center">
              <Phone size={18} className="mr-2 text-circleTel-orange" />
              <span className="text-circleTel-lightNeutral">087 087 6305</span>
            </div>
            <div className="flex items-center">
              <Mail size={18} className="mr-2 text-circleTel-orange" />
              <span className="text-circleTel-lightNeutral">contactus@circletel.co.za</span>
            </div>
          </div>
          <Link to="/contact" className="inline-block bg-circleTel-orange text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-opacity-90 transition">
            Contact Us
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Logo and Intro */}
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center">
              <img src="/lovable-uploads/0d94be75-5c0a-44bf-95fa-777a85da966e.png" alt="CircleTel Logo" className="h-[80px] sm:h-[100px] bg-white rounded-md p-1 w-auto" width="500" height="500" />
            </Link>
            <p className="mt-4 text-circleTel-lightNeutral">
              Making IT simple and affordable for businesses of all sizes. We provide expert IT services with a recipe for success.
            </p>
            <div className="mt-4 flex space-x-2">
              <a href="https://www.facebook.com/circletelsa" target="_blank" rel="noopener noreferrer" className="bg-circleTel-secondaryNeutral hover:bg-circleTel-orange rounded-full p-2 transition-colors duration-300">
                <Facebook size={18} />
              </a>
              <a href="https://www.linkedin.com/company/circle-tel-sa" target="_blank" rel="noopener noreferrer" className="bg-circleTel-secondaryNeutral hover:bg-circleTel-orange rounded-full p-2 transition-colors duration-300">
                <Linkedin size={18} />
              </a>
              <a href="https://x.com/CircleTel" target="_blank" rel="noopener noreferrer" className="bg-circleTel-secondaryNeutral hover:bg-circleTel-orange rounded-full p-2 transition-colors duration-300">
                <X size={18} />
              </a>
            </div>
          </div>

          {/* Managed IT Services */}
          <div className="col-span-1">
            <h3 className="font-bold text-lg mb-4">Managed IT</h3>
            <ul className="space-y-2">
              <li><Link to="/services" className="hover:text-circleTel-orange transition-colors">Complete IT Management</Link></li>
              <li><Link to="/services/small-business" className="hover:text-circleTel-orange transition-colors">Small Business IT</Link></li>
              <li><Link to="/services/mid-size" className="hover:text-circleTel-orange transition-colors">Mid-Size Business IT</Link></li>
              <li><Link to="/services/growth-ready" className="hover:text-circleTel-orange transition-colors">Growth-Ready IT</Link></li>
              <li><Link to="/services/security" className="hover:text-circleTel-orange transition-colors">Security Solutions</Link></li>
              <li><Link to="/pricing" className="hover:text-circleTel-orange transition-colors">Pricing</Link></li>
            </ul>
          </div>

          {/* Connectivity & Bundles */}
          <div className="col-span-1">
            <h3 className="font-bold text-lg mb-4">Connectivity & Bundles</h3>
            <ul className="space-y-2">
              <li><Link to="/connectivity/wifi-as-a-service" className="hover:text-circleTel-orange transition-colors">Wi-Fi as a Service</Link></li>
              <li><Link to="/connectivity/fixed-wireless" className="hover:text-circleTel-orange transition-colors">Fixed Wireless</Link></li>
              <li><Link to="/connectivity/fibre" className="hover:text-circleTel-orange transition-colors">Fibre</Link></li>
              <li><Link to="/bundles" className="hover:text-circleTel-orange transition-colors">Service Bundles</Link></li>
              <li><Link to="/bundles/business-connect" className="hover:text-circleTel-orange transition-colors">Business Connect</Link></li>
              <li><Link to="/bundles/business-pro" className="hover:text-circleTel-orange transition-colors">Business Pro</Link></li>
              <li><Link to="/bundles/home-soho-resilience" className="hover:text-circleTel-orange transition-colors">Home & SOHO</Link></li>
            </ul>
          </div>

          {/* Cloud & Resources */}
          <div className="col-span-1">
            <h3 className="font-bold text-lg mb-4">Cloud & Resources</h3>
            <ul className="space-y-2">
              <li><Link to="/cloud/migration" className="hover:text-circleTel-orange transition-colors">Cloud Migration</Link></li>
              <li><Link to="/cloud/hosting" className="hover:text-circleTel-orange transition-colors">Hosting Solutions</Link></li>
              <li><Link to="/cloud/backup" className="hover:text-circleTel-orange transition-colors">Backup & Recovery</Link></li>
              <li><Link to="/cloud/virtual-desktops" className="hover:text-circleTel-orange transition-colors">Virtual Desktops</Link></li>
              <li><Link to="/resources" className="hover:text-circleTel-orange transition-colors">Resources Hub</Link></li>
              <li><Link to="/resources/it-health" className="hover:text-circleTel-orange transition-colors">IT Assessment</Link></li>
              <li><Link to="/resources/power-backup" className="hover:text-circleTel-orange transition-colors">Power Backup</Link></li>
            </ul>
          </div>

          {/* Company & Support */}
          <div className="col-span-1">
            <h3 className="font-bold text-lg mb-4">Company & Support</h3>
            <ul className="space-y-2">
              <li><Link to="/about" className="hover:text-circleTel-orange transition-colors">Our Story</Link></li>
              <li><Link to="/about/team" className="hover:text-circleTel-orange transition-colors">Our Team</Link></li>
              <li><Link to="/about/certifications" className="hover:text-circleTel-orange transition-colors">Certifications</Link></li>
              <li><Link to="/case-studies" className="hover:text-circleTel-orange transition-colors">Case Studies</Link></li>
              <li><Link to="/blog" className="hover:text-circleTel-orange transition-colors">Blog</Link></li>
              <li><Link to="/resources/connectivity-guide" className="hover:text-circleTel-orange transition-colors">Connectivity Guide</Link></li>
              <li><Link to="/resources/wifi-toolkit" className="hover:text-circleTel-orange transition-colors">Wi-Fi Toolkit</Link></li>
              <li><Link to="/privacy-policy" className="hover:text-circleTel-orange transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms-of-service" className="hover:text-circleTel-orange transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-circleTel-lightNeutral mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} CircleTel. All rights reserved.
            </p>
            <div className="flex items-center">
              <MapPin size={16} className="mr-2 text-circleTel-orange" />
              <p className="text-sm text-circleTel-lightNeutral">
                West House, 7 Autumn Road, Rivonia, Johannesburg, 2128
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
