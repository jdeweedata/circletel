
import React from 'react';
import { CheckCircle, XCircle, MinusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const Check = () => <CheckCircle className="text-green-500 mx-auto" size={20} />;
const Cross = () => <XCircle className="text-red-500 mx-auto" size={20} />;
const Partial = () => <MinusCircle className="text-amber-500 mx-auto" size={20} />;

const ConnectivityComparison = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-circleTel-darkNeutral text-center mb-8">
          Compare Connectivity Solutions
        </h2>
        
        <p className="text-circleTel-secondaryNeutral text-center mb-12 max-w-2xl mx-auto">
          Find the perfect connectivity recipe for your business needs with our side-by-side comparison of Wi-Fi as a Service, Fixed Wireless Access, and Fibre to the Premises.
        </p>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Feature</TableHead>
                <TableHead className="text-center">Wi-Fi as a Service</TableHead>
                <TableHead className="text-center">Fixed Wireless Access</TableHead>
                <TableHead className="text-center">Fibre to the Premises</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Speed</TableCell>
                <TableCell className="text-center">Up to 1Gbps (internal)</TableCell>
                <TableCell className="text-center">10-100Mbps</TableCell>
                <TableCell className="text-center">50Mbps-1Gbps</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Latency</TableCell>
                <TableCell className="text-center">&lt;10ms (internal)</TableCell>
                <TableCell className="text-center">&lt;20ms</TableCell>
                <TableCell className="text-center">&lt;5ms</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Deployment Time</TableCell>
                <TableCell className="text-center">1-3 days</TableCell>
                <TableCell className="text-center">2-5 days</TableCell>
                <TableCell className="text-center">10-30 days</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Installation Complexity</TableCell>
                <TableCell className="text-center"><Check /></TableCell>
                <TableCell className="text-center"><Check /></TableCell>
                <TableCell className="text-center"><Cross /></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Uptime Guarantee</TableCell>
                <TableCell className="text-center">99.9%</TableCell>
                <TableCell className="text-center">99.5%</TableCell>
                <TableCell className="text-center">99.99%</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Weather Resistant</TableCell>
                <TableCell className="text-center">N/A (indoor)</TableCell>
                <TableCell className="text-center"><Partial /></TableCell>
                <TableCell className="text-center"><Check /></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Guest Network</TableCell>
                <TableCell className="text-center"><Check /></TableCell>
                <TableCell className="text-center"><Partial /></TableCell>
                <TableCell className="text-center"><Partial /></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Analytics Dashboard</TableCell>
                <TableCell className="text-center"><Check /></TableCell>
                <TableCell className="text-center"><Check /></TableCell>
                <TableCell className="text-center"><Check /></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Ideal For</TableCell>
                <TableCell className="text-center">In-building connectivity</TableCell>
                <TableCell className="text-center">Areas without fibre</TableCell>
                <TableCell className="text-center">High-performance needs</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Starting Price</TableCell>
                <TableCell className="text-center">R2,000/month</TableCell>
                <TableCell className="text-center">R1,500/month</TableCell>
                <TableCell className="text-center">R3,000/month</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium"></TableCell>
                <TableCell className="text-center">
                  <Button asChild className="primary-button">
                    <Link to="/connectivity/wifi-as-a-service">Learn More</Link>
                  </Button>
                </TableCell>
                <TableCell className="text-center">
                  <Button asChild className="primary-button">
                    <Link to="/connectivity/fixed-wireless">Learn More</Link>
                  </Button>
                </TableCell>
                <TableCell className="text-center">
                  <Button asChild className="primary-button">
                    <Link to="/connectivity/fibre">Learn More</Link>
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </section>
  );
};

export default ConnectivityComparison;
