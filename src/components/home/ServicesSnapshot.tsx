
import React from 'react';
import { Link } from 'react-router-dom';
import RecipeCard from '@/components/ui/RecipeCard';
import { ArrowRight, Server, Cloud, Laptop } from 'lucide-react';

const ServicesSnapshot = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-4">IT Solutions Tailored for South African Businesses</h2>
          <p className="text-circleTel-secondaryNeutral max-w-2xl mx-auto">
            Simple, effective IT solutions designed to scale with your business needs. Each recipe is crafted to deliver optimal results while keeping costs manageable.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <RecipeCard 
            title="Basic IT Recipe"
            description="Essential IT services for small businesses looking for reliable support and security without breaking the bank."
            icon={<Server className="text-circleTel-orange" />}
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
            description="Comprehensive IT management for growing businesses with complex needs and bigger ambitions."
            icon={<Laptop className="text-circleTel-orange" />}
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
            description="Enterprise-grade solutions designed for businesses ready to scale operations while maintaining cost efficiency."
            icon={<Cloud className="text-circleTel-orange" />}
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
            View All Solutions <ArrowRight size={16} className="ml-1" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ServicesSnapshot;
