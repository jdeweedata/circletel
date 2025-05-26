
import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BundleQuoteForm from '@/components/forms/BundleQuoteForm';
import PromotionalBanner from '@/components/common/PromotionalBanner';
import { Check, Wifi, Headphones, Globe, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const BusinessConnect = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <PromotionalBanner showCloseButton={false} />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-b from-white to-circleTel-lightNeutral">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="bg-circleTel-orange text-white px-4 py-2 rounded-full inline-block mb-6">
                <span className="font-bold">Entry-Level Bundle</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold text-circleTel-darkNeutral mb-6">
                Business Connect Bundle
              </h1>
              
              <p className="text-xl text-circleTel-secondaryNeutral mb-8">
                Affordable connectivity and essential IT support for small businesses and SOHOs across South Africa
              </p>
              
              <div className="bg-white p-8 rounded-2xl shadow-lg mb-8 max-w-md mx-auto">
                <div className="text-center">
                  <p className="text-circleTel-secondaryNeutral mb-2">Starting at</p>
                  <p className="text-4xl font-bold text-circleTel-darkNeutral mb-2">
                    R999<span className="text-lg text-circleTel-secondaryNeutral">/month</span>
                  </p>
                  <p className="text-sm text-green-600 font-medium">
                    5-10% cheaper than MetroFibre FTTB solutions
                  </p>
                  <p className="text-sm text-circleTel-secondaryNeutral mt-2">
                    + FREE installation with 12-month contract
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="primary-button">
                  <Link to="#quote-form">Get Your Quote</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/contact">Schedule Free Consultation</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* What's Included Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-circleTel-darkNeutral mb-12">
              What's Included in Business Connect
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
              <div className="text-center p-6 bg-circleTel-lightNeutral rounded-xl">
                <div className="bg-circleTel-orange rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Wifi className="text-white" size={32} />
                </div>
                <h3 className="font-bold text-circleTel-darkNeutral mb-2">50Mbps Fixed Wireless</h3>
                <p className="text-circleTel-secondaryNeutral text-sm">MTN-powered FWA with Wi-Fi 6 router for reliable connectivity</p>
              </div>
              
              <div className="text-center p-6 bg-circleTel-lightNeutral rounded-xl">
                <div className="bg-circleTel-orange rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Headphones className="text-white" size={32} />
                </div>
                <h3 className="font-bold text-circleTel-darkNeutral mb-2">Remote IT Helpdesk</h3>
                <p className="text-circleTel-secondaryNeutral text-sm">8x5 support for up to 10 devices with remote assistance</p>
              </div>
              
              <div className="text-center p-6 bg-circleTel-lightNeutral rounded-xl">
                <div className="bg-circleTel-orange rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Shield className="text-white" size={32} />
                </div>
                <h3 className="font-bold text-circleTel-darkNeutral mb-2">Endpoint Management</h3>
                <p className="text-circleTel-secondaryNeutral text-sm">Basic device monitoring and security updates</p>
              </div>
              
              <div className="text-center p-6 bg-circleTel-lightNeutral rounded-xl">
                <div className="bg-circleTel-orange rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Globe className="text-white" size={32} />
                </div>
                <h3 className="font-bold text-circleTel-darkNeutral mb-2">Domain & DNS</h3>
                <p className="text-circleTel-secondaryNeutral text-sm">Professional domain setup and DNS management</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-circleTel-lightNeutral to-white p-8 rounded-2xl">
              <h3 className="text-2xl font-bold text-circleTel-darkNeutral mb-6 text-center">
                Complete Technical Specifications
              </h3>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-bold text-circleTel-darkNeutral mb-4">Connectivity Package</h4>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>50Mbps MTN Fixed Wireless Access</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Wi-Fi 6 router with full building coverage</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Guest network and parental controls</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Professional installation and setup</span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-bold text-circleTel-darkNeutral mb-4">IT Support Package</h4>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>8x5 remote helpdesk support</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Basic endpoint monitoring (up to 10 devices)</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Security updates and patch management</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Domain and DNS management</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Perfect For Section */}
        <section className="py-16 bg-circleTel-lightNeutral">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center text-circleTel-darkNeutral mb-12">
                Perfect For Your Business
              </h2>
              
              <div className="grid md:grid-cols-3 gap-8 mb-12">
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <h3 className="font-bold text-circleTel-darkNeutral mb-4">Small Offices (1-10 employees)</h3>
                  <ul className="text-circleTel-secondaryNeutral space-y-2">
                    <li>• Professional services</li>
                    <li>• Retail businesses</li>
                    <li>• Consulting firms</li>
                    <li>• Start-up companies</li>
                  </ul>
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <h3 className="font-bold text-circleTel-darkNeutral mb-4">SOHO Operations</h3>
                  <ul className="text-circleTel-secondaryNeutral space-y-2">
                    <li>• Home-based businesses</li>
                    <li>• Freelancers and consultants</li>
                    <li>• Creative agencies</li>
                    <li>• Online retailers</li>
                  </ul>
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <h3 className="font-bold text-circleTel-darkNeutral mb-4">Rural & Urban</h3>
                  <ul className="text-circleTel-secondaryNeutral space-y-2">
                    <li>• Urban business districts</li>
                    <li>• Peri-urban areas</li>
                    <li>• Rural towns and communities</li>
                    <li>• Areas with limited fibre access</li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-white p-8 rounded-xl shadow-lg">
                <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-4">Why Choose Business Connect?</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-circleTel-darkNeutral mb-2">Cost Savings</h4>
                    <p className="text-circleTel-secondaryNeutral text-sm">
                      5-10% cheaper than equivalent MetroFibre FTTB packages. No infrastructure costs, no line rental fees.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-circleTel-darkNeutral mb-2">Quick Deployment</h4>
                    <p className="text-circleTel-secondaryNeutral text-sm">
                      48-hour installation vs. weeks for fibre. Get connected faster with MTN's extensive FWA network.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-circleTel-darkNeutral mb-2">Rural Ready</h4>
                    <p className="text-circleTel-secondaryNeutral text-sm">
                      Designed for South African conditions. Works in areas where fibre isn't available or practical.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-circleTel-darkNeutral mb-2">IT Peace of Mind</h4>
                    <p className="text-circleTel-secondaryNeutral text-sm">
                      No need for dedicated IT staff. We handle your tech so you can focus on growing your business.
                    </p>
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
                    Ready to Get Connected?
                  </h2>
                  <p className="text-circleTel-secondaryNeutral mb-6">
                    Get your personalized Business Connect quote today. Our team will assess your location and provide a detailed proposal within 24 hours.
                  </p>
                  
                  <div className="bg-circleTel-lightNeutral p-6 rounded-xl mb-6">
                    <h3 className="font-bold text-circleTel-darkNeutral mb-4">What Happens Next?</h3>
                    <ol className="space-y-3">
                      <li className="flex items-start">
                        <span className="bg-circleTel-orange text-white rounded-full h-6 w-6 flex items-center justify-center mr-3 mt-0.5 text-sm font-bold">1</span>
                        <span className="text-circleTel-secondaryNeutral">Free site survey and coverage check</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-circleTel-orange text-white rounded-full h-6 w-6 flex items-center justify-center mr-3 mt-0.5 text-sm font-bold">2</span>
                        <span className="text-circleTel-secondaryNeutral">Detailed quote with installation timeline</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-circleTel-orange text-white rounded-full h-6 w-6 flex items-center justify-center mr-3 mt-0.5 text-sm font-bold">3</span>
                        <span className="text-circleTel-secondaryNeutral">Professional installation within 48 hours</span>
                      </li>
                    </ol>
                  </div>

                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                    <p className="text-green-800 font-medium text-center">
                      🎁 Limited Time: First Month FREE + Free Installation
                    </p>
                  </div>
                </div>
                
                <div>
                  <BundleQuoteForm bundleName="Business Connect" />
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

export default BusinessConnect;
