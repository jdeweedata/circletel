
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import RecipeCard from '@/components/ui/RecipeCard';

// Icons for recipe cards
const BasicIcon = () => (
  <div className="h-6 w-6 flex items-center justify-center">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  </div>
);

const AdvancedIcon = () => (
  <div className="h-6 w-6 flex items-center justify-center">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
  </div>
);

const ScaleIcon = () => (
  <div className="h-6 w-6 flex items-center justify-center">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  </div>
);

const CloudIcon = () => (
  <div className="h-6 w-6 flex items-center justify-center">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
    </svg>
  </div>
);

const SecurityIcon = () => (
  <div className="h-6 w-6 flex items-center justify-center">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  </div>
);

const SupportIcon = () => (
  <div className="h-6 w-6 flex items-center justify-center">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  </div>
);

const Services = () => {
  const [selectedBusinessType, setSelectedBusinessType] = useState('all');
  const [selectedRecipe, setSelectedRecipe] = useState({
    cybersecurity: false,
    cloudServices: false,
    helpdesk: false,
    dataBackup: false,
    networkManagement: false,
  });

  const handleRecipeSelection = (recipe: string) => {
    setSelectedRecipe(prev => ({
      ...prev,
      [recipe]: !prev[recipe as keyof typeof prev]
    }));
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main>
        {/* Hero Section */}
        <section className="bg-white py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl font-bold text-circleTel-darkNeutral mb-4">Explore Our IT Recipes</h1>
              <p className="text-lg text-circleTel-secondaryNeutral mb-8">
                Tailored IT solutions for small businesses, mid-sized firms, and growing startups
              </p>
              <div className="flex flex-wrap justify-center gap-4 mb-12">
                <div className="bg-circleTel-lightNeutral p-6 rounded-lg w-full sm:w-auto">
                  <div className="flex flex-wrap gap-4 justify-center">
                    <div className="recipe-card p-4 bg-white rounded-lg shadow-sm border border-circleTel-orange w-32 h-40 flex items-center justify-center">
                      <div className="text-center">
                        <BasicIcon />
                        <div className="mt-2 font-space-mono text-xs">Basic IT</div>
                      </div>
                    </div>
                    <div className="recipe-card p-4 bg-white rounded-lg shadow-sm border border-circleTel-orange w-32 h-40 flex items-center justify-center">
                      <div className="text-center">
                        <AdvancedIcon />
                        <div className="mt-2 font-space-mono text-xs">Advanced IT</div>
                      </div>
                    </div>
                    <div className="recipe-card p-4 bg-white rounded-lg shadow-sm border border-circleTel-orange w-32 h-40 flex items-center justify-center">
                      <div className="text-center">
                        <ScaleIcon />
                        <div className="mt-2 font-space-mono text-xs">Scale IT</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <Button asChild className="primary-button">
                <Link to="/pricing">Get a Custom Quote</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Filter Buttons */}
        <section className="bg-circleTel-lightNeutral py-8">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-center gap-4">
              <button 
                onClick={() => setSelectedBusinessType('all')} 
                className={`circle-button px-6 py-2 ${selectedBusinessType === 'all' ? 'bg-circleTel-orange text-white' : 'bg-white text-circleTel-darkNeutral'}`}
              >
                All Recipes
              </button>
              <button 
                onClick={() => setSelectedBusinessType('small')} 
                className={`circle-button px-6 py-2 ${selectedBusinessType === 'small' ? 'bg-circleTel-orange text-white' : 'bg-white text-circleTel-darkNeutral'}`}
              >
                Small Business
              </button>
              <button 
                onClick={() => setSelectedBusinessType('mid')} 
                className={`circle-button px-6 py-2 ${selectedBusinessType === 'mid' ? 'bg-circleTel-orange text-white' : 'bg-white text-circleTel-darkNeutral'}`}
              >
                Mid-Size Business
              </button>
              <button 
                onClick={() => setSelectedBusinessType('growth')} 
                className={`circle-button px-6 py-2 ${selectedBusinessType === 'growth' ? 'bg-circleTel-orange text-white' : 'bg-white text-circleTel-darkNeutral'}`}
              >
                Growth-Ready
              </button>
            </div>
          </div>
        </section>

        {/* Small Business Recipes */}
        <section className={`py-16 ${selectedBusinessType !== 'all' && selectedBusinessType !== 'small' ? 'hidden' : ''}`}>
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-8 text-center">Simple IT for Small Businesses</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <RecipeCard 
                title="Basic IT Recipe"
                description="Essential support and security for small teams without dedicated IT staff."
                icon={<BasicIcon />}
                specs={[
                  "Help Desk Support (8/5)",
                  "Basic Security Suite",
                  "Cloud Email Setup",
                  "Data Backup Solutions"
                ]}
                proTips={[
                  "Perfect for businesses with 1-10 employees",
                  "Add weekly maintenance for optimal performance"
                ]}
                link="/services/small-business"
              />
              
              <RecipeCard 
                title="Growth IT Recipe"
                description="Balanced IT services for small businesses looking to scale operations."
                icon={<CloudIcon />}
                specs={[
                  "Help Desk Support (10/5)",
                  "Advanced Security Suite",
                  "Cloud Migration Services",
                  "Disaster Recovery Planning"
                ]}
                proTips={[
                  "Ideal for businesses with 10-25 employees",
                  "Consider adding employee security training"
                ]}
                link="/services/small-business"
              />
              
              <RecipeCard 
                title="Secure IT Recipe"
                description="Security-focused IT services for small businesses handling sensitive data."
                icon={<SecurityIcon />}
                specs={[
                  "Help Desk Support (8/5)",
                  "Premium Security Stack",
                  "Compliance Management",
                  "Regular Security Audits"
                ]}
                proTips={[
                  "Essential for businesses with regulatory requirements",
                  "Add quarterly security reviews for best protection"
                ]}
                link="/services/small-business"
              />
            </div>
            <div className="mt-8 text-center">
              <Button asChild className="outline-button">
                <Link to="/services/small-business">See Details <ArrowRight size={16} /></Link>
              </Button>
            </div>
          </div>
        </section>
        
        {/* Mid-Size Business Recipes */}
        <section className={`py-16 bg-circleTel-lightNeutral ${selectedBusinessType !== 'all' && selectedBusinessType !== 'mid' ? 'hidden' : ''}`}>
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-8 text-center">Proactive IT for Mid-Sized Firms</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <RecipeCard 
                title="Core IT Recipe"
                description="Comprehensive IT management for established mid-size businesses."
                icon={<SupportIcon />}
                specs={[
                  "24/7 Help Desk Support",
                  "Enhanced Security Suite",
                  "Hybrid Cloud Management",
                  "IT Asset Management"
                ]}
                proTips={[
                  "Designed for businesses with 25-50 employees",
                  "Includes quarterly IT strategy sessions"
                ]}
                link="/services/mid-size"
              />
              
              <RecipeCard 
                title="Advanced IT Recipe"
                description="Premium IT services with strategic planning for mid-size operations."
                icon={<AdvancedIcon />}
                specs={[
                  "24/7 Priority Support",
                  "Enterprise Security Stack",
                  "Full Cloud Integration",
                  "Business Continuity Planning"
                ]}
                proTips={[
                  "Optimal for businesses with 50-100 employees",
                  "Includes dedicated account manager"
                ]}
                link="/services/mid-size"
              />
              
              <RecipeCard 
                title="Enterprise IT Recipe"
                description="Enterprise-grade IT solutions for larger mid-size businesses."
                icon={<CloudIcon />}
                specs={[
                  "24/7 VIP Support",
                  "Custom Security Architecture",
                  "Multi-site Management",
                  "IT Governance Framework"
                ]}
                proTips={[
                  "Designed for businesses with 100+ employees",
                  "Includes monthly executive briefings"
                ]}
                link="/services/mid-size"
              />
            </div>
            <div className="mt-8 text-center">
              <Button asChild className="outline-button">
                <Link to="/services/mid-size">See Details <ArrowRight size={16} /></Link>
              </Button>
            </div>
          </div>
        </section>
        
        {/* Growth-Ready Recipes */}
        <section className={`py-16 ${selectedBusinessType !== 'all' && selectedBusinessType !== 'growth' ? 'hidden' : ''}`}>
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-8 text-center">Scalable IT for Growing SMEs</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <RecipeCard 
                title="Startup IT Recipe"
                description="Flexible IT solutions for early-stage startups with rapid growth needs."
                icon={<BasicIcon />}
                specs={[
                  "Scalable Help Desk Support",
                  "Cloud-First Architecture",
                  "Agile Security Framework",
                  "Pay-As-You-Grow Model"
                ]}
                proTips={[
                  "Perfect for newly funded startups",
                  "Designed to scale with minimal disruption"
                ]}
                link="/services/growth-ready"
              />
              
              <RecipeCard 
                title="Scale IT Recipe"
                description="IT infrastructure designed to handle rapid user and data growth."
                icon={<ScaleIcon />}
                specs={[
                  "24/7 International Support",
                  "DevOps Integration",
                  "Multi-Region Cloud Setup",
                  "Automated Scaling Tools"
                ]}
                proTips={[
                  "Ideal for businesses in rapid expansion phase",
                  "Includes monthly scaling assessments"
                ]}
                link="/services/growth-ready"
              />
              
              <RecipeCard 
                title="Hypergrowth IT Recipe"
                description="Enterprise solutions for businesses experiencing exponential growth."
                icon={<AdvancedIcon />}
                specs={[
                  "Dedicated Support Team",
                  "Custom API Integrations",
                  "Enterprise Architecture",
                  "Advanced Analytics Platform"
                ]}
                proTips={[
                  "Designed for post-Series B startups",
                  "Prepares infrastructure for 10x growth"
                ]}
                link="/services/growth-ready"
              />
            </div>
            <div className="mt-8 text-center">
              <Button asChild className="outline-button">
                <Link to="/services/growth-ready">See Details <ArrowRight size={16} /></Link>
              </Button>
            </div>
          </div>
        </section>
        
        {/* Interactive Tool */}
        <section className="py-16 bg-circleTel-lightNeutral">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-8 text-center">Build Your Own IT Recipe</h2>
              
              <div className="bg-white p-8 rounded-lg shadow-md">
                <p className="text-circleTel-secondaryNeutral mb-6 text-center">
                  Select the ingredients you need in your custom IT solution:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  <div 
                    className={`p-4 rounded-lg cursor-pointer border ${selectedRecipe.cybersecurity ? 'bg-circleTel-lightNeutral border-circleTel-orange' : 'bg-white border-gray-200'}`}
                    onClick={() => handleRecipeSelection('cybersecurity')}
                  >
                    <div className="flex items-center">
                      <div className={`mr-4 rounded-full p-2 ${selectedRecipe.cybersecurity ? 'text-circleTel-orange' : 'text-circleTel-secondaryNeutral'}`}>
                        <SecurityIcon />
                      </div>
                      <div>
                        <h3 className="font-bold text-circleTel-darkNeutral">Cybersecurity</h3>
                        <p className="text-sm text-circleTel-secondaryNeutral">Advanced protection for your business</p>
                      </div>
                      <div className="ml-auto">
                        <CheckCircle 
                          size={24} 
                          className={`${selectedRecipe.cybersecurity ? 'text-circleTel-orange' : 'text-gray-200'}`} 
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div 
                    className={`p-4 rounded-lg cursor-pointer border ${selectedRecipe.cloudServices ? 'bg-circleTel-lightNeutral border-circleTel-orange' : 'bg-white border-gray-200'}`}
                    onClick={() => handleRecipeSelection('cloudServices')}
                  >
                    <div className="flex items-center">
                      <div className={`mr-4 rounded-full p-2 ${selectedRecipe.cloudServices ? 'text-circleTel-orange' : 'text-circleTel-secondaryNeutral'}`}>
                        <CloudIcon />
                      </div>
                      <div>
                        <h3 className="font-bold text-circleTel-darkNeutral">Cloud Services</h3>
                        <p className="text-sm text-circleTel-secondaryNeutral">Flexible and scalable cloud solutions</p>
                      </div>
                      <div className="ml-auto">
                        <CheckCircle 
                          size={24} 
                          className={`${selectedRecipe.cloudServices ? 'text-circleTel-orange' : 'text-gray-200'}`} 
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div 
                    className={`p-4 rounded-lg cursor-pointer border ${selectedRecipe.helpdesk ? 'bg-circleTel-lightNeutral border-circleTel-orange' : 'bg-white border-gray-200'}`}
                    onClick={() => handleRecipeSelection('helpdesk')}
                  >
                    <div className="flex items-center">
                      <div className={`mr-4 rounded-full p-2 ${selectedRecipe.helpdesk ? 'text-circleTel-orange' : 'text-circleTel-secondaryNeutral'}`}>
                        <SupportIcon />
                      </div>
                      <div>
                        <h3 className="font-bold text-circleTel-darkNeutral">Help Desk</h3>
                        <p className="text-sm text-circleTel-secondaryNeutral">24/7 technical support for your team</p>
                      </div>
                      <div className="ml-auto">
                        <CheckCircle 
                          size={24} 
                          className={`${selectedRecipe.helpdesk ? 'text-circleTel-orange' : 'text-gray-200'}`} 
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div 
                    className={`p-4 rounded-lg cursor-pointer border ${selectedRecipe.dataBackup ? 'bg-circleTel-lightNeutral border-circleTel-orange' : 'bg-white border-gray-200'}`}
                    onClick={() => handleRecipeSelection('dataBackup')}
                  >
                    <div className="flex items-center">
                      <div className={`mr-4 rounded-full p-2 ${selectedRecipe.dataBackup ? 'text-circleTel-orange' : 'text-circleTel-secondaryNeutral'}`}>
                        <BasicIcon />
                      </div>
                      <div>
                        <h3 className="font-bold text-circleTel-darkNeutral">Data Backup</h3>
                        <p className="text-sm text-circleTel-secondaryNeutral">Secure backup and disaster recovery</p>
                      </div>
                      <div className="ml-auto">
                        <CheckCircle 
                          size={24} 
                          className={`${selectedRecipe.dataBackup ? 'text-circleTel-orange' : 'text-gray-200'}`} 
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div 
                    className={`p-4 rounded-lg cursor-pointer border ${selectedRecipe.networkManagement ? 'bg-circleTel-lightNeutral border-circleTel-orange' : 'bg-white border-gray-200'}`}
                    onClick={() => handleRecipeSelection('networkManagement')}
                  >
                    <div className="flex items-center">
                      <div className={`mr-4 rounded-full p-2 ${selectedRecipe.networkManagement ? 'text-circleTel-orange' : 'text-circleTel-secondaryNeutral'}`}>
                        <AdvancedIcon />
                      </div>
                      <div>
                        <h3 className="font-bold text-circleTel-darkNeutral">Network Management</h3>
                        <p className="text-sm text-circleTel-secondaryNeutral">Proactive network monitoring and maintenance</p>
                      </div>
                      <div className="ml-auto">
                        <CheckCircle 
                          size={24} 
                          className={`${selectedRecipe.networkManagement ? 'text-circleTel-orange' : 'text-gray-200'}`} 
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-circleTel-lightNeutral p-6 rounded-lg mb-8">
                  <h3 className="font-bold text-circleTel-darkNeutral mb-2">Your Recipe Summary</h3>
                  <ul className="space-y-2 mb-4 font-space-mono text-sm text-circleTel-secondaryNeutral">
                    {Object.entries(selectedRecipe).map(([key, value]) => value && (
                      <li key={key} className="flex items-center">
                        <CheckCircle size={16} className="text-circleTel-orange mr-2" />
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </li>
                    ))}
                    {Object.values(selectedRecipe).every(v => !v) && (
                      <li>Select at least one ingredient to create your custom recipe</li>
                    )}
                  </ul>
                </div>
                
                <div className="text-center">
                  <Button className="primary-button">
                    Get Your Custom Recipe
                  </Button>
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

export default Services;
