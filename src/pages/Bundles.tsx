
import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Check, Package, Wifi, Cloud, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';

const Bundles = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
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
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 inline-block">
                <p className="text-yellow-800 font-medium">🎁 Limited Time Offer: First Month Free on All Bundles!</p>
              </div>
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
              {/* SOHO/SMME Starter Bundle */}
              <Card className="border-2 border-circleTel-orange shadow-lg rounded-xl">
                <div className="bg-circleTel-orange text-white text-center py-1 text-sm font-medium">
                  Most Popular
                </div>
                <CardHeader>
                  <div className="mb-4">
                    <Package size={40} className="text-circleTel-orange" />
                  </div>
                  <CardTitle className="text-2xl font-bold">SOHO/SMME Starter Bundle</CardTitle>
                  <CardDescription className="text-circleTel-secondaryNeutral">
                    Complete IT solution for small businesses
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="mb-6">
                    <p className="text-3xl font-bold">R1,999<span className="text-sm text-circleTel-secondaryNeutral font-normal">/month</span></p>
                    <p className="text-sm text-circleTel-secondaryNeutral mt-1">15% savings compared to individual services</p>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="font-bold text-circleTel-darkNeutral mb-3">What's Included:</h3>
                    <ul className="space-y-3">
                      <li className="flex items-center">
                        <Check className="h-5 w-5 text-green-500 mr-2" />
                        <span>Basic Managed IT (up to 5 users)</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="h-5 w-5 text-green-500 mr-2" />
                        <span>Business WaaS (up to 30 users)</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="h-5 w-5 text-green-500 mr-2" />
                        <span>100GB Acronis Cloud Backup</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="h-5 w-5 text-green-500 mr-2" />
                        <span className="font-medium">15% discount on total package</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full bg-circleTel-orange hover:bg-circleTel-orange/90 text-white rounded-full"
                    asChild
                  >
                    <Link to="/contact">Get Started</Link>
                  </Button>
                </CardFooter>
              </Card>
              
              {/* Homeschooling & Remote Work Bundle */}
              <Card className="border-2 border-gray-200 shadow-md rounded-xl">
                <CardHeader className="pt-8">
                  <div className="mb-4">
                    <Wifi size={40} className="text-circleTel-orange" />
                  </div>
                  <CardTitle className="text-2xl font-bold">Homeschooling & Remote Work Bundle</CardTitle>
                  <CardDescription className="text-circleTel-secondaryNeutral">
                    Complete connectivity solution for homes
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="mb-6">
                    <p className="text-3xl font-bold">R999<span className="text-sm text-circleTel-secondaryNeutral font-normal">/month</span></p>
                    <p className="text-sm text-circleTel-secondaryNeutral mt-1">12% savings compared to individual services</p>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="font-bold text-circleTel-darkNeutral mb-3">What's Included:</h3>
                    <ul className="space-y-3">
                      <li className="flex items-center">
                        <Check className="h-5 w-5 text-green-500 mr-2" />
                        <span>Home WaaS</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="h-5 w-5 text-green-500 mr-2" />
                        <span>50GB Acronis Cloud Backup</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="h-5 w-5 text-green-500 mr-2" />
                        <span>1 Virtual Desktop</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="h-5 w-5 text-green-500 mr-2" />
                        <span>Perfect for rural/peri-urban homes</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full bg-circleTel-darkNeutral hover:bg-circleTel-darkNeutral/90 text-white rounded-full"
                    asChild
                  >
                    <Link to="/contact">Get Started</Link>
                  </Button>
                </CardFooter>
              </Card>
              
              {/* Custom Bundle */}
              <Card className="border-2 border-gray-200 shadow-md rounded-xl">
                <CardHeader className="pt-8">
                  <div className="mb-4">
                    <Cloud size={40} className="text-circleTel-orange" />
                  </div>
                  <CardTitle className="text-2xl font-bold">Custom Bundle</CardTitle>
                  <CardDescription className="text-circleTel-secondaryNeutral">
                    Build your own custom IT and connectivity package
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="mb-6">
                    <p className="text-xl font-bold">Custom Pricing</p>
                    <p className="text-sm text-circleTel-secondaryNeutral mt-1">Up to 20% savings on your custom package</p>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="font-bold text-circleTel-darkNeutral mb-3">You Choose:</h3>
                    <ul className="space-y-3">
                      <li className="flex items-center">
                        <Check className="h-5 w-5 text-green-500 mr-2" />
                        <span>Your IT service level</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="h-5 w-5 text-green-500 mr-2" />
                        <span>WaaS option that fits your needs</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="h-5 w-5 text-green-500 mr-2" />
                        <span>Cloud services based on your requirements</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="h-5 w-5 text-green-500 mr-2" />
                        <span>Bundle discount based on services selected</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full bg-circleTel-darkNeutral hover:bg-circleTel-darkNeutral/90 text-white rounded-full"
                    asChild
                  >
                    <Link to="/contact">Contact Us</Link>
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
            
            <div className="bg-white p-8 rounded-xl shadow-md max-w-3xl mx-auto">
              <h3 className="text-xl font-bold mb-6">See How Much You Save with Our Bundles</h3>
              
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h4 className="font-bold mb-4">SOHO/SMME Starter Bundle</h4>
                  <ul className="space-y-2">
                    <li className="flex justify-between">
                      <span>Basic Managed IT (5 users):</span>
                      <span>R945/mo</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Business WaaS:</span>
                      <span>R1,599/mo</span>
                    </li>
                    <li className="flex justify-between">
                      <span>100GB Cloud Backup:</span>
                      <span>R350/mo</span>
                    </li>
                    <li className="border-t pt-2 mt-2 font-bold flex justify-between">
                      <span>Individual Price:</span>
                      <span>R2,894/mo</span>
                    </li>
                    <li className="text-green-600 font-bold flex justify-between">
                      <span>Bundle Price:</span>
                      <span>R1,999/mo</span>
                    </li>
                    <li className="text-green-600 font-bold flex justify-between">
                      <span>Your Savings:</span>
                      <span>R895/mo</span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-bold mb-4">Home & Remote Work Bundle</h4>
                  <ul className="space-y-2">
                    <li className="flex justify-between">
                      <span>Home WaaS:</span>
                      <span>R699/mo</span>
                    </li>
                    <li className="flex justify-between">
                      <span>50GB Cloud Backup:</span>
                      <span>R175/mo</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Virtual Desktop:</span>
                      <span>R109/mo</span>
                    </li>
                    <li className="border-t pt-2 mt-2 font-bold flex justify-between">
                      <span>Individual Price:</span>
                      <span>R983/mo</span>
                    </li>
                    <li className="text-green-600 font-bold flex justify-between">
                      <span>Bundle Price:</span>
                      <span>R999/mo</span>
                    </li>
                    <li className="text-green-600 font-bold flex justify-between">
                      <span>Your Savings:</span>
                      <span>R134/mo</span>
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
