
import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Monitor, Cloud, Lock, Sparkles } from 'lucide-react';

const VirtualDesktopsHero = () => {
  return (
    <section className="bg-white py-16">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="md:w-1/2">
            <h1 className="text-4xl font-bold text-circleTel-darkNeutral mb-4">Virtual Desktop Solutions</h1>
            <p className="text-lg text-circleTel-secondaryNeutral mb-6">
              Access your workspace from anywhere with secure, high-performance virtual desktops that enhance productivity and reduce IT costs.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button asChild className="primary-button">
                <Link href="/contact">Get Started</Link>
              </Button>
              <Button asChild className="outline-button">
                <Link href="/resources/it-health">Free Assessment</Link>
              </Button>
            </div>
          </div>
          <div className="md:w-1/2">
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-circleTel-lightNeutral p-6 rounded-lg flex flex-col items-center text-center">
                <Monitor className="text-circleTel-orange h-12 w-12 mb-4" />
                <h3 className="font-bold mb-2">Any Device</h3>
                <p className="text-sm">Access your desktop from any device, anywhere</p>
              </div>
              <div className="bg-circleTel-lightNeutral p-6 rounded-lg flex flex-col items-center text-center">
                <Cloud className="text-circleTel-orange h-12 w-12 mb-4" />
                <h3 className="font-bold mb-2">Cloud-Powered</h3>
                <p className="text-sm">High-performance computing in the cloud</p>
              </div>
              <div className="bg-circleTel-lightNeutral p-6 rounded-lg flex flex-col items-center text-center">
                <Lock className="text-circleTel-orange h-12 w-12 mb-4" />
                <h3 className="font-bold mb-2">Secure Access</h3>
                <p className="text-sm">Enterprise-grade security for your data</p>
              </div>
              <div className="bg-circleTel-lightNeutral p-6 rounded-lg flex flex-col items-center text-center">
                <Sparkles className="text-circleTel-orange h-12 w-12 mb-4" />
                <h3 className="font-bold mb-2">Easy Management</h3>
                <p className="text-sm">Simplified IT administration and support</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VirtualDesktopsHero;
