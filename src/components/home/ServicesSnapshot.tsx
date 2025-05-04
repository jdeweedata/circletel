
import React from 'react';
import { Link } from 'react-router-dom';
import RecipeCard from '@/components/ui/RecipeCard';
import { ArrowRight } from 'lucide-react';

// Mock icons for the recipe cards (using styled divs)
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

const ServicesSnapshot = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-4">Our IT Recipes for Your Business</h2>
          <p className="text-circleTel-secondaryNeutral max-w-2xl mx-auto">
            Simple, effective IT solutions designed to scale with your business needs. Each recipe is crafted to deliver optimal results.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <RecipeCard 
            title="Basic IT Recipe"
            description="Essential IT services for small businesses looking for reliable support and security."
            icon={<BasicIcon />}
            specs={[
              "Remote Helpdesk Support",
              "Basic Security Suite",
              "Data Backup Solution",
              "Email & Productivity Tools"
            ]}
            proTips={[
              "Start with weekly backups",
              "Consider adding phishing training"
            ]}
            link="/services/small-business"
          />
          
          <RecipeCard 
            title="Advanced IT Recipe"
            description="Comprehensive IT management for growing businesses with complex needs."
            icon={<AdvancedIcon />}
            specs={[
              "24/7 Managed Services",
              "Enhanced Security Stack",
              "Cloud Migration Support",
              "Business Continuity Planning"
            ]}
            proTips={[
              "Implement multi-factor authentication",
              "Schedule quarterly IT reviews"
            ]}
            link="/services/mid-size"
          />
          
          <RecipeCard 
            title="Scale IT Recipe"
            description="Enterprise-grade solutions designed for businesses ready to scale operations."
            icon={<ScaleIcon />}
            specs={[
              "IT Infrastructure Design",
              "Advanced Threat Protection",
              "Custom Software Integration",
              "IT Strategy Consulting"
            ]}
            proTips={[
              "Create a technology roadmap",
              "Plan for redundancy in critical systems"
            ]}
            link="/services/growth-ready"
          />
        </div>
        
        <div className="mt-12 text-center">
          <Link 
            to="/services"
            className="inline-flex items-center text-circleTel-orange font-bold hover:underline"
          >
            View All Recipes <ArrowRight size={16} className="ml-1" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ServicesSnapshot;
