
import React from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { WifiHigh, CheckCircle, ShieldCheck, Users, LineChart, Laptop } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link } from 'react-router-dom';

const WifiAsService = () => {
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
                  Wi-Fi as a Service (WaaS)
                </h1>
                <p className="text-lg md:text-xl text-circleTel-secondaryNeutral mb-6">
                  Enterprise-grade Wi-Fi without the complexity. Hardware, installation, management, and monitoring in one monthly fee.
                </p>
                <div className="bg-circleTel-lightNeutral rounded-lg p-4 mb-6">
                  <p className="font-space-mono text-sm text-circleTel-secondaryNeutral mb-1">Starting from</p>
                  <p className="text-3xl font-bold text-circleTel-darkNeutral">ZAR 2,000/month</p>
                  <p className="font-space-mono text-xs text-circleTel-secondaryNeutral">(10 devices)</p>
                </div>
                <Button asChild className="primary-button">
                  <Link to="/contact">Schedule A Consultation</Link>
                </Button>
              </div>
              
              <div className="relative bg-white rounded-lg p-6 shadow-lg border border-circleTel-orange">
                <div className="flex items-center mb-4">
                  <div className="bg-circleTel-orange rounded-full p-3 mr-3 text-white">
                    <WifiHigh size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-circleTel-darkNeutral">Perfect For</h3>
                </div>
                
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="text-circleTel-orange mr-2 mt-1" size={18} />
                    <span className="text-circleTel-secondaryNeutral">Retail stores requiring reliable guest Wi-Fi</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="text-circleTel-orange mr-2 mt-1" size={18} />
                    <span className="text-circleTel-secondaryNeutral">Multi-location businesses needing consistent Wi-Fi</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="text-circleTel-orange mr-2 mt-1" size={18} />
                    <span className="text-circleTel-secondaryNeutral">Growing companies that need scalable solutions</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="text-circleTel-orange mr-2 mt-1" size={18} />
                    <span className="text-circleTel-secondaryNeutral">Businesses without dedicated IT staff</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-circleTel-darkNeutral text-center mb-12">
              Everything You Need for Perfect Wi-Fi
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-circleTel-lightNeutral rounded-full p-4 w-16 h-16 flex items-center justify-center text-circleTel-orange mx-auto mb-4">
                  <ShieldCheck size={28} />
                </div>
                <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-2">Enterprise Security</h3>
                <p className="text-circleTel-secondaryNeutral">Advanced firewalls, intrusion detection, and content filtering keep your network safe from threats.</p>
              </div>
              
              <div className="text-center">
                <div className="bg-circleTel-lightNeutral rounded-full p-4 w-16 h-16 flex items-center justify-center text-circleTel-orange mx-auto mb-4">
                  <Users size={28} />
                </div>
                <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-2">Guest Networks</h3>
                <p className="text-circleTel-secondaryNeutral">Separate, secure guest access with branded splash pages and analytics to understand visitor behavior.</p>
              </div>
              
              <div className="text-center">
                <div className="bg-circleTel-lightNeutral rounded-full p-4 w-16 h-16 flex items-center justify-center text-circleTel-orange mx-auto mb-4">
                  <LineChart size={28} />
                </div>
                <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-2">Proactive Monitoring</h3>
                <p className="text-circleTel-secondaryNeutral">24/7 performance monitoring with automated alerts and remediation before issues affect your business.</p>
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
                    <TableCell className="font-medium">Wi-Fi Standard</TableCell>
                    <TableCell>Wi-Fi 6 (802.11ax)</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Maximum Throughput</TableCell>
                    <TableCell>Up to 1Gbps</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Device Support</TableCell>
                    <TableCell>50-500 concurrent devices</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Security Features</TableCell>
                    <TableCell>WPA3, Firewall, IDS/IPS, Content Filtering</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Monitoring</TableCell>
                    <TableCell>24/7 with automated alerts</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Support</TableCell>
                    <TableCell>24/7/365 with &lt;15 min response time</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </section>
        
        {/* How It Works */}
        <section className="py-16 bg-circleTel-lightNeutral">
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
              <Button asChild className="primary-button">
                <Link to="/contact">Get Started with WaaS</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default WifiAsService;
