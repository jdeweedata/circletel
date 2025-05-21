
import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Server, Database, Shield } from 'lucide-react';
import RecipeCard from '@/components/ui/RecipeCard';
import RecipeDetail from '@/components/small-business/RecipeDetail';
import BusinessFAQ from '@/components/small-business/BusinessFAQ';
import BusinessCTA from '@/components/small-business/BusinessCTA';

const MidSizeBusinessServices = () => {
  const CoreITIcon = () => <Server size={24} />;
  const AdvancedITIcon = () => <Database size={24} />;
  const EnterpriseITIcon = () => <Shield size={24} />;

  const coreRecipe = {
    id: "core-recipe",
    title: "Core IT Recipe",
    description: "Our foundational solution for mid-size businesses with 25-50 employees that need reliable and scalable IT support.",
    ingredients: [
      {
        title: "Help Desk Support (12/5)",
        description: "Extended hours technical support Monday to Friday, 7am to 7pm"
      },
      {
        title: "Enhanced Security Suite",
        description: "Next-gen antivirus, advanced email protection, endpoint security, and basic SIEM"
      },
      {
        title: "Hybrid Cloud Management",
        description: "Management of both on-premises and cloud infrastructure"
      },
      {
        title: "Quarterly IT Strategy Sessions",
        description: "Regular planning meetings to align IT with business objectives"
      }
    ],
    proTips: [
      "Consider adding weekend support for critical operations",
      "Review user access controls quarterly as team grows"
    ],
    price: "R9,500/mo",
    testimonial: {
      quote: "CircleTel's Core IT Recipe has been the perfect solution as we've grown from 20 to 45 employees. They scaled with us without missing a beat.",
      author: "James Mokoena",
      company: "Precision Engineering Solutions",
      initials: "JM"
    }
  };

  const advancedRecipe = {
    id: "advanced-recipe",
    title: "Advanced IT Recipe",
    description: "A comprehensive IT solution for established mid-size businesses with 50-75 employees and complex IT needs.",
    ingredients: [
      {
        title: "Help Desk Support (16/6)",
        description: "Extended hours technical support Monday to Saturday, 6am to 10pm"
      },
      {
        title: "Advanced Security Operations",
        description: "Full SIEM implementation, threat hunting, vulnerability management"
      },
      {
        title: "IT Project Management",
        description: "Dedicated project manager for IT initiatives"
      },
      {
        title: "Business Continuity Planning",
        description: "Comprehensive backup, disaster recovery and business continuity solutions"
      }
    ],
    proTips: [
      "Consider adding a part-time CISO service for strategic security guidance",
      "Implement monthly security awareness training for all departments"
    ],
    price: "R15,500/mo",
    testimonial: {
      quote: "We needed IT that could support our multi-location operation. CircleTel's Advanced IT Recipe provides enterprise-grade support without the enterprise price tag.",
      author: "Sophia van der Merwe",
      company: "Cape Coastal Properties",
      initials: "SM"
    },
    background: "bg-circleTel-lightNeutral"
  };

  const enterpriseRecipe = {
    id: "enterprise-recipe",
    title: "Enterprise IT Recipe",
    description: "A premium IT solution for larger mid-size businesses with 75-100+ employees requiring sophisticated IT operations.",
    ingredients: [
      {
        title: "Help Desk Support (24/7)",
        description: "Round-the-clock technical support, 365 days a year"
      },
      {
        title: "Security Operations Center",
        description: "Continuous security monitoring, incident response, and compliance management"
      },
      {
        title: "Virtual CIO Services",
        description: "Strategic technology leadership and IT governance"
      },
      {
        title: "Custom Development Services",
        description: "Tailored applications and integrations for your specific business needs"
      }
    ],
    proTips: [
      "Schedule quarterly executive briefings on IT performance and security",
      "Consider developing a 3-year technology roadmap with our virtual CIO"
    ],
    price: "R22,500/mo",
    testimonial: {
      quote: "CircleTel's Enterprise IT Recipe gives us everything we need as we approach 100 employees. Their virtual CIO service has been instrumental in our growth strategy.",
      author: "Thabiso Molefe",
      company: "Integrated Supply Solutions",
      initials: "TM"
    }
  };

  const faqs = [
    {
      question: "How does your mid-size IT support differ from small business support?",
      answer: "Our mid-size business solutions include more advanced security monitoring, dedicated project management resources, strategic IT planning, and extended support hours to match the more complex needs of growing organizations."
    },
    {
      question: "Can you support our multiple office locations?",
      answer: "Absolutely. Our mid-size business recipes are designed for organizations with multiple locations. We provide centralized management with local support coverage across South Africa."
    },
    {
      question: "Do you offer industry-specific compliance support?",
      answer: "Yes, we have specialists in various regulatory frameworks including POPIA, GDPR, PCI DSS, and industry-specific regulations. Our Enterprise IT Recipe includes comprehensive compliance management."
    },
    {
      question: "What if we already have some internal IT staff?",
      answer: "We excel at co-managed IT arrangements, working alongside your internal team to provide specialized expertise, after-hours coverage, or handling specific aspects of your IT operations while your team focuses on strategic initiatives."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main>
        <section className="py-16 md:py-24 bg-gradient-to-b from-white to-circleTel-lightNeutral">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-circleTel-darkNeutral mb-4">Mid-Size Business IT Solutions</h1>
              <p className="text-xl text-circleTel-secondaryNeutral max-w-3xl mx-auto">
                Scalable IT support and strategic technology management for growing organizations with 25-100+ employees.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              <RecipeCard 
                title="Core IT Recipe"
                description="Reliable IT support and security for mid-size businesses with 25-50 employees."
                icon={<CoreITIcon />}
                specs={[
                  "Help Desk Support (12/5)",
                  "Enhanced Security Suite",
                  "Hybrid Cloud Management",
                  "Quarterly IT Strategy"
                ]}
                proTips={[
                  "Perfect for businesses with 25-50 employees",
                  "Ideal for single-location operations"
                ]}
                link="#core-recipe"
                className="animate-fade-in"
              />
              
              <RecipeCard 
                title="Advanced IT Recipe"
                description="Comprehensive IT management for established mid-size businesses with multiple locations."
                icon={<AdvancedITIcon />}
                specs={[
                  "Help Desk Support (16/6)",
                  "Advanced Security Operations",
                  "IT Project Management",
                  "Business Continuity Planning"
                ]}
                proTips={[
                  "Ideal for businesses with 50-75 employees",
                  "Perfect for multi-location operations"
                ]}
                link="#advanced-recipe"
                className="animate-fade-in delay-100"
              />
              
              <RecipeCard 
                title="Enterprise IT Recipe"
                description="Sophisticated IT operations and strategy for larger mid-size organizations."
                icon={<EnterpriseITIcon />}
                specs={[
                  "Help Desk Support (24/7)",
                  "Security Operations Center",
                  "Virtual CIO Services",
                  "Custom Development"
                ]}
                proTips={[
                  "Designed for businesses with 75-100+ employees",
                  "For organizations with complex IT requirements"
                ]}
                link="#enterprise-recipe"
                className="animate-fade-in delay-200"
              />
            </div>
          </div>
        </section>
        
        <RecipeDetail {...coreRecipe} />
        <RecipeDetail {...advancedRecipe} />
        <RecipeDetail {...enterpriseRecipe} />
        <BusinessFAQ faqs={faqs} />
        <BusinessCTA />
      </main>
      
      <Footer />
    </div>
  );
};

export default MidSizeBusinessServices;
