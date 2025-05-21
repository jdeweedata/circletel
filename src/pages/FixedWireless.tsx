
import React from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { Circle, CheckCircle, ShieldCheck, Clock, LineChart, Laptop, MessageSquarePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link } from 'react-router-dom';

const FixedWireless = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-circleTel-lightNeutral to-white py-20">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="text-left">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-circleTel-darkNeutral mb-4">
                  Fast internet without waiting for fibre
                </h1>
                <p className="text-lg md:text-xl text-circleTel-secondaryNeutral mb-6">
                  High-performance wireless connectivity deployed in days, not months. Perfect for locations without fibre access.
                </p>
                <div className="bg-circleTel-lightNeutral rounded-lg p-4 mb-6">
                  <p className="font-space-mono text-sm text-circleTel-secondaryNeutral mb-1">Starting from</p>
                  <p className="text-3xl font-bold text-circleTel-darkNeutral">R1,500/month</p>
                  <p className="font-space-mono text-xs text-circleTel-secondaryNeutral">(10Mbps)</p>
                </div>
                <Button asChild className="primary-button flex items-center gap-2">
                  <Link to="/contact">
                    <MessageSquarePlus size={18} />
                    Explore Wireless Options
                  </Link>
                </Button>
              </div>
              
              <div className="relative bg-white rounded-lg p-6 shadow-lg border border-circleTel-orange">
                <div className="flex items-center mb-4">
                  <div className="bg-circleTel-orange rounded-full p-3 mr-3 text-white">
                    <Circle size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-circleTel-darkNeutral">Perfect For</h3>
                </div>
                
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="text-circleTel-orange mr-2 mt-1" size={18} />
                    <span className="text-circleTel-secondaryNeutral">Businesses in areas without fibre coverage</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="text-circleTel-orange mr-2 mt-1" size={18} />
                    <span className="text-circleTel-secondaryNeutral">Companies needing quick connectivity deployment</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="text-circleTel-orange mr-2 mt-1" size={18} />
                    <span className="text-circleTel-secondaryNeutral">Start-ups and rapidly growing businesses</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="text-circleTel-orange mr-2 mt-1" size={18} />
                    <span className="text-circleTel-secondaryNeutral">Temporary locations or pop-up operations</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
        
        {/* What is FWA Section */}
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-circleTel-darkNeutral mb-4">
                What is Fixed Wireless Access?
              </h2>
              <p className="text-lg text-circleTel-secondaryNeutral">
                FWA = High-speed internet without cables. It uses radio signals instead of physical cables to deliver reliable connectivity to your business locations quickly.
              </p>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-circleTel-darkNeutral text-center mb-12">
              Key Benefits for Your Business
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-circleTel-lightNeutral rounded-full p-4 w-16 h-16 flex items-center justify-center text-circleTel-orange mx-auto mb-4">
                  <Clock size={28} />
                </div>
                <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-2">Fast Deployment</h3>
                <p className="text-circleTel-secondaryNeutral">Connect your business in just 2-5 days without waiting months for physical cable installation.</p>
              </div>
              
              <div className="text-center">
                <div className="bg-circleTel-lightNeutral rounded-full p-4 w-16 h-16 flex items-center justify-center text-circleTel-orange mx-auto mb-4">
                  <Circle size={28} />
                </div>
                <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-2">Flexible Scaling</h3>
                <p className="text-circleTel-secondaryNeutral">Start with what you need now (10Mbps) and easily upgrade as your business grows (up to 100Mbps).</p>
              </div>
              
              <div className="text-center">
                <div className="bg-circleTel-lightNeutral rounded-full p-4 w-16 h-16 flex items-center justify-center text-circleTel-orange mx-auto mb-4">
                  <ShieldCheck size={28} />
                </div>
                <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-2">Business Resilience</h3>
                <p className="text-circleTel-secondaryNeutral">Keep your operations running with built-in redundancy and 99.5% uptime guarantee.</p>
              </div>
            </div>
            
            <div className="mt-16 bg-circleTel-lightNeutral rounded-lg p-8">
              <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-4 text-center">Technical Specifications</h3>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Feature</TableHead>
                    <TableHead>Specification</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Throughput</TableCell>
                    <TableCell>10-100Mbps (symmetrical options available)</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Latency</TableCell>
                    <TableCell>&lt;20ms</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Deployment Time</TableCell>
                    <TableCell>2-5 business days</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Equipment</TableCell>
                    <TableCell>Receiver dish/antenna and router included</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Reliability</TableCell>
                    <TableCell>99.5% uptime SLA</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Support</TableCell>
                    <TableCell>24/7/365 technical support</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </section>
        
        {/* Business Benefits Section */}
        <section className="py-16 bg-circleTel-lightNeutral">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-circleTel-darkNeutral text-center mb-12">
              Business Advantages of Fixed Wireless
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-bold text-circleTel-darkNeutral flex items-center mb-4">
                  <CheckCircle className="text-circleTel-orange mr-2" size={20} />
                  No Infrastructure Headaches
                </h3>
                <p className="text-circleTel-secondaryNeutral ml-8">
                  Avoid disruption and expense of trenching or cable installation. Setup is quick and non-invasive.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-bold text-circleTel-darkNeutral flex items-center mb-4">
                  <CheckCircle className="text-circleTel-orange mr-2" size={20} />
                  Business Continuity
                </h3>
                <p className="text-circleTel-secondaryNeutral ml-8">
                  Keep your operations running with reliable connectivity that includes redundant options for critical systems.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-bold text-circleTel-darkNeutral flex items-center mb-4">
                  <CheckCircle className="text-circleTel-orange mr-2" size={20} />
                  Cost Effectiveness
                </h3>
                <p className="text-circleTel-secondaryNeutral ml-8">
                  Save up to 40% compared to fibre installation in areas where trenching is complex or expensive.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-bold text-circleTel-darkNeutral flex items-center mb-4">
                  <CheckCircle className="text-circleTel-orange mr-2" size={20} />
                  Flexibility
                </h3>
                <p className="text-circleTel-secondaryNeutral ml-8">
                  Perfect for temporary locations, rapid deployment needs, or businesses waiting for fibre installation.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-circleTel-darkNeutral text-center mb-12">
              How Fixed Wireless Access Works
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="bg-white rounded-full p-4 w-16 h-16 flex items-center justify-center text-circleTel-orange mx-auto mb-4 shadow-lg relative">
                  <span className="absolute -top-2 -right-2 bg-circleTel-orange text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">1</span>
                  <Laptop size={28} />
                </div>
                <h3 className="text-lg font-bold text-circleTel-darkNeutral mb-2">Site Survey</h3>
                <p className="text-circleTel-secondaryNeutral text-sm">We check line-of-sight to our nearest access point and assess your location.</p>
              </div>
              
              <div className="text-center">
                <div className="bg-white rounded-full p-4 w-16 h-16 flex items-center justify-center text-circleTel-orange mx-auto mb-4 shadow-lg relative">
                  <span className="absolute -top-2 -right-2 bg-circleTel-orange text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">2</span>
                  <Circle size={28} />
                </div>
                <h3 className="text-lg font-bold text-circleTel-darkNeutral mb-2">Installation</h3>
                <p className="text-circleTel-secondaryNeutral text-sm">We install and aim the receiver for optimal signal strength and performance.</p>
              </div>
              
              <div className="text-center">
                <div className="bg-white rounded-full p-4 w-16 h-16 flex items-center justify-center text-circleTel-orange mx-auto mb-4 shadow-lg relative">
                  <span className="absolute -top-2 -right-2 bg-circleTel-orange text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">3</span>
                  <LineChart size={28} />
                </div>
                <h3 className="text-lg font-bold text-circleTel-darkNeutral mb-2">Configuration</h3>
                <p className="text-circleTel-secondaryNeutral text-sm">We set up your network, security, and connectivity features.</p>
              </div>
              
              <div className="text-center">
                <div className="bg-white rounded-full p-4 w-16 h-16 flex items-center justify-center text-circleTel-orange mx-auto mb-4 shadow-lg relative">
                  <span className="absolute -top-2 -right-2 bg-circleTel-orange text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">4</span>
                  <CheckCircle size={28} />
                </div>
                <h3 className="text-lg font-bold text-circleTel-darkNeutral mb-2">Monitoring</h3>
                <p className="text-circleTel-secondaryNeutral text-sm">We continuously monitor your connection to ensure optimal performance.</p>
              </div>
            </div>
            
            <div className="text-center mt-12">
              <Button asChild className="primary-button flex items-center gap-2">
                <Link to="/contact">
                  <MessageSquarePlus size={18} />
                  Get Started with Fixed Wireless
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default FixedWireless;
