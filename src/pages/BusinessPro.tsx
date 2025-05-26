
import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BundleQuoteForm from '@/components/forms/BundleQuoteForm';
import PromotionalBanner from '@/components/common/PromotionalBanner';
import { Check, Wifi, Shield, Battery, Cloud, Headphones, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const BusinessPro = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <PromotionalBanner showCloseButton={false} />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-b from-white to-circleTel-lightNeutral">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="bg-gradient-to-r from-circleTel-orange to-orange-500 text-white px-4 py-2 rounded-full inline-block mb-6">
                <span className="font-bold">⭐ Most Popular Bundle</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold text-circleTel-darkNeutral mb-6">
                Business Pro Bundle
              </h1>
              
              <p className="text-xl text-circleTel-secondaryNeutral mb-8">
                Maximize uptime and productivity with resilient connectivity, proactive IT support, and data backup for growing SMEs
              </p>
              
              <div className="bg-white p-8 rounded-2xl shadow-lg mb-8 max-w-md mx-auto border-2 border-circleTel-orange">
                <div className="text-center">
                  <p className="text-circleTel-secondaryNeutral mb-2">Complete package</p>
                  <p className="text-4xl font-bold text-circleTel-darkNeutral mb-2">
                    R1,999<span className="text-lg text-circleTel-secondaryNeutral">/month</span>
                  </p>
                  <p className="text-sm text-green-600 font-medium">
                    Comprehensive IT solution for growing businesses
                  </p>
                  <p className="text-sm text-circleTel-secondaryNeutral mt-2">
                    + FREE installation & managed UPS system
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="primary-button">
                  <Link to="#quote-form">Get Your Quote</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/contact">Book Free Assessment</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* What's Included Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-circleTel-darkNeutral mb-12">
              Complete Business Resilience Package
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              <div className="text-center p-6 bg-circleTel-lightNeutral rounded-xl">
                <div className="bg-circleTel-orange rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Wifi className="text-white" size={32} />
                </div>
                <h3 className="font-bold text-circleTel-darkNeutral mb-2">100Mbps Fixed Wireless</h3>
                <p className="text-circleTel-secondaryNeutral text-sm">High-speed MTN FWA with Wi-Fi 6 for demanding workloads</p>
              </div>
              
              <div className="text-center p-6 bg-circleTel-lightNeutral rounded-xl">
                <div className="bg-circleTel-orange rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Battery className="text-white" size={32} />
                </div>
                <h3 className="font-bold text-circleTel-darkNeutral mb-2">Managed UPS System</h3>
                <p className="text-circleTel-secondaryNeutral text-sm">Load shedding protection for FWA equipment and critical devices</p>
              </div>
              
              <div className="text-center p-6 bg-circleTel-lightNeutral rounded-xl">
                <div className="bg-circleTel-orange rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Settings className="text-white" size={32} />
                </div>
                <h3 className="font-bold text-circleTel-darkNeutral mb-2">Enhanced IT Support</h3>
                <p className="text-circleTel-secondaryNeutral text-sm">Proactive monitoring, quarterly reviews, priority support</p>
              </div>
              
              <div className="text-center p-6 bg-circleTel-lightNeutral rounded-xl">
                <div className="bg-circleTel-orange rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Cloud className="text-white" size={32} />
                </div>
                <h3 className="font-bold text-circleTel-darkNeutral mb-2">Microsoft 365/Google Workspace</h3>
                <p className="text-circleTel-secondaryNeutral text-sm">Business email, collaboration tools, and productivity apps</p>
              </div>
              
              <div className="text-center p-6 bg-circleTel-lightNeutral rounded-xl">
                <div className="bg-circleTel-orange rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Shield className="text-white" size={32} />
                </div>
                <h3 className="font-bold text-circleTel-darkNeutral mb-2">2GB Acronis Backup</h3>
                <p className="text-circleTel-secondaryNeutral text-sm">Automated cloud backup with disaster recovery capabilities</p>
              </div>
              
              <div className="text-center p-6 bg-circleTel-lightNeutral rounded-xl">
                <div className="bg-circleTel-orange rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Headphones className="text-white" size={32} />
                </div>
                <h3 className="font-bold text-circleTel-darkNeutral mb-2">Priority Support</h3>
                <p className="text-circleTel-secondaryNeutral text-sm">4-hour response time with dedicated account management</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-circleTel-lightNeutral to-white p-8 rounded-2xl">
              <h3 className="text-2xl font-bold text-circleTel-darkNeutral mb-6 text-center">
                Complete Technical Specifications
              </h3>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-bold text-circleTel-darkNeutral mb-4">Connectivity & Power</h4>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>100Mbps MTN Fixed Wireless Access</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Wi-Fi 6 router with enterprise features</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Managed UPS for FWA equipment</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Load shedding monitoring and alerts</span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-bold text-circleTel-darkNeutral mb-4">IT & Cloud Services</h4>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Proactive IT monitoring (up to 30 devices)</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Quarterly IT strategy reviews</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Microsoft 365 or Google Workspace setup</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>2GB Acronis Cloud Backup</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 bg-circleTel-lightNeutral">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center text-circleTel-darkNeutral mb-12">
                Why Business Pro is Perfect for Growing SMEs
              </h2>
              
              <div className="grid md:grid-cols-2 gap-8 mb-12">
                <div className="bg-white p-8 rounded-xl shadow-lg">
                  <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-4">Load Shedding Resilience</h3>
                  <p className="text-circleTel-secondaryNeutral mb-4">
                    Keep your business running during power outages with our managed UPS system specifically designed for FWA equipment.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      <span>4-6 hours of backup power</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      <span>Automatic monitoring and alerts</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      <span>Professional maintenance included</span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-white p-8 rounded-xl shadow-lg">
                  <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-4">Data Protection & Recovery</h3>
                  <p className="text-circleTel-secondaryNeutral mb-4">
                    Protect your critical business data with Acronis cloud backup and comprehensive disaster recovery planning.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      <span>Automated daily backups</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      <span>Point-in-time recovery</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      <span>Disaster recovery testing</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-white p-8 rounded-xl shadow-lg">
                <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-6 text-center">
                  Cost Comparison: Business Pro vs. In-House IT
                </h3>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-semibold text-red-600 mb-4">Traditional In-House Setup</h4>
                    <ul className="space-y-3 text-sm">
                      <li className="flex justify-between">
                        <span>100Mbps Business Fibre</span>
                        <span>R2,500/month</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Part-time IT Support</span>
                        <span>R8,000/month</span>
                      </li>
                      <li className="flex justify-between">
                        <span>UPS System (purchase + maintenance)</span>
                        <span>R1,200/month</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Microsoft 365 Business</span>
                        <span>R1,800/month</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Backup Solution</span>
                        <span>R800/month</span>
                      </li>
                      <li className="border-t pt-2 font-bold flex justify-between text-red-600">
                        <span>Total Monthly Cost:</span>
                        <span>R14,300</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-green-600 mb-4">Business Pro Bundle</h4>
                    <ul className="space-y-3 text-sm">
                      <li className="flex justify-between">
                        <span>100Mbps FWA + Wi-Fi 6</span>
                        <span>Included</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Proactive IT Support</span>
                        <span>Included</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Managed UPS System</span>
                        <span>Included</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Microsoft 365/Google Workspace</span>
                        <span>Included</span>
                      </li>
                      <li className="flex justify-between">
                        <span>2GB Acronis Cloud Backup</span>
                        <span>Included</span>
                      </li>
                      <li className="border-t pt-2 font-bold flex justify-between text-green-600">
                        <span>Total Monthly Cost:</span>
                        <span>R1,999</span>
                      </li>
                    </ul>
                    
                    <div className="mt-4 p-4 bg-green-50 rounded-lg">
                      <p className="text-green-800 font-bold text-center">
                        You Save: R12,301/month (86% savings!)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quote Form Section */}
        <section id="quote-form" className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-2 gap-8 items-start">
                <div>
                  <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-6">
                    Transform Your Business Operations
                  </h2>
                  <p className="text-circleTel-secondaryNeutral mb-6">
                    Get a comprehensive assessment of your current IT setup and discover how Business Pro can enhance your operations while reducing costs.
                  </p>
                  
                  <div className="bg-circleTel-lightNeutral p-6 rounded-xl mb-6">
                    <h3 className="font-bold text-circleTel-darkNeutral mb-4">Your Business Pro Journey</h3>
                    <ol className="space-y-3">
                      <li className="flex items-start">
                        <span className="bg-circleTel-orange text-white rounded-full h-6 w-6 flex items-center justify-center mr-3 mt-0.5 text-sm font-bold">1</span>
                        <span className="text-circleTel-secondaryNeutral">Free business resilience assessment</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-circleTel-orange text-white rounded-full h-6 w-6 flex items-center justify-center mr-3 mt-0.5 text-sm font-bold">2</span>
                        <span className="text-circleTel-secondaryNeutral">Customized Business Pro proposal</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-circleTel-orange text-white rounded-full h-6 w-6 flex items-center justify-center mr-3 mt-0.5 text-sm font-bold">3</span>
                        <span className="text-circleTel-secondaryNeutral">Professional installation and migration</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-circleTel-orange text-white rounded-full h-6 w-6 flex items-center justify-center mr-3 mt-0.5 text-sm font-bold">4</span>
                        <span className="text-circleTel-secondaryNeutral">Ongoing proactive support and optimization</span>
                      </li>
                    </ol>
                  </div>

                  <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 p-4 rounded-lg">
                    <p className="text-green-800 font-medium text-center">
                      🎁 Limited Time: First Month FREE + Free UPS Installation
                    </p>
                  </div>
                </div>
                
                <div>
                  <BundleQuoteForm bundleName="Business Pro" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default BusinessPro;
