
import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { Button } from '@/components/ui/button';
import { FileText, Laptop, Download } from 'lucide-react';

const ResourceCard = ({ 
  title, 
  description, 
  icon: Icon, 
  link, 
  linkText 
}: { 
  title: string; 
  description: string; 
  icon: React.ComponentType<any>; 
  link: string; 
  linkText: string;
}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-circleTel-orange hover:shadow-lg transition-all duration-300">
      <div className="bg-circleTel-lightNeutral rounded-full p-4 w-16 h-16 flex items-center justify-center text-circleTel-orange mb-4">
        <Icon size={24} />
      </div>
      <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-2">{title}</h3>
      <p className="text-circleTel-secondaryNeutral mb-4">{description}</p>
      <Button asChild className="primary-button w-full">
        <Link to={link}>{linkText}</Link>
      </Button>
    </div>
  );
};

const Resources = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <section className="bg-gradient-to-b from-circleTel-lightNeutral to-white py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h1 className="text-3xl md:text-4xl font-bold text-circleTel-darkNeutral mb-4">
                IT & Connectivity Resources
              </h1>
              <p className="text-lg text-circleTel-secondaryNeutral max-w-2xl mx-auto">
                Access tools, guides, and assessments to help optimize your business technology and connectivity.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <ResourceCard 
                title="IT Health Assessment"
                description="Get a comprehensive evaluation of your IT infrastructure with actionable recommendations."
                icon={Laptop}
                link="/resources/it-health"
                linkText="Start Assessment"
              />
              
              <ResourceCard 
                title="Connectivity Guide"
                description="Download our complete guide to business connectivity options in South Africa."
                icon={FileText}
                link="/resources/connectivity-guide"
                linkText="Access Guide"
              />
              
              <ResourceCard 
                title="Wi-Fi Planning Toolkit"
                description="Tools and templates to help you plan your office Wi-Fi deployment effectively."
                icon={Download}
                link="/resources/wifi-toolkit"
                linkText="Download Toolkit"
              />
            </div>
          </div>
        </section>
        
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-circleTel-darkNeutral text-center mb-8">
              Free IT Health Check
            </h2>
            
            <div className="bg-circleTel-lightNeutral p-8 rounded-lg max-w-3xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-4">
                    Is your business technology optimized?
                  </h3>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-start">
                      <div className="bg-circleTel-orange rounded-full text-white w-6 h-6 flex items-center justify-center mr-2 mt-1">✓</div>
                      <span className="text-circleTel-secondaryNeutral">Connectivity performance review</span>
                    </li>
                    <li className="flex items-start">
                      <div className="bg-circleTel-orange rounded-full text-white w-6 h-6 flex items-center justify-center mr-2 mt-1">✓</div>
                      <span className="text-circleTel-secondaryNeutral">Network security assessment</span>
                    </li>
                    <li className="flex items-start">
                      <div className="bg-circleTel-orange rounded-full text-white w-6 h-6 flex items-center justify-center mr-2 mt-1">✓</div>
                      <span className="text-circleTel-secondaryNeutral">Cost optimization recommendations</span>
                    </li>
                    <li className="flex items-start">
                      <div className="bg-circleTel-orange rounded-full text-white w-6 h-6 flex items-center justify-center mr-2 mt-1">✓</div>
                      <span className="text-circleTel-secondaryNeutral">Scalability planning</span>
                    </li>
                  </ul>
                  <Button asChild className="primary-button">
                    <Link to="/resources/it-health">Get Your Free Assessment</Link>
                  </Button>
                </div>
                <div className="bg-white p-6 rounded-lg">
                  <h4 className="font-bold text-circleTel-darkNeutral mb-2">What clients say</h4>
                  <blockquote className="text-circleTel-secondaryNeutral italic mb-4">
                    "The IT Health Check identified several critical security vulnerabilities we weren't aware of. CircleTel's recommendations saved us from potential disaster."
                  </blockquote>
                  <div className="flex items-center">
                    <div className="bg-circleTel-orange text-white rounded-full w-10 h-10 flex items-center justify-center mr-3">JD</div>
                    <div>
                      <p className="font-bold text-circleTel-darkNeutral">James Dlamini</p>
                      <p className="text-xs text-circleTel-secondaryNeutral">CTO, TechStart SA</p>
                    </div>
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

export default Resources;
