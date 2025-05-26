
import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BundleQuoteForm from '@/components/forms/BundleQuoteForm';
import PromotionalBanner from '@/components/common/PromotionalBanner';
import { Check, Wifi, Shield, Home, GraduationCap, Users, Cloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const HomeSohoResilience = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <PromotionalBanner showCloseButton={false} />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-b from-white to-circleTel-lightNeutral">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="bg-blue-500 text-white px-4 py-2 rounded-full inline-block mb-6">
                <span className="font-bold">🏠 Home & SOHO Bundle</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold text-circleTel-darkNeutral mb-6">
                Home & SOHO Resilience Bundle
              </h1>
              
              <p className="text-xl text-circleTel-secondaryNeutral mb-8">
                Secure, reliable Wi-Fi for homeschooling families and small home offices across rural and urban South Africa
              </p>
              
              <div className="bg-white p-8 rounded-2xl shadow-lg mb-8 max-w-md mx-auto border-2 border-blue-500">
                <div className="text-center">
                  <p className="text-circleTel-secondaryNeutral mb-2">Perfect for homes</p>
                  <p className="text-4xl font-bold text-circleTel-darkNeutral mb-2">
                    R999<span className="text-lg text-circleTel-secondaryNeutral">/month</span>
                  </p>
                  <p className="text-sm text-green-600 font-medium">
                    Affordable vs. MTN retail (R900-R1,100)
                  </p>
                  <p className="text-sm text-circleTel-secondaryNeutral mt-2">
                    + FREE installation & setup for homeschooling
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="primary-button">
                  <Link to="#quote-form">Get Your Quote</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/contact">Free Home Assessment</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* What's Included Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-circleTel-darkNeutral mb-12">
              Everything Your Home Office Needs
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
              <div className="text-center p-6 bg-circleTel-lightNeutral rounded-xl">
                <div className="bg-blue-500 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Wifi className="text-white" size={32} />
                </div>
                <h3 className="font-bold text-circleTel-darkNeutral mb-2">50Mbps Wi-Fi 6</h3>
                <p className="text-circleTel-secondaryNeutral text-sm">High-speed MTN FWA with latest Wi-Fi technology</p>
              </div>
              
              <div className="text-center p-6 bg-circleTel-lightNeutral rounded-xl">
                <div className="bg-blue-500 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Shield className="text-white" size={32} />
                </div>
                <h3 className="font-bold text-circleTel-darkNeutral mb-2">Parental Controls</h3>
                <p className="text-circleTel-secondaryNeutral text-sm">Safe internet for children with content filtering</p>
              </div>
              
              <div className="text-center p-6 bg-circleTel-lightNeutral rounded-xl">
                <div className="bg-blue-500 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Users className="text-white" size={32} />
                </div>
                <h3 className="font-bold text-circleTel-darkNeutral mb-2">Guest Wi-Fi</h3>
                <p className="text-circleTel-secondaryNeutral text-sm">Separate secure network for visitors and clients</p>
              </div>
              
              <div className="text-center p-6 bg-circleTel-lightNeutral rounded-xl">
                <div className="bg-blue-500 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Cloud className="text-white" size={32} />
                </div>
                <h3 className="font-bold text-circleTel-darkNeutral mb-2">1GB Cloud Backup</h3>
                <p className="text-circleTel-secondaryNeutral text-sm">Secure backup for important documents and files</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-circleTel-lightNeutral to-white p-8 rounded-2xl">
              <h3 className="text-2xl font-bold text-circleTel-darkNeutral mb-6 text-center">
                Complete Home Connectivity Package
              </h3>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-bold text-circleTel-darkNeutral mb-4">Connectivity Features</h4>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>50Mbps MTN Fixed Wireless Access</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Wi-Fi 6 router with full home coverage</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Guest network with time-based access</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Professional installation and optimization</span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-bold text-circleTel-darkNeutral mb-4">Safety & Support</h4>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Advanced parental controls and content filtering</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Basic IT support for 1-2 devices</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>1GB Acronis cloud backup</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Remote assistance and troubleshooting</span>
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
                Designed for South African Homes & SOHOs
              </h2>
              
              <div className="grid md:grid-cols-3 gap-8 mb-12">
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <div className="text-center mb-4">
                    <GraduationCap className="text-blue-500 mx-auto mb-2" size={48} />
                    <h3 className="font-bold text-circleTel-darkNeutral">Homeschooling Families</h3>
                  </div>
                  <ul className="text-circleTel-secondaryNeutral space-y-2">
                    <li>• Safe, filtered internet for children</li>
                    <li>• Reliable connectivity for online learning</li>
                    <li>• Multiple device support</li>
                    <li>• Time-based access controls</li>
                  </ul>
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <div className="text-center mb-4">
                    <Home className="text-blue-500 mx-auto mb-2" size={48} />
                    <h3 className="font-bold text-circleTel-darkNeutral">Small Home Offices</h3>
                  </div>
                  <ul className="text-circleTel-secondaryNeutral space-y-2">
                    <li>• Professional-grade connectivity</li>
                    <li>• Secure client network separation</li>
                    <li>• Cloud backup for documents</li>
                    <li>• Remote work optimization</li>
                  </ul>
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <div className="text-center mb-4">
                    <Wifi className="text-blue-500 mx-auto mb-2" size={48} />
                    <h3 className="font-bold text-circleTel-darkNeutral">Rural & Peri-Urban</h3>
                  </div>
                  <ul className="text-circleTel-secondaryNeutral space-y-2">
                    <li>• No fibre infrastructure needed</li>
                    <li>• MTN's extensive rural coverage</li>
                    <li>• Quick deployment (48 hours)</li>
                    <li>• Reliable alternative to cellular</li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-white p-8 rounded-xl shadow-lg">
                <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-6 text-center">
                  Homeschooling Success with Reliable Connectivity
                </h3>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-semibold text-circleTel-darkNeutral mb-4">Educational Benefits</h4>
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-start">
                        <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                        <span>Uninterrupted access to online curricula and resources</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                        <span>High-quality video conferencing for virtual classes</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                        <span>Safe, filtered internet environment for children</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                        <span>Multiple device support for family learning</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-circleTel-darkNeutral mb-4">Parent Peace of Mind</h4>
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-start">
                        <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                        <span>Time-based access controls and scheduling</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                        <span>Content filtering and monitoring tools</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                        <span>Guest network for visitors</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                        <span>Professional tech support when needed</span>
                      </li>
                    </ul>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800 text-center">
                    <strong>Special Homeschooling Setup:</strong> Free consultation with educational technology specialist included
                  </p>
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
                    Get Connected Today
                  </h2>
                  <p className="text-circleTel-secondaryNeutral mb-6">
                    Transform your home into a connected learning and working environment. Our team specializes in rural and peri-urban installations.
                  </p>
                  
                  <div className="bg-circleTel-lightNeutral p-6 rounded-xl mb-6">
                    <h3 className="font-bold text-circleTel-darkNeutral mb-4">Quick Setup Process</h3>
                    <ol className="space-y-3">
                      <li className="flex items-start">
                        <span className="bg-blue-500 text-white rounded-full h-6 w-6 flex items-center justify-center mr-3 mt-0.5 text-sm font-bold">1</span>
                        <span className="text-circleTel-secondaryNeutral">Free home connectivity assessment</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-blue-500 text-white rounded-full h-6 w-6 flex items-center justify-center mr-3 mt-0.5 text-sm font-bold">2</span>
                        <span className="text-circleTel-secondaryNeutral">FWA coverage check and site survey</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-blue-500 text-white rounded-full h-6 w-6 flex items-center justify-center mr-3 mt-0.5 text-sm font-bold">3</span>
                        <span className="text-circleTel-secondaryNeutral">Professional installation within 48 hours</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-blue-500 text-white rounded-full h-6 w-6 flex items-center justify-center mr-3 mt-0.5 text-sm font-bold">4</span>
                        <span className="text-circleTel-secondaryNeutral">Personalized setup for homeschooling/SOHO</span>
                      </li>
                    </ol>
                  </div>

                  <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 p-4 rounded-lg">
                    <p className="text-green-800 font-medium text-center">
                      🎁 First Month FREE + Free Homeschooling Consultation
                    </p>
                  </div>
                </div>
                
                <div>
                  <BundleQuoteForm bundleName="Home & SOHO Resilience" />
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

export default HomeSohoResilience;
