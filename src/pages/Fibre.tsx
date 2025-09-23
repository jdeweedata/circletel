
import React from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { CircleCheck, CheckCircle, ShieldCheck, Zap, LineChart, Laptop, MessageSquarePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link } from 'react-router-dom';
import CoverageCheck from '@/components/coverage/CoverageCheck';

const Fibre = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        {/* Coverage Check Hero Section */}
        <CoverageCheck />

        {/* Hero Section */}
        <section className="bg-gradient-to-b from-circleTel-lightNeutral to-white py-20">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="text-left">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-circleTel-darkNeutral mb-4">
                  Blazing-fast fibre for mission-critical business
                </h1>
                <p className="text-lg md:text-xl text-circleTel-secondaryNeutral mb-6">
                  Ultra-reliable fibre connectivity with guaranteed uptime for businesses that can't afford to slow down.
                </p>
                <div className="bg-circleTel-lightNeutral rounded-lg p-4 mb-6">
                  <p className="font-space-mono text-sm text-circleTel-secondaryNeutral mb-1">Starting from</p>
                  <p className="text-3xl font-bold text-circleTel-darkNeutral">R3,000/month</p>
                  <p className="font-space-mono text-xs text-circleTel-secondaryNeutral">(50Mbps)</p>
                </div>
                <Button asChild className="primary-button flex items-center gap-2">
                  <Link to="/contact">
                    <MessageSquarePlus size={18} />
                    Explore Fibre Options
                  </Link>
                </Button>
              </div>
              
              <div className="relative bg-white rounded-lg p-6 shadow-lg border border-circleTel-orange">
                <div className="flex items-center mb-4">
                  <div className="bg-circleTel-orange rounded-full p-3 mr-3 text-white">
                    <CircleCheck size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-circleTel-darkNeutral">Perfect For</h3>
                </div>
                
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="text-circleTel-orange mr-2 mt-1" size={18} />
                    <span className="text-circleTel-secondaryNeutral">Large offices with high bandwidth needs</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="text-circleTel-orange mr-2 mt-1" size={18} />
                    <span className="text-circleTel-secondaryNeutral">Companies using cloud applications and VoIP</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="text-circleTel-orange mr-2 mt-1" size={18} />
                    <span className="text-circleTel-secondaryNeutral">Businesses requiring guaranteed uptime</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="text-circleTel-orange mr-2 mt-1" size={18} />
                    <span className="text-circleTel-secondaryNeutral">Professional services with critical applications</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
        
        {/* What is Fibre Section */}
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-circleTel-darkNeutral mb-4">
                What is Business Fibre?
              </h2>
              <p className="text-lg text-circleTel-secondaryNeutral">
                Fibre = The fastest, most reliable internet connection. It uses light signals through glass fibre cables for unmatched speed and stability that your business can depend on.
              </p>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-circleTel-darkNeutral text-center mb-12">
              Key Benefits of Fibre Connectivity
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-circleTel-lightNeutral rounded-full p-4 w-16 h-16 flex items-center justify-center text-circleTel-orange mx-auto mb-4">
                  <Zap size={28} />
                </div>
                <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-2">Unbeatable Speed</h3>
                <p className="text-circleTel-secondaryNeutral">Symmetrical speeds up to 1Gbps with consistent performance for uploads and downloads.</p>
              </div>
              
              <div className="text-center">
                <div className="bg-circleTel-lightNeutral rounded-full p-4 w-16 h-16 flex items-center justify-center text-circleTel-orange mx-auto mb-4">
                  <CircleCheck size={28} />
                </div>
                <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-2">Absolute Reliability</h3>
                <p className="text-circleTel-secondaryNeutral">99.99% uptime guarantee with service level agreements to keep your business running.</p>
              </div>
              
              <div className="text-center">
                <div className="bg-circleTel-lightNeutral rounded-full p-4 w-16 h-16 flex items-center justify-center text-circleTel-orange mx-auto mb-4">
                  <ShieldCheck size={28} />
                </div>
                <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-2">Future-Proof</h3>
                <p className="text-circleTel-secondaryNeutral">Your connectivity investment grows with your business through easily scalable bandwidth options.</p>
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
                    <TableCell className="font-medium">Throughput Options</TableCell>
                    <TableCell>50Mbps, 100Mbps, 200Mbps, 500Mbps, 1Gbps</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Latency</TableCell>
                    <TableCell>&lt;5ms</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Bandwidth Allocation</TableCell>
                    <TableCell>Uncapped and unshaped</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Equipment</TableCell>
                    <TableCell>Enterprise-grade router included</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Uptime SLA</TableCell>
                    <TableCell>99.99% guaranteed</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Support</TableCell>
                    <TableCell>24/7/365 priority support</TableCell>
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
              Business Advantages of Fibre
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-bold text-circleTel-darkNeutral flex items-center mb-4">
                  <CheckCircle className="text-circleTel-orange mr-2" size={20} />
                  Enhanced Productivity
                </h3>
                <p className="text-circleTel-secondaryNeutral ml-8">
                  Eliminate frustrating slowdowns with consistent high-speed connectivity for all users simultaneously.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-bold text-circleTel-darkNeutral flex items-center mb-4">
                  <CheckCircle className="text-circleTel-orange mr-2" size={20} />
                  Cloud Application Performance
                </h3>
                <p className="text-circleTel-secondaryNeutral ml-8">
                  Experience seamless performance with critical cloud applications like Office 365, CRMs, and video conferencing.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-bold text-circleTel-darkNeutral flex items-center mb-4">
                  <CheckCircle className="text-circleTel-orange mr-2" size={20} />
                  Crystal-Clear Communications
                </h3>
                <p className="text-circleTel-secondaryNeutral ml-8">
                  Support flawless VoIP telephony and video conferencing with low-latency, jitter-free connections.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-bold text-circleTel-darkNeutral flex items-center mb-4">
                  <CheckCircle className="text-circleTel-orange mr-2" size={20} />
                  Lower Total Cost
                </h3>
                <p className="text-circleTel-secondaryNeutral ml-8">
                  Higher initial investment delivers long-term value through reliability, reduced downtime, and better performance.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-circleTel-darkNeutral text-center mb-12">
              Our Fibre Implementation Process
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="bg-white rounded-full p-4 w-16 h-16 flex items-center justify-center text-circleTel-orange mx-auto mb-4 shadow-lg relative">
                  <span className="absolute -top-2 -right-2 bg-circleTel-orange text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">1</span>
                  <Laptop size={28} />
                </div>
                <h3 className="text-lg font-bold text-circleTel-darkNeutral mb-2">Site Assessment</h3>
                <p className="text-circleTel-secondaryNeutral text-sm">We evaluate your location, fibre availability, and specific business needs.</p>
              </div>
              
              <div className="text-center">
                <div className="bg-white rounded-full p-4 w-16 h-16 flex items-center justify-center text-circleTel-orange mx-auto mb-4 shadow-lg relative">
                  <span className="absolute -top-2 -right-2 bg-circleTel-orange text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">2</span>
                  <CircleCheck size={28} />
                </div>
                <h3 className="text-lg font-bold text-circleTel-darkNeutral mb-2">Installation</h3>
                <p className="text-circleTel-secondaryNeutral text-sm">Our technicians coordinate with fibre providers to install the physical connection to your premises.</p>
              </div>
              
              <div className="text-center">
                <div className="bg-white rounded-full p-4 w-16 h-16 flex items-center justify-center text-circleTel-orange mx-auto mb-4 shadow-lg relative">
                  <span className="absolute -top-2 -right-2 bg-circleTel-orange text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">3</span>
                  <LineChart size={28} />
                </div>
                <h3 className="text-lg font-bold text-circleTel-darkNeutral mb-2">Configuration</h3>
                <p className="text-circleTel-secondaryNeutral text-sm">We set up your router, network security, and connectivity options for optimal performance.</p>
              </div>
              
              <div className="text-center">
                <div className="bg-white rounded-full p-4 w-16 h-16 flex items-center justify-center text-circleTel-orange mx-auto mb-4 shadow-lg relative">
                  <span className="absolute -top-2 -right-2 bg-circleTel-orange text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">4</span>
                  <CheckCircle size={28} />
                </div>
                <h3 className="text-lg font-bold text-circleTel-darkNeutral mb-2">Support</h3>
                <p className="text-circleTel-secondaryNeutral text-sm">We provide ongoing monitoring, management, and proactive support for your connection.</p>
              </div>
            </div>
            
            <div className="text-center mt-12">
              <Button asChild className="primary-button flex items-center gap-2">
                <Link to="/contact">
                  <MessageSquarePlus size={18} />
                  Get Started with Fibre
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

export default Fibre;
