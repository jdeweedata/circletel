
import React, { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Wifi, Download, CheckCircle2, Printer, ArrowRight, Calculator } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const WiFiToolkit = () => {
  const [officeSize, setOfficeSize] = useState<string>("small");
  const [employeeCount, setEmployeeCount] = useState<string>("10-25");
  const [internetSpeed, setInternetSpeed] = useState<string>("50");
  
  // Calculate recommended AP count based on inputs
  const getRecommendedAPs = () => {
    const sizeMultiplier = officeSize === "small" ? 1 : officeSize === "medium" ? 2 : 3;
    const employeeMultiplier = employeeCount === "10-25" ? 1 : employeeCount === "25-50" ? 1.5 : 2;
    const baseCount = Math.ceil(sizeMultiplier * employeeMultiplier);
    return Math.max(baseCount, 1);
  };

  // Calculate recommended internet speed
  const getRecommendedSpeed = () => {
    const baseSpeed = employeeCount === "10-25" ? 100 : employeeCount === "25-50" ? 200 : 500;
    return baseSpeed;
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main>
        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-white to-circleTel-lightNeutral">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="md:w-1/2">
                <h1 className="text-4xl md:text-5xl font-bold text-circleTel-darkNeutral mb-4">Wi-Fi Planning Toolkit</h1>
                <p className="text-xl text-circleTel-secondaryNeutral mb-6">
                  Practical tools and resources to help you plan, deploy, and optimize your business Wi-Fi network.
                </p>
                <div className="flex flex-wrap gap-4 mb-6">
                  <Button asChild size="lg" className="bg-circleTel-orange hover:bg-circleTel-orange/90 text-white">
                    <Link to="#calculator">
                      <Calculator className="mr-2" size={18} />
                      Wi-Fi Calculator
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="border-circleTel-orange text-circleTel-orange hover:bg-circleTel-orange hover:text-white">
                    <a href="#checklists">
                      <CheckCircle2 className="mr-2" size={18} />
                      Deployment Checklists
                    </a>
                  </Button>
                </div>
              </div>
              <div className="md:w-1/2 flex justify-center">
                <div className="relative">
                  <div className="bg-circleTel-orange h-64 w-64 rounded-full bg-opacity-10 flex items-center justify-center">
                    <Wifi size={100} className="text-circleTel-orange" />
                  </div>
                  <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-white flex items-center justify-center shadow-lg">
                    <span className="text-4xl font-bold text-circleTel-orange">5G</span>
                  </div>
                  <div className="absolute -bottom-4 -left-4 h-32 w-32 rounded-full bg-white flex items-center justify-center shadow-lg">
                    <span className="text-xl font-bold text-circleTel-orange">Wi-Fi 6</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Calculator Section */}
        <section id="calculator" className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-6 text-center">Wi-Fi Requirements Calculator</h2>
              <div className="bg-circleTel-orange h-1 w-20 mx-auto mb-8"></div>
              
              <div className="bg-circleTel-lightNeutral p-6 rounded-lg shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-circleTel-darkNeutral font-medium mb-2">Office Size</label>
                    <select 
                      value={officeSize}
                      onChange={(e) => setOfficeSize(e.target.value)}
                      className="w-full p-2 border rounded bg-white"
                    >
                      <option value="small">Small (up to 200m²)</option>
                      <option value="medium">Medium (200-500m²)</option>
                      <option value="large">Large (500m²+)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-circleTel-darkNeutral font-medium mb-2">Number of Employees</label>
                    <select 
                      value={employeeCount}
                      onChange={(e) => setEmployeeCount(e.target.value)}
                      className="w-full p-2 border rounded bg-white"
                    >
                      <option value="10-25">10-25 employees</option>
                      <option value="25-50">25-50 employees</option>
                      <option value="50+">50+ employees</option>
                    </select>
                  </div>
                </div>
                
                <div className="mb-6">
                  <label className="block text-circleTel-darkNeutral font-medium mb-2">Current Internet Speed (Mbps)</label>
                  <select 
                    value={internetSpeed}
                    onChange={(e) => setInternetSpeed(e.target.value)}
                    className="w-full p-2 border rounded bg-white"
                  >
                    <option value="20">20 Mbps</option>
                    <option value="50">50 Mbps</option>
                    <option value="100">100 Mbps</option>
                    <option value="200">200 Mbps</option>
                    <option value="500">500 Mbps</option>
                    <option value="1000">1000+ Mbps</option>
                  </select>
                </div>
                
                <div className="bg-white p-6 rounded-lg">
                  <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-4">Recommended Configuration</h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b">
                      <span className="font-medium">Access Points Needed:</span>
                      <span className="text-xl font-bold text-circleTel-orange">{getRecommendedAPs()}</span>
                    </div>
                    
                    <div className="flex justify-between items-center pb-2 border-b">
                      <span className="font-medium">Recommended Internet Speed:</span>
                      <span className="text-xl font-bold text-circleTel-orange">
                        {getRecommendedSpeed()} Mbps
                        {parseInt(internetSpeed) < getRecommendedSpeed() && (
                          <span className="ml-2 text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                            Upgrade Recommended
                          </span>
                        )}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center pb-2 border-b">
                      <span className="font-medium">Suggested Wi-Fi Standard:</span>
                      <span className="text-xl font-bold text-circleTel-orange">Wi-Fi 6</span>
                    </div>
                  </div>
                  
                  <div className="mt-6 text-center">
                    <Button size="lg" className="bg-circleTel-orange hover:bg-circleTel-orange/90 text-white">
                      <Printer className="mr-2" size={18} />
                      Print Recommendations
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Checklists and Resources */}
        <section id="checklists" className="py-16 bg-circleTel-lightNeutral">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-6 text-center">Wi-Fi Deployment Tools</h2>
              <div className="bg-circleTel-orange h-1 w-20 mx-auto mb-8"></div>
              
              <Tabs defaultValue="checklist">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="checklist">Deployment Checklist</TabsTrigger>
                  <TabsTrigger value="templates">Planning Templates</TabsTrigger>
                  <TabsTrigger value="best-practices">Best Practices</TabsTrigger>
                </TabsList>
                
                <TabsContent value="checklist" className="mt-6 bg-white p-6 rounded-lg shadow">
                  <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-4">Wi-Fi Deployment Checklist</h3>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-start">
                      <CheckCircle2 className="text-circleTel-orange mr-2 mt-1 flex-shrink-0" size={18} />
                      <div>
                        <p className="font-medium">Conduct site survey</p>
                        <p className="text-sm text-circleTel-secondaryNeutral">Identify potential coverage areas, interference sources, and mounting locations</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle2 className="text-circleTel-orange mr-2 mt-1 flex-shrink-0" size={18} />
                      <div>
                        <p className="font-medium">Map user density areas</p>
                        <p className="text-sm text-circleTel-secondaryNeutral">Determine high-traffic areas requiring additional capacity</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle2 className="text-circleTel-orange mr-2 mt-1 flex-shrink-0" size={18} />
                      <div>
                        <p className="font-medium">Verify power requirements</p>
                        <p className="text-sm text-circleTel-secondaryNeutral">Confirm PoE switch capacity or need for local power adapters</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle2 className="text-circleTel-orange mr-2 mt-1 flex-shrink-0" size={18} />
                      <div>
                        <p className="font-medium">Plan network segmentation</p>
                        <p className="text-sm text-circleTel-secondaryNeutral">Separate guest, employee, and IoT device traffic</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle2 className="text-circleTel-orange mr-2 mt-1 flex-shrink-0" size={18} />
                      <div>
                        <p className="font-medium">Configure security protocols</p>
                        <p className="text-sm text-circleTel-secondaryNeutral">Implement WPA3 or WPA2-Enterprise with proper authentication</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <Button className="bg-circleTel-orange hover:bg-circleTel-orange/90 text-white">
                      <Download className="mr-2" size={18} />
                      Download Full Checklist (PDF)
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="templates" className="mt-6 bg-white p-6 rounded-lg shadow">
                  <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-4">Wi-Fi Planning Templates</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="border p-4 rounded-lg hover:shadow-md transition-shadow">
                      <h4 className="font-bold mb-2">Wi-Fi Requirements Questionnaire</h4>
                      <p className="text-sm text-circleTel-secondaryNeutral mb-3">Business requirements gathering template to ensure your Wi-Fi meets all needs.</p>
                      <Button variant="outline" size="sm" className="text-circleTel-orange border-circleTel-orange hover:bg-circleTel-orange hover:text-white">
                        <Download className="mr-2" size={14} />
                        Download DOCX
                      </Button>
                    </div>
                    <div className="border p-4 rounded-lg hover:shadow-md transition-shadow">
                      <h4 className="font-bold mb-2">Access Point Placement Map</h4>
                      <p className="text-sm text-circleTel-secondaryNeutral mb-3">Office floorplan template with AP placement guide and coverage zones.</p>
                      <Button variant="outline" size="sm" className="text-circleTel-orange border-circleTel-orange hover:bg-circleTel-orange hover:text-white">
                        <Download className="mr-2" size={14} />
                        Download PDF
                      </Button>
                    </div>
                    <div className="border p-4 rounded-lg hover:shadow-md transition-shadow">
                      <h4 className="font-bold mb-2">SSID Planning Worksheet</h4>
                      <p className="text-sm text-circleTel-secondaryNeutral mb-3">Template to plan your wireless networks, security settings, and VLANs.</p>
                      <Button variant="outline" size="sm" className="text-circleTel-orange border-circleTel-orange hover:bg-circleTel-orange hover:text-white">
                        <Download className="mr-2" size={14} />
                        Download XLSX
                      </Button>
                    </div>
                    <div className="border p-4 rounded-lg hover:shadow-md transition-shadow">
                      <h4 className="font-bold mb-2">Wi-Fi Post-Deployment Test Plan</h4>
                      <p className="text-sm text-circleTel-secondaryNeutral mb-3">Comprehensive testing checklist to verify coverage and performance.</p>
                      <Button variant="outline" size="sm" className="text-circleTel-orange border-circleTel-orange hover:bg-circleTel-orange hover:text-white">
                        <Download className="mr-2" size={14} />
                        Download PDF
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="best-practices" className="mt-6 bg-white p-6 rounded-lg shadow">
                  <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-4">South African Wi-Fi Best Practices</h3>
                  <div className="prose max-w-none">
                    <h4 className="font-bold mt-4 mb-2">1. Account for Load Shedding</h4>
                    <p className="text-sm text-circleTel-secondaryNeutral mb-3">
                      Ensure all critical network gear is connected to UPS systems sized appropriately for your typical load shedding schedule. Consider PoE-powered access points to extend runtime during outages.
                    </p>
                    
                    <h4 className="font-bold mt-4 mb-2">2. Channel Planning</h4>
                    <p className="text-sm text-circleTel-secondaryNeutral mb-3">
                      In dense urban areas like Sandton, Rosebank, or Cape Town CBD, channel congestion can be severe. Use tools like Wi-Fi Analyzer to identify the least congested channels in both 2.4GHz and 5GHz bands.
                    </p>
                    
                    <h4 className="font-bold mt-4 mb-2">3. Multi-ISP Considerations</h4>
                    <p className="text-sm text-circleTel-secondaryNeutral mb-3">
                      For businesses implementing redundant internet connections, ensure your wireless controller can handle failover between multiple WANs without disrupting Wi-Fi connectivity.
                    </p>
                    
                    <h4 className="font-bold mt-4 mb-2">4. Optimize for Video Conferencing</h4>
                    <p className="text-sm text-circleTel-secondaryNeutral mb-3">
                      With remote work becoming standard, implement QoS policies that prioritize video conferencing traffic on business SSIDs while limiting bandwidth consumption on guest networks.
                    </p>
                    
                    <div className="p-4 border-l-4 border-circleTel-orange bg-circleTel-lightNeutral mt-6">
                      <p className="italic text-circleTel-secondaryNeutral">
                        "For multi-story buildings in South Africa, prioritize 5GHz coverage for better performance and less interference, but ensure 2.4GHz coverage for compatibility with older devices."
                      </p>
                      <p className="font-medium mt-2">— CircleTel Network Engineering Team</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-4">Need expert Wi-Fi deployment support?</h2>
              <p className="text-lg text-circleTel-secondaryNeutral mb-8">
                Our Wi-Fi as a Service offering provides professionally designed, installed, and managed wireless networks with no upfront capital costs.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button asChild size="lg" className="bg-circleTel-orange hover:bg-circleTel-orange/90 text-white">
                  <Link to="/connectivity/wifi-as-a-service">
                    Learn About Wi-Fi as a Service <ArrowRight size={16} className="ml-2" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="border-circleTel-orange text-circleTel-orange hover:bg-circleTel-orange hover:text-white">
                  <Link to="/contact">Request a Site Survey</Link>
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

export default WiFiToolkit;
