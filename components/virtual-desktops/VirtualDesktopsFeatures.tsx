
import React from 'react';
import { Check, Globe, Cpu, Shield, Clock } from 'lucide-react';

const VirtualDesktopsFeatures = () => {
  return (
    <section className="py-16 bg-circleTel-lightNeutral">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-4">Powerful Virtual Desktop Features</h2>
          <p className="text-circleTel-secondaryNeutral max-w-2xl mx-auto">
            Our virtual desktop solutions are designed to enhance productivity, improve security, and reduce costs for businesses of all sizes.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-start mb-4">
              <Globe className="text-circleTel-orange mr-4 mt-1" size={24} />
              <div>
                <h3 className="font-bold text-xl mb-2">Access Anywhere</h3>
                <p className="text-circleTel-secondaryNeutral">
                  Access your desktop from any device with an internet connection. Perfect for remote work, travel, and hybrid work environments.
                </p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center">
                    <Check className="text-green-500 mr-2" size={18} />
                    <span>Works on Windows, Mac, iOS, Android devices</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="text-green-500 mr-2" size={18} />
                    <span>Browser-based access option</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="text-green-500 mr-2" size={18} />
                    <span>Consistent experience across all devices</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-start mb-4">
              <Cpu className="text-circleTel-orange mr-4 mt-1" size={24} />
              <div>
                <h3 className="font-bold text-xl mb-2">High Performance</h3>
                <p className="text-circleTel-secondaryNeutral">
                  Experience enterprise-grade computing power regardless of your local device's capabilities.
                </p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center">
                    <Check className="text-green-500 mr-2" size={18} />
                    <span>Scalable computing resources</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="text-green-500 mr-2" size={18} />
                    <span>Fast application performance</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="text-green-500 mr-2" size={18} />
                    <span>Optimized for business applications</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-start mb-4">
              <Shield className="text-circleTel-orange mr-4 mt-1" size={24} />
              <div>
                <h3 className="font-bold text-xl mb-2">Enhanced Security</h3>
                <p className="text-circleTel-secondaryNeutral">
                  Keep your data secure with centralized management and enterprise-grade security measures.
                </p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center">
                    <Check className="text-green-500 mr-2" size={18} />
                    <span>Data never stored on local devices</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="text-green-500 mr-2" size={18} />
                    <span>Centralized security policies</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="text-green-500 mr-2" size={18} />
                    <span>Multi-factor authentication</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-start mb-4">
              <Clock className="text-circleTel-orange mr-4 mt-1" size={24} />
              <div>
                <h3 className="font-bold text-xl mb-2">Simplified IT</h3>
                <p className="text-circleTel-secondaryNeutral">
                  Reduce IT management overhead with centralized deployment, updates, and support.
                </p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center">
                    <Check className="text-green-500 mr-2" size={18} />
                    <span>Centralized software management</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="text-green-500 mr-2" size={18} />
                    <span>Automated updates and patching</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="text-green-500 mr-2" size={18} />
                    <span>Rapid deployment of new workstations</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VirtualDesktopsFeatures;
