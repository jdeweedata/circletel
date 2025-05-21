
import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Wifi, Globe, Activity, Download, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const ConnectivityGuide = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main>
        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-white to-circleTel-lightNeutral">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="md:w-1/2">
                <h1 className="text-4xl md:text-5xl font-bold text-circleTel-darkNeutral mb-4">South African Business Connectivity Guide</h1>
                <p className="text-xl text-circleTel-secondaryNeutral mb-6">
                  Navigate the complex world of business connectivity options with our comprehensive guide, designed specifically for South African businesses.
                </p>
                <div className="flex flex-wrap gap-4 mb-6">
                  <Button size="lg" className="bg-circleTel-orange hover:bg-circleTel-orange/90 text-white">
                    <Download className="mr-2" size={18} />
                    Download Full Guide (PDF)
                  </Button>
                </div>
              </div>
              <div className="md:w-1/2 flex justify-center">
                <div className="relative">
                  <div className="bg-circleTel-orange h-64 w-64 rounded-full bg-opacity-10 flex items-center justify-center">
                    <Wifi size={100} className="text-circleTel-orange" />
                  </div>
                  <div className="absolute top-0 right-0 h-24 w-24 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <Globe size={40} className="text-circleTel-orange" />
                  </div>
                  <div className="absolute bottom-0 left-0 h-32 w-32 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <Activity size={48} className="text-circleTel-orange" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Navigation */}
        <section className="py-8 bg-white border-y border-gray-200">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-center gap-4">
              <a href="#fibre" className="px-4 py-2 bg-circleTel-lightNeutral rounded-full hover:bg-circleTel-orange hover:text-white transition-colors">
                Fibre
              </a>
              <a href="#fixed-wireless" className="px-4 py-2 bg-circleTel-lightNeutral rounded-full hover:bg-circleTel-orange hover:text-white transition-colors">
                Fixed Wireless
              </a>
              <a href="#5g" className="px-4 py-2 bg-circleTel-lightNeutral rounded-full hover:bg-circleTel-orange hover:text-white transition-colors">
                5G
              </a>
              <a href="#redundancy" className="px-4 py-2 bg-circleTel-lightNeutral rounded-full hover:bg-circleTel-orange hover:text-white transition-colors">
                Redundancy Options
              </a>
              <a href="#comparison" className="px-4 py-2 bg-circleTel-lightNeutral rounded-full hover:bg-circleTel-orange hover:text-white transition-colors">
                Comparison Table
              </a>
            </div>
          </div>
        </section>

        {/* Fibre Section */}
        <section id="fibre" className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-6">Fibre Connectivity</h2>
              <div className="bg-circleTel-lightNeutral h-1 w-20 mb-8"></div>
              
              <div className="prose max-w-none">
                <p className="text-lg mb-4">
                  Fibre optic connectivity remains the gold standard for South African businesses requiring reliable, high-speed internet access. This section explores the current fibre landscape in South Africa.
                </p>
                
                <h3 className="text-xl font-bold text-circleTel-darkNeutral mt-8 mb-4">Key Advantages</h3>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-start">
                    <div className="mt-1 mr-2 h-4 w-4 bg-circleTel-orange rounded-full flex-shrink-0"></div>
                    <span><strong>Reliability:</strong> Fibre offers the most stable connection available, with minimal downtime compared to wireless alternatives.</span>
                  </li>
                  <li className="flex items-start">
                    <div className="mt-1 mr-2 h-4 w-4 bg-circleTel-orange rounded-full flex-shrink-0"></div>
                    <span><strong>Symmetrical Speeds:</strong> Equal upload and download speeds make fibre ideal for cloud services, video conferencing, and large file transfers.</span>
                  </li>
                  <li className="flex items-start">
                    <div className="mt-1 mr-2 h-4 w-4 bg-circleTel-orange rounded-full flex-shrink-0"></div>
                    <span><strong>Scalability:</strong> Easily upgrade bandwidth as your business grows without infrastructure changes.</span>
                  </li>
                </ul>
                
                <h3 className="text-xl font-bold text-circleTel-darkNeutral mt-8 mb-4">South African Considerations</h3>
                <p className="mb-4">
                  Despite ongoing expansion, fibre coverage in South Africa remains concentrated in urban and business districts. Your location will significantly impact availability, with these key factors to consider:
                </p>
                
                <ul className="space-y-2 mb-6">
                  <li className="flex items-start">
                    <div className="mt-1 mr-2 h-4 w-4 bg-circleTel-orange rounded-full flex-shrink-0"></div>
                    <span><strong>Coverage Mapping:</strong> Always check multiple providers as coverage varies significantly between them.</span>
                  </li>
                  <li className="flex items-start">
                    <div className="mt-1 mr-2 h-4 w-4 bg-circleTel-orange rounded-full flex-shrink-0"></div>
                    <span><strong>Installation Timeframes:</strong> Plan ahead as installation can take 4-8 weeks in areas requiring new infrastructure.</span>
                  </li>
                  <li className="flex items-start">
                    <div className="mt-1 mr-2 h-4 w-4 bg-circleTel-orange rounded-full flex-shrink-0"></div>
                    <span><strong>Battery Backup:</strong> Consider UPS solutions as fibre CPE equipment requires power during outages.</span>
                  </li>
                </ul>
                
                <div className="bg-circleTel-lightNeutral p-4 rounded-lg mb-6">
                  <h4 className="font-bold mb-2">Pro Tip</h4>
                  <p className="text-sm">
                    When evaluating fibre providers, check their upstream connectivity. National providers with their own backbone infrastructure typically offer more consistent performance during peak hours.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Fixed Wireless Section */}
        <section id="fixed-wireless" className="py-16 bg-circleTel-lightNeutral">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-6">Fixed Wireless Access</h2>
              <div className="bg-circleTel-orange h-1 w-20 mb-8"></div>
              
              <div className="prose max-w-none">
                <p className="text-lg mb-4">
                  Fixed Wireless Access (FWA) offers an excellent alternative in areas where fibre is unavailable or when rapid deployment is required.
                </p>
                
                <h3 className="text-xl font-bold text-circleTel-darkNeutral mt-8 mb-4">Key Advantages</h3>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-start">
                    <div className="mt-1 mr-2 h-4 w-4 bg-circleTel-orange rounded-full flex-shrink-0"></div>
                    <span><strong>Rapid Deployment:</strong> Typically installed within 3-10 business days.</span>
                  </li>
                  <li className="flex items-start">
                    <div className="mt-1 mr-2 h-4 w-4 bg-circleTel-orange rounded-full flex-shrink-0"></div>
                    <span><strong>Wider Coverage:</strong> Available in many areas where fibre hasn't been deployed.</span>
                  </li>
                  <li className="flex items-start">
                    <div className="mt-1 mr-2 h-4 w-4 bg-circleTel-orange rounded-full flex-shrink-0"></div>
                    <span><strong>Business-Grade Options:</strong> Modern FWA can deliver reliable performance for most business applications.</span>
                  </li>
                </ul>
                
                <h3 className="text-xl font-bold text-circleTel-darkNeutral mt-8 mb-4">South African Considerations</h3>
                <p className="mb-4">
                  The quality of Fixed Wireless in South Africa varies dramatically based on provider and location:
                </p>
                
                <ul className="space-y-2 mb-6">
                  <li className="flex items-start">
                    <div className="mt-1 mr-2 h-4 w-4 bg-circleTel-orange rounded-full flex-shrink-0"></div>
                    <span><strong>Line of Sight:</strong> Most solutions require clear line of sight to the nearest tower or access point.</span>
                  </li>
                  <li className="flex items-start">
                    <div className="mt-1 mr-2 h-4 w-4 bg-circleTel-orange rounded-full flex-shrink-0"></div>
                    <span><strong>Weather Impact:</strong> Heavy rain can affect performance of some wireless frequencies.</span>
                  </li>
                  <li className="flex items-start">
                    <div className="mt-1 mr-2 h-4 w-4 bg-circleTel-orange rounded-full flex-shrink-0"></div>
                    <span><strong>Power Considerations:</strong> Many modern FWA installations can operate on battery backup during outages.</span>
                  </li>
                </ul>
                
                <div className="bg-white p-4 rounded-lg mb-6">
                  <h4 className="font-bold mb-2">Pro Tip</h4>
                  <p className="text-sm">
                    Request a site survey before committing to FWA. A professional assessment will confirm signal quality and identify potential interference sources that could impact performance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section id="comparison" className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-6">Connectivity Comparison</h2>
              <div className="bg-circleTel-orange h-1 w-20 mb-8"></div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="bg-circleTel-orange text-white">
                      <th className="px-4 py-3 text-left">Feature</th>
                      <th className="px-4 py-3 text-center">Fibre</th>
                      <th className="px-4 py-3 text-center">Fixed Wireless</th>
                      <th className="px-4 py-3 text-center">5G</th>
                      <th className="px-4 py-3 text-center">LTE</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="px-4 py-3 font-medium">Typical Speed</td>
                      <td className="px-4 py-3 text-center">25-1000 Mbps</td>
                      <td className="px-4 py-3 text-center">10-100 Mbps</td>
                      <td className="px-4 py-3 text-center">100-900 Mbps</td>
                      <td className="px-4 py-3 text-center">10-60 Mbps</td>
                    </tr>
                    <tr className="border-b bg-circleTel-lightNeutral">
                      <td className="px-4 py-3 font-medium">Reliability</td>
                      <td className="px-4 py-3 text-center">★★★★★</td>
                      <td className="px-4 py-3 text-center">★★★★☆</td>
                      <td className="px-4 py-3 text-center">★★★☆☆</td>
                      <td className="px-4 py-3 text-center">★★☆☆☆</td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-4 py-3 font-medium">Installation Time</td>
                      <td className="px-4 py-3 text-center">2-8 weeks</td>
                      <td className="px-4 py-3 text-center">3-10 days</td>
                      <td className="px-4 py-3 text-center">1-3 days</td>
                      <td className="px-4 py-3 text-center">Same day</td>
                    </tr>
                    <tr className="border-b bg-circleTel-lightNeutral">
                      <td className="px-4 py-3 font-medium">Load Shedding Ready</td>
                      <td className="px-4 py-3 text-center">Requires UPS</td>
                      <td className="px-4 py-3 text-center">Varies by provider</td>
                      <td className="px-4 py-3 text-center">Tower dependent</td>
                      <td className="px-4 py-3 text-center">Tower dependent</td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-4 py-3 font-medium">Cost Range</td>
                      <td className="px-4 py-3 text-center">R700-R5000+</td>
                      <td className="px-4 py-3 text-center">R800-R3000</td>
                      <td className="px-4 py-3 text-center">R600-R2500</td>
                      <td className="px-4 py-3 text-center">R300-R1500</td>
                    </tr>
                    <tr className="bg-circleTel-lightNeutral">
                      <td className="px-4 py-3 font-medium">Best For</td>
                      <td className="px-4 py-3 text-center">Primary office connection</td>
                      <td className="px-4 py-3 text-center">Remote locations</td>
                      <td className="px-4 py-3 text-center">Backup or mobile workforce</td>
                      <td className="px-4 py-3 text-center">Temporary sites</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-circleTel-lightNeutral">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-4">Need help choosing the right connectivity?</h2>
              <p className="text-lg text-circleTel-secondaryNeutral mb-8">
                Our experts can analyze your business requirements and recommend the optimal connectivity solution tailored to your specific needs.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button asChild size="lg" className="bg-circleTel-orange hover:bg-circleTel-orange/90 text-white">
                  <Link to="/contact">Schedule a Consultation</Link>
                </Button>
                <Button asChild variant="outline" className="border-circleTel-orange text-circleTel-orange hover:bg-circleTel-orange hover:text-white">
                  <Link to="/resources/wifi-toolkit">
                    Explore WiFi Toolkit <ArrowRight size={16} className="ml-2" />
                  </Link>
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

export default ConnectivityGuide;
