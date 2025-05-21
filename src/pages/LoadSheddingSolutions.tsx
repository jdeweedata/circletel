
import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Cloud, Laptop, Server, Wifi } from 'lucide-react';

const LoadSheddingSolutions = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main>
        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-white to-circleTel-lightNeutral">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="md:w-1/2">
                <div className="inline-block bg-circleTel-orange/10 px-4 py-2 rounded-lg mb-4">
                  <span className="text-circleTel-orange font-medium">South African Business Solutions</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-circleTel-darkNeutral mb-4">IT Solutions for Load Shedding</h1>
                <p className="text-xl text-circleTel-secondaryNeutral mb-6">
                  Keep your business running during power outages with our specialized IT infrastructure designed for South African realities.
                </p>
                <Button asChild size="lg" className="bg-circleTel-orange hover:bg-circleTel-orange/90 text-white">
                  <Link to="/contact">Get a Load Shedding Solution</Link>
                </Button>
              </div>
              <div className="md:w-1/2 bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold text-circleTel-darkNeutral mb-4">Power Outage Impact</h2>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-circleTel-orange/10 flex items-center justify-center text-circleTel-orange mr-3">
                      67%
                    </div>
                    <p className="text-circleTel-secondaryNeutral">of South African businesses report significant revenue loss during load shedding</p>
                  </div>
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-circleTel-orange/10 flex items-center justify-center text-circleTel-orange mr-3">
                      4.6h
                    </div>
                    <p className="text-circleTel-secondaryNeutral">average daily operational time lost during Stage 4+ load shedding</p>
                  </div>
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-circleTel-orange/10 flex items-center justify-center text-circleTel-orange mr-3">
                      89%
                    </div>
                    <p className="text-circleTel-secondaryNeutral">of businesses with continuity solutions maintain operations during outages</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Solutions Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-circleTel-darkNeutral text-center mb-12">Our Load Shedding Solutions</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-circleTel-lightNeutral rounded-lg p-6">
                <div className="h-14 w-14 rounded-lg bg-circleTel-orange/10 flex items-center justify-center text-circleTel-orange mb-4">
                  <Server size={28} />
                </div>
                <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-2">UPS & Power Backup</h3>
                <p className="text-circleTel-secondaryNeutral mb-4">
                  Enterprise-grade Uninterruptible Power Supply solutions that keep your critical IT infrastructure running during outages.
                </p>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center">
                    <span className="h-5 w-5 rounded-full bg-circleTel-orange text-white flex items-center justify-center text-xs mr-2">✓</span>
                    <span className="text-circleTel-secondaryNeutral">Server & network protection</span>
                  </li>
                  <li className="flex items-center">
                    <span className="h-5 w-5 rounded-full bg-circleTel-orange text-white flex items-center justify-center text-xs mr-2">✓</span>
                    <span className="text-circleTel-secondaryNeutral">Automatic shutdown protocols</span>
                  </li>
                  <li className="flex items-center">
                    <span className="h-5 w-5 rounded-full bg-circleTel-orange text-white flex items-center justify-center text-xs mr-2">✓</span>
                    <span className="text-circleTel-secondaryNeutral">Power conditioning</span>
                  </li>
                </ul>
                <Link to="/contact" className="text-circleTel-orange font-medium hover:underline">Learn more →</Link>
              </div>
              
              <div className="bg-circleTel-lightNeutral rounded-lg p-6">
                <div className="h-14 w-14 rounded-lg bg-circleTel-orange/10 flex items-center justify-center text-circleTel-orange mb-4">
                  <Cloud size={28} />
                </div>
                <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-2">Cloud Business Continuity</h3>
                <p className="text-circleTel-secondaryNeutral mb-4">
                  Move critical applications to the cloud to ensure continued operations regardless of local power status.
                </p>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center">
                    <span className="h-5 w-5 rounded-full bg-circleTel-orange text-white flex items-center justify-center text-xs mr-2">✓</span>
                    <span className="text-circleTel-secondaryNeutral">Cloud-hosted applications</span>
                  </li>
                  <li className="flex items-center">
                    <span className="h-5 w-5 rounded-full bg-circleTel-orange text-white flex items-center justify-center text-xs mr-2">✓</span>
                    <span className="text-circleTel-secondaryNeutral">Real-time data synchronization</span>
                  </li>
                  <li className="flex items-center">
                    <span className="h-5 w-5 rounded-full bg-circleTel-orange text-white flex items-center justify-center text-xs mr-2">✓</span>
                    <span className="text-circleTel-secondaryNeutral">Virtual desktop infrastructure</span>
                  </li>
                </ul>
                <Link to="/cloud/migration" className="text-circleTel-orange font-medium hover:underline">Learn more →</Link>
              </div>
              
              <div className="bg-circleTel-lightNeutral rounded-lg p-6">
                <div className="h-14 w-14 rounded-lg bg-circleTel-orange/10 flex items-center justify-center text-circleTel-orange mb-4">
                  <Wifi size={28} />
                </div>
                <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-2">Redundant Connectivity</h3>
                <p className="text-circleTel-secondaryNeutral mb-4">
                  Multiple internet connection types to ensure your business stays connected during infrastructure failures.
                </p>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center">
                    <span className="h-5 w-5 rounded-full bg-circleTel-orange text-white flex items-center justify-center text-xs mr-2">✓</span>
                    <span className="text-circleTel-secondaryNeutral">Fixed wireless + fibre solutions</span>
                  </li>
                  <li className="flex items-center">
                    <span className="h-5 w-5 rounded-full bg-circleTel-orange text-white flex items-center justify-center text-xs mr-2">✓</span>
                    <span className="text-circleTel-secondaryNeutral">LTE backup connections</span>
                  </li>
                  <li className="flex items-center">
                    <span className="h-5 w-5 rounded-full bg-circleTel-orange text-white flex items-center justify-center text-xs mr-2">✓</span>
                    <span className="text-circleTel-secondaryNeutral">Automatic failover configuration</span>
                  </li>
                </ul>
                <Link to="/connectivity" className="text-circleTel-orange font-medium hover:underline">Learn more →</Link>
              </div>
            </div>
          </div>
        </section>

        {/* Case Study Section */}
        <section className="py-16 bg-circleTel-lightNeutral">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-circleTel-darkNeutral text-center mb-8">South African Businesses That Stay Online</h2>
            
            <div className="max-w-3xl mx-auto bg-white rounded-lg p-6 md:p-8 shadow-lg">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3">
                  <div className="bg-circleTel-orange/10 rounded-lg p-6 h-full">
                    <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-2">Cape Town Retail</h3>
                    <p className="text-circleTel-secondaryNeutral mb-4">
                      Shoprite branch with 25 employees
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <span className="font-bold text-circleTel-darkNeutral mr-2">Challenge:</span>
                        <span className="text-circleTel-secondaryNeutral">Point-of-sale downtime</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-bold text-circleTel-darkNeutral mr-2">Loss:</span>
                        <span className="text-circleTel-secondaryNeutral">R150K/month</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="md:w-2/3">
                  <h4 className="text-lg font-bold text-circleTel-darkNeutral mb-3">The Solution</h4>
                  <p className="text-circleTel-secondaryNeutral mb-4">
                    We implemented a comprehensive load shedding solution including UPS backup for all point-of-sale systems, cloud-based transaction processing with offline mode, and dual-connectivity with automatic failover.
                  </p>
                  
                  <h4 className="text-lg font-bold text-circleTel-darkNeutral mb-3">The Results</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-circleTel-lightNeutral rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold text-circleTel-orange">99.8%</p>
                      <p className="text-circleTel-secondaryNeutral">Uptime during outages</p>
                    </div>
                    <div className="bg-circleTel-lightNeutral rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold text-circleTel-orange">10 min</p>
                      <p className="text-circleTel-secondaryNeutral">Recovery time</p>
                    </div>
                    <div className="bg-circleTel-lightNeutral rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold text-circleTel-orange">R0</p>
                      <p className="text-circleTel-secondaryNeutral">Lost sales</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button asChild className="bg-circleTel-orange hover:bg-circleTel-orange/90 text-white">
                      <Link to="/case-studies">View All Case Studies</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="bg-circleTel-orange/10 rounded-lg p-8 text-center">
              <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-4">Keep Your Business Running When Others Shut Down</h2>
              <p className="text-xl text-circleTel-secondaryNeutral mb-8 max-w-2xl mx-auto">
                Don't let load shedding impact your bottom line. Our solutions are designed specifically for South African businesses facing power challenges.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-circleTel-orange hover:bg-circleTel-orange/90 text-white">
                  <Link to="/contact">Get a Custom Solution</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/resources/it-health">Free Load Shedding Assessment</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default LoadSheddingSolutions;
