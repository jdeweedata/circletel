
import React from 'react';
import { Check } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const VirtualDesktopsPricing = () => {
  return (
    <section className="py-16 bg-circleTel-lightNeutral">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-4">Simple, Transparent Pricing</h2>
          <p className="text-circleTel-secondaryNeutral max-w-2xl mx-auto">
            Choose the virtual desktop plan that fits your business needs. All plans include 24/7 support and monitoring.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-6 border-b">
              <h3 className="font-bold text-xl mb-2">Basic</h3>
              <div className="flex items-baseline">
                <span className="text-3xl font-bold">R109</span>
                <span className="text-circleTel-secondaryNeutral ml-1">/user/month</span>
              </div>
              <p className="text-sm text-circleTel-secondaryNeutral mt-2">
                Perfect for basic office applications
              </p>
            </div>
            <div className="p-6">
              <ul className="space-y-3">
                <li className="flex items-center">
                  <Check className="text-green-500 mr-2" size={18} />
                  <span>2 vCPUs</span>
                </li>
                <li className="flex items-center">
                  <Check className="text-green-500 mr-2" size={18} />
                  <span>4GB RAM</span>
                </li>
                <li className="flex items-center">
                  <Check className="text-green-500 mr-2" size={18} />
                  <span>100GB Storage</span>
                </li>
                <li className="flex items-center">
                  <Check className="text-green-500 mr-2" size={18} />
                  <span>Standard Support</span>
                </li>
              </ul>
              <Button asChild className="w-full mt-6">
                <Link href="/contact">Get Started</Link>
              </Button>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden border-2 border-circleTel-orange relative">
            <div className="absolute top-0 right-0 bg-circleTel-orange text-white text-xs py-1 px-3 rounded-bl-lg">
              Popular
            </div>
            <div className="p-6 border-b">
              <h3 className="font-bold text-xl mb-2">Business</h3>
              <div className="flex items-baseline">
                <span className="text-3xl font-bold">R189</span>
                <span className="text-circleTel-secondaryNeutral ml-1">/user/month</span>
              </div>
              <p className="text-sm text-circleTel-secondaryNeutral mt-2">
                Ideal for most business users
              </p>
            </div>
            <div className="p-6">
              <ul className="space-y-3">
                <li className="flex items-center">
                  <Check className="text-green-500 mr-2" size={18} />
                  <span>4 vCPUs</span>
                </li>
                <li className="flex items-center">
                  <Check className="text-green-500 mr-2" size={18} />
                  <span>8GB RAM</span>
                </li>
                <li className="flex items-center">
                  <Check className="text-green-500 mr-2" size={18} />
                  <span>250GB Storage</span>
                </li>
                <li className="flex items-center">
                  <Check className="text-green-500 mr-2" size={18} />
                  <span>Priority Support</span>
                </li>
                <li className="flex items-center">
                  <Check className="text-green-500 mr-2" size={18} />
                  <span>Application Installation</span>
                </li>
              </ul>
              <Button asChild className="w-full mt-6">
                <Link href="/contact">Get Started</Link>
              </Button>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-6 border-b">
              <h3 className="font-bold text-xl mb-2">Performance</h3>
              <div className="flex items-baseline">
                <span className="text-3xl font-bold">R289</span>
                <span className="text-circleTel-secondaryNeutral ml-1">/user/month</span>
              </div>
              <p className="text-sm text-circleTel-secondaryNeutral mt-2">
                For power users and specialized applications
              </p>
            </div>
            <div className="p-6">
              <ul className="space-y-3">
                <li className="flex items-center">
                  <Check className="text-green-500 mr-2" size={18} />
                  <span>8 vCPUs</span>
                </li>
                <li className="flex items-center">
                  <Check className="text-green-500 mr-2" size={18} />
                  <span>16GB RAM</span>
                </li>
                <li className="flex items-center">
                  <Check className="text-green-500 mr-2" size={18} />
                  <span>500GB Storage</span>
                </li>
                <li className="flex items-center">
                  <Check className="text-green-500 mr-2" size={18} />
                  <span>Priority Support</span>
                </li>
                <li className="flex items-center">
                  <Check className="text-green-500 mr-2" size={18} />
                  <span>Dedicated Resources</span>
                </li>
                <li className="flex items-center">
                  <Check className="text-green-500 mr-2" size={18} />
                  <span>GPU Options Available</span>
                </li>
              </ul>
              <Button asChild className="w-full mt-6">
                <Link href="/contact">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="font-bold text-xl mb-4 text-center">Need a Custom Solution?</h3>
          <p className="text-center text-circleTel-secondaryNeutral mb-6">
            Contact us for tailored virtual desktop solutions designed for your specific business requirements.
          </p>
          <div className="flex justify-center">
            <Button asChild variant="outline">
              <Link href="/contact">Contact Our Team</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VirtualDesktopsPricing;
