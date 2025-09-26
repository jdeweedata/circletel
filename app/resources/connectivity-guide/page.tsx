import { Wifi, Globe, Activity, Download, ArrowRight, Building, Map, Radio, Network } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ConnectivityGuide() {
  return (
    <main>
      {/* Hero Section - Updated for urban focus */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-white to-circleTel-lightNeutral">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="md:w-1/2">
              <h1 className="text-4xl md:text-5xl font-bold text-circleTel-darkNeutral mb-4">
                Urban Business Connectivity Guide for South Africa
              </h1>
              <p className="text-xl text-circleTel-secondaryNeutral mb-6">
                Specialized connectivity solutions for businesses in Johannesburg, Cape Town, Durban, and Pretoria's urban centers and high-density business districts.
              </p>
              <div className="flex flex-wrap gap-4 mb-6">
                <Button size="lg" className="bg-circleTel-orange hover:bg-circleTel-orange/90 text-white">
                  <Download className="mr-2" size={18} />
                  Download Urban Guide (PDF)
                </Button>
              </div>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <div className="relative">
                <div className="bg-circleTel-orange h-64 w-64 rounded-full bg-opacity-10 flex items-center justify-center">
                  <Building size={100} className="text-circleTel-orange" />
                </div>
                <div className="absolute top-0 right-0 h-24 w-24 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <Globe size={40} className="text-circleTel-orange" />
                </div>
                <div className="absolute bottom-0 left-0 h-32 w-32 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <Wifi size={48} className="text-circleTel-orange" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Navigation - Updated with urban section */}
      <section className="py-8 bg-white border-y border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-4">
            <a href="#urban" className="px-4 py-2 bg-circleTel-orange text-white rounded-full hover:bg-circleTel-orange/90 transition-colors">
              Urban Solutions
            </a>
            <a href="#fibre" className="px-4 py-2 bg-circleTel-lightNeutral rounded-full hover:bg-circleTel-orange hover:text-white transition-colors">
              Fibre
            </a>
            <a href="#5g" className="px-4 py-2 bg-circleTel-lightNeutral rounded-full hover:bg-circleTel-orange hover:text-white transition-colors">
              5G
            </a>
            <a href="#fixed-wireless" className="px-4 py-2 bg-circleTel-lightNeutral rounded-full hover:bg-circleTel-orange hover:text-white transition-colors">
              Fixed Wireless
            </a>
            <a href="#comparison" className="px-4 py-2 bg-circleTel-lightNeutral rounded-full hover:bg-circleTel-orange hover:text-white transition-colors">
              Comparison Table
            </a>
          </div>
        </div>
      </section>

      {/* New Urban Centers Section */}
      <section id="urban" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-6">Urban Connectivity Solutions</h2>
            <div className="bg-circleTel-orange h-1 w-20 mb-8"></div>

            <div className="prose max-w-none">
              <p className="text-lg mb-6">
                South Africa's major urban centers present unique connectivity opportunities and challenges.
                High-density business districts require robust, scalable solutions that can handle the demands
                of multiple businesses operating in close proximity.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="bg-circleTel-lightNeutral p-6 rounded-lg">
                  <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-3">Johannesburg & Pretoria</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <div className="mt-1 mr-2 h-4 w-4 bg-circleTel-orange rounded-full flex-shrink-0"></div>
                      <span>Extensive fibre coverage in Sandton, Rosebank, and Midrand</span>
                    </li>
                    <li className="flex items-start">
                      <div className="mt-1 mr-2 h-4 w-4 bg-circleTel-orange rounded-full flex-shrink-0"></div>
                      <span>Advanced 5G networks in business districts</span>
                    </li>
                    <li className="flex items-start">
                      <div className="mt-1 mr-2 h-4 w-4 bg-circleTel-orange rounded-full flex-shrink-0"></div>
                      <span>Multiple carrier options for redundancy</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-circleTel-lightNeutral p-6 rounded-lg">
                  <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-3">Cape Town & Durban</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <div className="mt-1 mr-2 h-4 w-4 bg-circleTel-orange rounded-full flex-shrink-0"></div>
                      <span>Growing fibre networks in CBD and tech hubs</span>
                    </li>
                    <li className="flex items-start">
                      <div className="mt-1 mr-2 h-4 w-4 bg-circleTel-orange rounded-full flex-shrink-0"></div>
                      <span>Coastal areas with excellent wireless coverage</span>
                    </li>
                    <li className="flex items-start">
                      <div className="mt-1 mr-2 h-4 w-4 bg-circleTel-orange rounded-full flex-shrink-0"></div>
                      <span>Business parks with pre-installed connectivity</span>
                    </li>
                  </ul>
                </div>
              </div>

              <h3 className="text-xl font-bold text-circleTel-darkNeutral mt-8 mb-4">Urban Business Challenges</h3>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start">
                  <div className="mt-1 mr-2 h-4 w-4 bg-circleTel-orange rounded-full flex-shrink-0"></div>
                  <span><strong>Multi-tenant buildings:</strong> Coordinating installation and managing shared infrastructure</span>
                </li>
                <li className="flex items-start">
                  <div className="mt-1 mr-2 h-4 w-4 bg-circleTel-orange rounded-full flex-shrink-0"></div>
                  <span><strong>Bandwidth congestion:</strong> Ensuring consistent performance during peak business hours</span>
                </li>
                <li className="flex items-start">
                  <div className="mt-1 mr-2 h-4 w-4 bg-circleTel-orange rounded-full flex-shrink-0"></div>
                  <span><strong>Power reliability:</strong> Maintaining connectivity during urban load shedding</span>
                </li>
              </ul>

              <div className="bg-white border-2 border-circleTel-orange p-4 rounded-lg mb-8">
                <h4 className="font-bold mb-2 text-circleTel-orange">Urban Coverage Map</h4>
                <div className="bg-circleTel-lightNeutral h-64 rounded-lg flex items-center justify-center mb-2">
                  <Map size={48} className="text-circleTel-secondaryNeutral opacity-50" />
                </div>
                <p className="text-sm text-circleTel-secondaryNeutral">
                  Contact us for a detailed coverage assessment of your specific urban location.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fibre Section - Updated for urban focus */}
      <section id="fibre" className="py-16 bg-circleTel-lightNeutral">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-6">Urban Fibre Connectivity</h2>
            <div className="bg-circleTel-orange h-1 w-20 mb-8"></div>

            <div className="prose max-w-none">
              <p className="text-lg mb-4">
                Fibre optic connectivity is the backbone of South Africa's urban business districts, offering unmatched
                reliability and performance for demanding enterprise applications.
              </p>

              <h3 className="text-xl font-bold text-circleTel-darkNeutral mt-8 mb-4">Urban Fibre Advantages</h3>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start">
                  <div className="mt-1 mr-2 h-4 w-4 bg-circleTel-orange rounded-full flex-shrink-0"></div>
                  <span><strong>Dense Coverage:</strong> Extensive fibre networks in urban business districts enable quick installations.</span>
                </li>
                <li className="flex items-start">
                  <div className="mt-1 mr-2 h-4 w-4 bg-circleTel-orange rounded-full flex-shrink-0"></div>
                  <span><strong>Multiple Provider Options:</strong> Competitive urban markets offer choices for redundancy and pricing.</span>
                </li>
                <li className="flex items-start">
                  <div className="mt-1 mr-2 h-4 w-4 bg-circleTel-orange rounded-full flex-shrink-0"></div>
                  <span><strong>Enterprise-Grade SLAs:</strong> Urban businesses benefit from premium support and uptime guarantees.</span>
                </li>
              </ul>

              <h3 className="text-xl font-bold text-circleTel-darkNeutral mt-8 mb-4">Urban Business Parks</h3>
              <p className="mb-4">
                Many South African business parks and multi-tenant buildings now feature pre-installed fibre infrastructure:
              </p>

              <ul className="space-y-2 mb-6">
                <li className="flex items-start">
                  <div className="mt-1 mr-2 h-4 w-4 bg-circleTel-orange rounded-full flex-shrink-0"></div>
                  <span><strong>Rapid Deployment:</strong> Businesses in connected buildings can be online within 1-3 days.</span>
                </li>
                <li className="flex items-start">
                  <div className="mt-1 mr-2 h-4 w-4 bg-circleTel-orange rounded-full flex-shrink-0"></div>
                  <span><strong>Shared Infrastructure:</strong> Cost-effective solutions through shared building connections.</span>
                </li>
                <li className="flex items-start">
                  <div className="mt-1 mr-2 h-4 w-4 bg-circleTel-orange rounded-full flex-shrink-0"></div>
                  <span><strong>Scalability:</strong> Easy bandwidth upgrades without additional infrastructure changes.</span>
                </li>
              </ul>

              <div className="bg-white p-4 rounded-lg mb-6">
                <h4 className="font-bold mb-2">Urban Business Case Study</h4>
                <p className="text-sm italic mb-3">
                  "As a financial services firm in Sandton, we required guaranteed uptime and low latency. CircleTel's
                  enterprise fibre solution delivered consistent sub-5ms latency to our cloud providers and 99.99% uptime,
                  even during load shedding thanks to their integrated power solutions."
                </p>
                <p className="text-sm font-bold">- Johannesburg Financial Services Client</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* New 5G Section for Urban Areas */}
      <section id="5g" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-6">5G for Urban Businesses</h2>
            <div className="bg-circleTel-orange h-1 w-20 mb-8"></div>

            <div className="prose max-w-none">
              <p className="text-lg mb-4">
                5G networks are revolutionizing urban business connectivity in South Africa, offering
                fiber-like performance with the advantages of wireless deployment.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-circleTel-lightNeutral p-6 rounded-lg">
                  <Radio size={32} className="text-circleTel-orange mb-4" />
                  <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-3">Urban 5G Coverage</h3>
                  <p>
                    Major South African metros now feature extensive 5G coverage, particularly in business
                    districts and high-density urban areas, with speeds regularly exceeding 500Mbps.
                  </p>
                </div>

                <div className="bg-circleTel-lightNeutral p-6 rounded-lg">
                  <Network size={32} className="text-circleTel-orange mb-4" />
                  <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-3">Business Applications</h3>
                  <p>
                    Urban businesses leverage 5G for primary connectivity, backup solutions, pop-up
                    locations, and to bridge the gap while waiting for fibre installation.
                  </p>
                </div>
              </div>

              <h3 className="text-xl font-bold text-circleTel-darkNeutral mt-8 mb-4">Key Urban 5G Benefits</h3>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start">
                  <div className="mt-1 mr-2 h-4 w-4 bg-circleTel-orange rounded-full flex-shrink-0"></div>
                  <span><strong>Rapid Deployment:</strong> Same-day connectivity for new or temporary urban offices.</span>
                </li>
                <li className="flex items-start">
                  <div className="mt-1 mr-2 h-4 w-4 bg-circleTel-orange rounded-full flex-shrink-0"></div>
                  <span><strong>No Construction:</strong> Ideal for heritage buildings or temporary locations where drilling isn't permitted.</span>
                </li>
                <li className="flex items-start">
                  <div className="mt-1 mr-2 h-4 w-4 bg-circleTel-orange rounded-full flex-shrink-0"></div>
                  <span><strong>Failover Ready:</strong> Perfect complement to fibre for business continuity during outages.</span>
                </li>
              </ul>

              <div className="bg-white border border-circleTel-orange p-4 rounded-lg mb-6">
                <h4 className="font-bold mb-2 text-circleTel-orange">Urban 5G Performance</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Johannesburg CBD</span>
                      <span className="text-sm font-bold">600-750 Mbps</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-circleTel-orange h-2.5 rounded-full" style={{ width: '90%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Cape Town CBD</span>
                      <span className="text-sm font-bold">550-680 Mbps</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-circleTel-orange h-2.5 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Durban Central</span>
                      <span className="text-sm font-bold">450-600 Mbps</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-circleTel-orange h-2.5 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fixed Wireless Section - Kept with minor updates */}
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

      {/* Comparison Table - Updated for urban business needs */}
      <section id="comparison" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-6">Urban Connectivity Comparison</h2>
            <div className="bg-circleTel-orange h-1 w-20 mb-8"></div>

            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-circleTel-orange text-white">
                    <th className="px-4 py-3 text-left">Feature</th>
                    <th className="px-4 py-3 text-center">Fibre</th>
                    <th className="px-4 py-3 text-center">5G</th>
                    <th className="px-4 py-3 text-center">Fixed Wireless</th>
                    <th className="px-4 py-3 text-center">LTE</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="px-4 py-3 font-medium">Urban Availability</td>
                    <td className="px-4 py-3 text-center">★★★★★</td>
                    <td className="px-4 py-3 text-center">★★★★☆</td>
                    <td className="px-4 py-3 text-center">★★★★☆</td>
                    <td className="px-4 py-3 text-center">★★★★★</td>
                  </tr>
                  <tr className="border-b bg-circleTel-lightNeutral">
                    <td className="px-4 py-3 font-medium">Multi-Tenant Buildings</td>
                    <td className="px-4 py-3 text-center">★★★★★</td>
                    <td className="px-4 py-3 text-center">★★★★☆</td>
                    <td className="px-4 py-3 text-center">★★★☆☆</td>
                    <td className="px-4 py-3 text-center">★★☆☆☆</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-3 font-medium">Business Park Ready</td>
                    <td className="px-4 py-3 text-center">★★★★★</td>
                    <td className="px-4 py-3 text-center">★★★★☆</td>
                    <td className="px-4 py-3 text-center">★★★☆☆</td>
                    <td className="px-4 py-3 text-center">★★★☆☆</td>
                  </tr>
                  <tr className="border-b bg-circleTel-lightNeutral">
                    <td className="px-4 py-3 font-medium">Urban Speed (Mbps)</td>
                    <td className="px-4 py-3 text-center">100-1000</td>
                    <td className="px-4 py-3 text-center">300-900</td>
                    <td className="px-4 py-3 text-center">50-200</td>
                    <td className="px-4 py-3 text-center">10-80</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-3 font-medium">Urban Deployment Time</td>
                    <td className="px-4 py-3 text-center">1-4 weeks*</td>
                    <td className="px-4 py-3 text-center">Same day</td>
                    <td className="px-4 py-3 text-center">2-5 days</td>
                    <td className="px-4 py-3 text-center">Same day</td>
                  </tr>
                  <tr className="bg-circleTel-lightNeutral">
                    <td className="px-4 py-3 font-medium">Best Urban Use Case</td>
                    <td className="px-4 py-3 text-center">Primary connectivity</td>
                    <td className="px-4 py-3 text-center">Quick deployment & backup</td>
                    <td className="px-4 py-3 text-center">Building-to-building links</td>
                    <td className="px-4 py-3 text-center">Mobile workforce</td>
                  </tr>
                </tbody>
              </table>
              <p className="text-sm text-circleTel-secondaryNeutral mt-2">*1 week for buildings with existing infrastructure, 2-4 weeks for new installations</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA - Updated for urban focus */}
      <section className="py-16 bg-circleTel-lightNeutral">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-4">Need urban-specific connectivity advice?</h2>
            <p className="text-lg text-circleTel-secondaryNeutral mb-8">
              Our urban connectivity specialists can assess your building's infrastructure and recommend the optimal
              solution for your business location in Johannesburg, Cape Town, Durban, or Pretoria.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild size="lg" className="bg-circleTel-orange hover:bg-circleTel-orange/90 text-white">
                <Link href="/contact">Schedule an Urban Site Survey</Link>
              </Button>
              <Button asChild variant="outline" className="border-circleTel-orange text-circleTel-orange hover:bg-circleTel-orange hover:text-white">
                <Link href="/resources/wifi-toolkit">
                  Multi-Tenant Wi-Fi Solutions <ArrowRight size={16} className="ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}