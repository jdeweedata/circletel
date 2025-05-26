import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PromotionalBanner from '@/components/common/PromotionalBanner';
import { Check, Package, Wifi, Cloud, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';

const Bundles = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <PromotionalBanner showCloseButton={false} />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-b from-white to-circleTel-lightNeutral">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-circleTel-darkNeutral mb-6">
                All-In-One IT & Connectivity Bundles
              </h1>
              <p className="text-xl text-circleTel-secondaryNeutral mb-8">
                Complete technology solutions combining IT services, Wi-Fi connectivity, and cloud capabilities at special bundle rates.
              </p>
            </div>
          </div>
        </section>
        
        {/* Bundle Cards */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-circleTel-darkNeutral mb-12">
              Choose Your Perfect Bundle
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Business Connect Bundle */}
              <Card className="border-2 border-gray-200 shadow-lg rounded-xl">
                <CardHeader className="pt-8">
                  <div className="mb-4">
                    <Package size={40} className="text-circleTel-orange" />
                  </div>
                  <CardTitle className="text-2xl font-bold">Business Connect Bundle</CardTitle>
                  <CardDescription className="text-circleTel-secondaryNeutral">
                    Entry-level IT solution for small businesses and SOHOs
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="mb-6">
                    <p className="text-3xl font-bold">R999<span className="text-sm text-circleTel-secondaryNeutral font-normal">/month</span></p>
                    <p className="text-sm text-circleTel-secondaryNeutral mt-1">5-10% cheaper than equivalent MetroFibre solutions</p>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="font-bold text-circleTel-darkNeutral mb-3">What's Included:</h3>
                    <ul className="space-y-3">
                      <li className="flex items-center">
                        <Check className="h-5 w-5 text-green-500 mr-2" />
                        <span>50Mbps MTN Fixed Wireless</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="h-5 w-5 text-green-500 mr-2" />
                        <span>Remote IT Helpdesk (8x5)</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="h-5 w-5 text-green-500 mr-2" />
                        <span>Endpoint Management</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="h-5 w-5 text-green-500 mr-2" />
                        <span>Domain & DNS Setup</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full bg-circleTel-darkNeutral hover:bg-circleTel-darkNeutral/90 text-white rounded-full"
                    asChild
                  >
                    <Link to="/bundles/business-connect">Learn More</Link>
                  </Button>
                </CardFooter>
              </Card>
              
              {/* Business Pro Bundle */}
              <Card className="border-2 border-circleTel-orange shadow-lg rounded-xl">
                <div className="bg-circleTel-orange text-white text-center py-1 text-sm font-medium">
                  Most Popular
                </div>
                <CardHeader>
                  <div className="mb-4">
                    <Wifi size={40} className="text-circleTel-orange" />
                  </div>
                  <CardTitle className="text-2xl font-bold">Business Pro Bundle</CardTitle>
                  <CardDescription className="text-circleTel-secondaryNeutral">
                    Complete resilience solution for growing SMEs
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="mb-6">
                    <p className="text-3xl font-bold">R1,999<span className="text-sm text-circleTel-secondaryNeutral font-normal">/month</span></p>
                    <p className="text-sm text-circleTel-secondaryNeutral mt-1">86% savings vs. in-house IT setup</p>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="font-bold text-circleTel-darkNeutral mb-3">What's Included:</h3>
                    <ul className="space-y-3">
                      <li className="flex items-center">
                        <Check className="h-5 w-5 text-green-500 mr-2" />
                        <span>100Mbps MTN Fixed Wireless</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="h-5 w-5 text-green-500 mr-2" />
                        <span>Managed UPS for Load Shedding</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="h-5 w-5 text-green-500 mr-2" />
                        <span>Enhanced IT Support</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="h-5 w-5 text-green-500 mr-2" />
                        <span>2GB Acronis Cloud Backup</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full bg-circleTel-orange hover:bg-circleTel-orange/90 text-white rounded-full"
                    asChild
                  >
                    <Link to="/bundles/business-pro">Learn More</Link>
                  </Button>
                </CardFooter>
              </Card>
              
              {/* Home & SOHO Resilience Bundle */}
              <Card className="border-2 border-blue-500 shadow-lg rounded-xl">
                <CardHeader className="pt-8">
                  <div className="mb-4">
                    <Cloud size={40} className="text-blue-500" />
                  </div>
                  <CardTitle className="text-2xl font-bold">Home & SOHO Resilience</CardTitle>
                  <CardDescription className="text-circleTel-secondaryNeutral">
                    Perfect for homeschooling and rural home offices
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="mb-6">
                    <p className="text-3xl font-bold">R999<span className="text-sm text-circleTel-secondaryNeutral font-normal">/month</span></p>
                    <p className="text-sm text-circleTel-secondaryNeutral mt-1">Affordable vs. MTN retail pricing</p>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="font-bold text-circleTel-darkNeutral mb-3">What's Included:</h3>
                    <ul className="space-y-3">
                      <li className="flex items-center">
                        <Check className="h-5 w-5 text-green-500 mr-2" />
                        <span>50Mbps Wi-Fi 6 with Parental Controls</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="h-5 w-5 text-green-500 mr-2" />
                        <span>Guest Wi-Fi Network</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="h-5 w-5 text-green-500 mr-2" />
                        <span>1GB Cloud Backup</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="h-5 w-5 text-green-500 mr-2" />
                        <span>Basic IT Support (1-2 devices)</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-full"
                    asChild
                  >
                    <Link to="/bundles/home-soho-resilience">Learn More</Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>
        
        {/* Bundle Comparison */}
        <section className="py-16 bg-circleTel-lightNeutral">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-circleTel-darkNeutral mb-12">
              Bundle Savings Calculator
            </h2>
            
            <div className="bg-white p-8 rounded-xl shadow-md max-w-4xl mx-auto">
              <h3 className="text-xl font-bold mb-6">See How Much You Save with Our Bundles</h3>
              
              <div className="grid md:grid-cols-3 gap-8 mb-8">
                <div>
                  <h4 className="font-bold mb-4">Business Connect Savings</h4>
                  <ul className="space-y-2">
                    <li className="flex justify-between">
                      <span>50Mbps Business Internet:</span>
                      <span>R1,200/mo</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Basic IT Support:</span>
                      <span>R3,000/mo</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Domain & DNS:</span>
                      <span>R200/mo</span>
                    </li>
                    <li className="border-t pt-2 mt-2 font-bold flex justify-between">
                      <span>Individual Price:</span>
                      <span>R4,400/mo</span>
                    </li>
                    <li className="text-green-600 font-bold flex justify-between">
                      <span>Bundle Price:</span>
                      <span>R999/mo</span>
                    </li>
                    <li className="text-green-600 font-bold flex justify-between">
                      <span>You Save:</span>
                      <span>R3,401/mo</span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-bold mb-4">Business Pro Savings</h4>
                  <ul className="space-y-2">
                    <li className="flex justify-between">
                      <span>100Mbps Business Internet:</span>
                      <span>R2,500/mo</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Part-time IT Support:</span>
                      <span>R8,000/mo</span>
                    </li>
                    <li className="flex justify-between">
                      <span>UPS System:</span>
                      <span>R1,200/mo</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Microsoft 365:</span>
                      <span>R1,800/mo</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Backup Solution:</span>
                      <span>R800/mo</span>
                    </li>
                    <li className="border-t pt-2 font-bold flex justify-between">
                      <span>Individual Price:</span>
                      <span>R14,300/mo</span>
                    </li>
                    <li className="text-green-600 font-bold flex justify-between">
                      <span>Bundle Price:</span>
                      <span>R1,999/mo</span>
                    </li>
                    <li className="text-green-600 font-bold flex justify-between">
                      <span>You Save:</span>
                      <span>R12,301/mo</span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-bold mb-4">Home & SOHO Savings</h4>
                  <ul className="space-y-2">
                    <li className="flex justify-between">
                      <span>50Mbps Home Internet:</span>
                      <span>R900/mo</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Wi-Fi Router & Setup:</span>
                      <span>R300/mo</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Parental Controls:</span>
                      <span>R150/mo</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Cloud Backup:</span>
                      <span>R175/mo</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Tech Support:</span>
                      <span>R500/mo</span>
                    </li>
                    <li className="border-t pt-2 font-bold flex justify-between">
                      <span>Individual Price:</span>
                      <span>R2,025/mo</span>
                    </li>
                    <li className="text-green-600 font-bold flex justify-between">
                      <span>Bundle Price:</span>
                      <span>R999/mo</span>
                    </li>
                    <li className="text-green-600 font-bold flex justify-between">
                      <span>You Save:</span>
                      <span>R1,026/mo</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              <Button asChild className="w-full rounded-full">
                <Link to="/contact">
                  Get Your Custom Bundle Quote <ArrowRight className="ml-2" size={16} />
                </Link>
              </Button>
            </div>
          </div>
        </section>
        
        {/* Referral Program */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto bg-gradient-to-r from-circleTel-orange/10 to-circleTel-orange/5 p-8 rounded-2xl">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="md:w-1/2">
                  <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-4">
                    Refer a Friend, Earn R500
                  </h2>
                  <p className="text-circleTel-secondaryNeutral mb-6">
                    Know someone who could benefit from our services? Refer them to us and earn R500 credit toward your next invoice when they sign up.
                  </p>
                  <Button asChild className="bg-circleTel-orange hover:bg-circleTel-orange/90 text-white rounded-full">
                    <Link to="/contact">Join Referral Program</Link>
                  </Button>
                </div>
                
                <div className="md:w-1/2">
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="font-bold mb-4">How It Works</h3>
                    <ol className="space-y-3">
                      <li className="flex items-start">
                        <span className="bg-circleTel-orange text-white rounded-full h-6 w-6 flex items-center justify-center mr-2 flex-shrink-0">1</span>
                        <span>Refer a friend or business associate</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-circleTel-orange text-white rounded-full h-6 w-6 flex items-center justify-center mr-2 flex-shrink-0">2</span>
                        <span>They sign up for any of our services</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-circleTel-orange text-white rounded-full h-6 w-6 flex items-center justify-center mr-2 flex-shrink-0">3</span>
                        <span>You receive R500 credit on your next invoice</span>
                      </li>
                    </ol>
                  </div>
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

export default Bundles;
