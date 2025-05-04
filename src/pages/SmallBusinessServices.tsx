
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
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

const SmallBusinessServices = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main>
        {/* Hero Section */}
        <section className="bg-white py-16">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="md:w-1/2">
                <h1 className="text-4xl font-bold text-circleTel-darkNeutral mb-4">Simple IT Recipes for Small Businesses</h1>
                <p className="text-lg text-circleTel-secondaryNeutral mb-6">
                  Reliable, affordable IT solutions designed specifically for small businesses with 1-25 employees. No technical jargon, just simple recipes for success.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button asChild className="primary-button">
                    <Link to="/contact">Get a Quote</Link>
                  </Button>
                  <Button asChild className="outline-button">
                    <Link to="/resources/it-health">Free IT Assessment</Link>
                  </Button>
                </div>
              </div>
              <div className="md:w-1/2 bg-circleTel-lightNeutral p-6 rounded-lg">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="recipe-card p-4 bg-white rounded-lg shadow-sm border border-circleTel-orange flex items-center justify-center aspect-square">
                    <BasicIcon />
                  </div>
                  <div className="recipe-card p-4 bg-white rounded-lg shadow-sm border border-circleTel-orange flex items-center justify-center aspect-square">
                    <CloudIcon />
                  </div>
                  <div className="recipe-card p-4 bg-white rounded-lg shadow-sm border border-circleTel-orange flex items-center justify-center aspect-square">
                    <SecurityIcon />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Recipe Cards Section */}
        <section className="py-16 bg-circleTel-lightNeutral">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-8 text-center">Our Small Business IT Recipes</h2>
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
                link="#basic-recipe"
                className="animate-fade-in"
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
                link="#growth-recipe"
                className="animate-fade-in delay-100"
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
                link="#secure-recipe"
                className="animate-fade-in delay-200"
              />
            </div>
          </div>
        </section>
        
        {/* Detailed Recipe Sections */}
        <section id="basic-recipe" className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-4">Basic IT Recipe</h2>
              <p className="text-lg text-circleTel-secondaryNeutral mb-8">
                Our foundational IT service package designed for small businesses that need reliable support without the complexity.
              </p>
              
              <div className="bg-white rounded-lg shadow-md overflow-hidden border border-circleTel-orange mb-8">
                <div className="p-6">
                  <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-4">Ingredients</h3>
                  <ul className="space-y-3 mb-6">
                    <li className="flex">
                      <Check className="text-circleTel-orange mr-2 mt-1 flex-shrink-0" size={18} />
                      <div>
                        <span className="font-bold">Help Desk Support (8/5)</span>
                        <p className="text-sm text-circleTel-secondaryNeutral">Technical support available Monday to Friday, 8am to 5pm</p>
                      </div>
                    </li>
                    <li className="flex">
                      <Check className="text-circleTel-orange mr-2 mt-1 flex-shrink-0" size={18} />
                      <div>
                        <span className="font-bold">Basic Security Suite</span>
                        <p className="text-sm text-circleTel-secondaryNeutral">Anti-virus, firewall, and basic email security</p>
                      </div>
                    </li>
                    <li className="flex">
                      <Check className="text-circleTel-orange mr-2 mt-1 flex-shrink-0" size={18} />
                      <div>
                        <span className="font-bold">Cloud Email Setup</span>
                        <p className="text-sm text-circleTel-secondaryNeutral">Microsoft 365 or Google Workspace configuration and management</p>
                      </div>
                    </li>
                    <li className="flex">
                      <Check className="text-circleTel-orange mr-2 mt-1 flex-shrink-0" size={18} />
                      <div>
                        <span className="font-bold">Data Backup Solutions</span>
                        <p className="text-sm text-circleTel-secondaryNeutral">Weekly automated backups of critical business data</p>
                      </div>
                    </li>
                  </ul>
                  
                  <div className="bg-circleTel-lightNeutral p-4 rounded-lg mb-6">
                    <h4 className="font-bold text-circleTel-darkNeutral mb-2">Pro Tips</h4>
                    <ul className="space-y-2 font-space-mono text-sm">
                      <li className="flex items-start">
                        <span className="mr-2">👉</span>
                        Add monthly maintenance for optimal system performance
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">👉</span>
                        Consider basic security awareness training for employees
                      </li>
                    </ul>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="block font-space-mono text-sm text-circleTel-secondaryNeutral">Starting from</span>
                      <span className="text-2xl font-bold text-circleTel-darkNeutral">R3,500/mo</span>
                    </div>
                    <Button asChild className="primary-button">
                      <Link to="/contact">Request Quote</Link>
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-4">Success Story</h3>
                <blockquote className="border-l-4 border-circleTel-orange pl-4 italic text-circleTel-secondaryNeutral mb-4">
                  "CircleTel's Basic IT Recipe gave us the perfect amount of support without breaking our budget. Their team is responsive and always explains things in plain language."
                </blockquote>
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-circleTel-orange rounded-full flex items-center justify-center text-white font-bold">SB</div>
                  <div className="ml-3">
                    <p className="font-bold text-circleTel-darkNeutral">Sarah Baloyi</p>
                    <p className="text-sm text-circleTel-secondaryNeutral">Green Leaf Accounting</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="growth-recipe" className="py-16 bg-circleTel-lightNeutral">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-4">Growth IT Recipe</h2>
              <p className="text-lg text-circleTel-secondaryNeutral mb-8">
                A comprehensive IT solution for small businesses planning to scale over the next 1-2 years.
              </p>
              
              <div className="bg-white rounded-lg shadow-md overflow-hidden border border-circleTel-orange mb-8">
                <div className="p-6">
                  <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-4">Ingredients</h3>
                  <ul className="space-y-3 mb-6">
                    <li className="flex">
                      <Check className="text-circleTel-orange mr-2 mt-1 flex-shrink-0" size={18} />
                      <div>
                        <span className="font-bold">Help Desk Support (10/5)</span>
                        <p className="text-sm text-circleTel-secondaryNeutral">Extended hours technical support Monday to Friday, 7am to 5pm</p>
                      </div>
                    </li>
                    <li className="flex">
                      <Check className="text-circleTel-orange mr-2 mt-1 flex-shrink-0" size={18} />
                      <div>
                        <span className="font-bold">Advanced Security Suite</span>
                        <p className="text-sm text-circleTel-secondaryNeutral">Next-gen antivirus, advanced email protection, and endpoint security</p>
                      </div>
                    </li>
                    <li className="flex">
                      <Check className="text-circleTel-orange mr-2 mt-1 flex-shrink-0" size={18} />
                      <div>
                        <span className="font-bold">Cloud Migration Services</span>
                        <p className="text-sm text-circleTel-secondaryNeutral">Migration of on-premises systems to cloud platforms</p>
                      </div>
                    </li>
                    <li className="flex">
                      <Check className="text-circleTel-orange mr-2 mt-1 flex-shrink-0" size={18} />
                      <div>
                        <span className="font-bold">Disaster Recovery Planning</span>
                        <p className="text-sm text-circleTel-secondaryNeutral">Development and implementation of business continuity plans</p>
                      </div>
                    </li>
                  </ul>
                  
                  <div className="bg-circleTel-lightNeutral p-4 rounded-lg mb-6">
                    <h4 className="font-bold text-circleTel-darkNeutral mb-2">Pro Tips</h4>
                    <ul className="space-y-2 font-space-mono text-sm">
                      <li className="flex items-start">
                        <span className="mr-2">👉</span>
                        Add quarterly IT strategy sessions to align with business growth
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">👉</span>
                        Consider implementing multi-factor authentication across all systems
                      </li>
                    </ul>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="block font-space-mono text-sm text-circleTel-secondaryNeutral">Starting from</span>
                      <span className="text-2xl font-bold text-circleTel-darkNeutral">R6,500/mo</span>
                    </div>
                    <Button asChild className="primary-button">
                      <Link to="/contact">Request Quote</Link>
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-4">Success Story</h3>
                <blockquote className="border-l-4 border-circleTel-orange pl-4 italic text-circleTel-secondaryNeutral mb-4">
                  "CircleTel helped us grow from 8 to 22 employees without any IT headaches. Their Growth IT Recipe scaled perfectly with our business needs."
                </blockquote>
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-circleTel-orange rounded-full flex items-center justify-center text-white font-bold">MT</div>
                  <div className="ml-3">
                    <p className="font-bold text-circleTel-darkNeutral">Michael Tshabalala</p>
                    <p className="text-sm text-circleTel-secondaryNeutral">InnovateZA Design Studio</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="secure-recipe" className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-4">Secure IT Recipe</h2>
              <p className="text-lg text-circleTel-secondaryNeutral mb-8">
                A specialized security-focused IT solution for small businesses that handle sensitive data or face strict compliance requirements.
              </p>
              
              <div className="bg-white rounded-lg shadow-md overflow-hidden border border-circleTel-orange mb-8">
                <div className="p-6">
                  <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-4">Ingredients</h3>
                  <ul className="space-y-3 mb-6">
                    <li className="flex">
                      <Check className="text-circleTel-orange mr-2 mt-1 flex-shrink-0" size={18} />
                      <div>
                        <span className="font-bold">Help Desk Support (8/5)</span>
                        <p className="text-sm text-circleTel-secondaryNeutral">Technical support available Monday to Friday, 8am to 5pm</p>
                      </div>
                    </li>
                    <li className="flex">
                      <Check className="text-circleTel-orange mr-2 mt-1 flex-shrink-0" size={18} />
                      <div>
                        <span className="font-bold">Premium Security Stack</span>
                        <p className="text-sm text-circleTel-secondaryNeutral">Enterprise-level security with SIEM, DLP, and advanced threat protection</p>
                      </div>
                    </li>
                    <li className="flex">
                      <Check className="text-circleTel-orange mr-2 mt-1 flex-shrink-0" size={18} />
                      <div>
                        <span className="font-bold">Compliance Management</span>
                        <p className="text-sm text-circleTel-secondaryNeutral">POPIA, GDPR, and industry-specific compliance implementation</p>
                      </div>
                    </li>
                    <li className="flex">
                      <Check className="text-circleTel-orange mr-2 mt-1 flex-shrink-0" size={18} />
                      <div>
                        <span className="font-bold">Regular Security Audits</span>
                        <p className="text-sm text-circleTel-secondaryNeutral">Quarterly vulnerability assessments and security reviews</p>
                      </div>
                    </li>
                  </ul>
                  
                  <div className="bg-circleTel-lightNeutral p-4 rounded-lg mb-6">
                    <h4 className="font-bold text-circleTel-darkNeutral mb-2">Pro Tips</h4>
                    <ul className="space-y-2 font-space-mono text-sm">
                      <li className="flex items-start">
                        <span className="mr-2">👉</span>
                        Add monthly security awareness training for all staff
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">👉</span>
                        Consider penetration testing for critical systems
                      </li>
                    </ul>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="block font-space-mono text-sm text-circleTel-secondaryNeutral">Starting from</span>
                      <span className="text-2xl font-bold text-circleTel-darkNeutral">R8,500/mo</span>
                    </div>
                    <Button asChild className="primary-button">
                      <Link to="/contact">Request Quote</Link>
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-4">Success Story</h3>
                <blockquote className="border-l-4 border-circleTel-orange pl-4 italic text-circleTel-secondaryNeutral mb-4">
                  "As a financial services provider, security is non-negotiable. CircleTel's Secure IT Recipe ensures we meet all compliance requirements while keeping our client data protected."
                </blockquote>
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-circleTel-orange rounded-full flex items-center justify-center text-white font-bold">TM</div>
                  <div className="ml-3">
                    <p className="font-bold text-circleTel-darkNeutral">Thandi Moyo</p>
                    <p className="text-sm text-circleTel-secondaryNeutral">TrustWealth Financial Advisors</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* FAQ Section */}
        <section className="py-16 bg-circleTel-lightNeutral">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-8 text-center">Frequently Asked Questions</h2>
              
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="font-bold text-circleTel-darkNeutral mb-2">How quickly can you respond to IT issues?</h3>
                  <p className="text-circleTel-secondaryNeutral">For small business clients, we guarantee a response within 1 hour during business hours, with most issues being resolved within 4 hours.</p>
                </div>
                
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="font-bold text-circleTel-darkNeutral mb-2">Can I customize my IT recipe?</h3>
                  <p className="text-circleTel-secondaryNeutral">Absolutely! Our recipes are starting points, but we can add or remove ingredients based on your specific business needs and budget.</p>
                </div>
                
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="font-bold text-circleTel-darkNeutral mb-2">Do I need to sign a long-term contract?</h3>
                  <p className="text-circleTel-secondaryNeutral">We offer flexible month-to-month options as well as annual contracts with preferential rates. There's no long-term lock-in if your needs change.</p>
                </div>
                
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="font-bold text-circleTel-darkNeutral mb-2">What if I outgrow my current IT recipe?</h3>
                  <p className="text-circleTel-secondaryNeutral">We conduct quarterly reviews with all clients and can easily upgrade your recipe as your business grows. Transitions are seamless and planned to avoid disruption.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-4">Ready to simplify your IT?</h2>
              <p className="text-lg text-circleTel-secondaryNeutral mb-8">
                Get started with a free IT assessment and recipe recommendation tailored to your small business needs.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button asChild className="primary-button">
                  <Link to="/contact">Request a Quote</Link>
                </Button>
                <Button asChild className="outline-button">
                  <Link to="/resources/it-health">Get Free IT Assessment</Link>
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

export default SmallBusinessServices;
