
import React from 'react';
import { ShieldCheck, Users, LineChart } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const WifiFeatures = () => {
  return (
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
  );
};

export default WifiFeatures;
