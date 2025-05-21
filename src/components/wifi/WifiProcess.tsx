
import React from 'react';
import { WifiHigh, Laptop, LineChart, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const WifiProcess = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-circleTel-darkNeutral text-center mb-12">
          How Wi-Fi as a Service Works
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="bg-white rounded-full p-4 w-16 h-16 flex items-center justify-center text-circleTel-orange mx-auto mb-4 shadow-lg relative">
              <span className="absolute -top-2 -right-2 bg-circleTel-orange text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">1</span>
              <Laptop size={28} />
            </div>
            <h3 className="text-lg font-bold text-circleTel-darkNeutral mb-2">Assessment</h3>
            <p className="text-circleTel-secondaryNeutral text-sm">We analyze your site and design a custom Wi-Fi solution for your needs.</p>
          </div>
          
          <div className="text-center">
            <div className="bg-white rounded-full p-4 w-16 h-16 flex items-center justify-center text-circleTel-orange mx-auto mb-4 shadow-lg relative">
              <span className="absolute -top-2 -right-2 bg-circleTel-orange text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">2</span>
              <WifiHigh size={28} />
            </div>
            <h3 className="text-lg font-bold text-circleTel-darkNeutral mb-2">Installation</h3>
            <p className="text-circleTel-secondaryNeutral text-sm">Our technicians install and configure all hardware to ensure optimal coverage.</p>
          </div>
          
          <div className="text-center">
            <div className="bg-white rounded-full p-4 w-16 h-16 flex items-center justify-center text-circleTel-orange mx-auto mb-4 shadow-lg relative">
              <span className="absolute -top-2 -right-2 bg-circleTel-orange text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">3</span>
              <LineChart size={28} />
            </div>
            <h3 className="text-lg font-bold text-circleTel-darkNeutral mb-2">Management</h3>
            <p className="text-circleTel-secondaryNeutral text-sm">We proactively monitor and manage your network 24/7/365.</p>
          </div>
          
          <div className="text-center">
            <div className="bg-white rounded-full p-4 w-16 h-16 flex items-center justify-center text-circleTel-orange mx-auto mb-4 shadow-lg relative">
              <span className="absolute -top-2 -right-2 bg-circleTel-orange text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">4</span>
              <CheckCircle size={28} />
            </div>
            <h3 className="text-lg font-bold text-circleTel-darkNeutral mb-2">Optimization</h3>
            <p className="text-circleTel-secondaryNeutral text-sm">We continuously optimize your network performance and security.</p>
          </div>
        </div>
        
        <div className="text-center mt-12">
          <Button asChild className="primary-button flex items-center gap-2">
            <Link to="/contact">
              <WifiHigh size={18} />
              Get Started with WaaS
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default WifiProcess;
