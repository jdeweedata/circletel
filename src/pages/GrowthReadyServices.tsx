
import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Rocket, TrendingUp, Laptop } from 'lucide-react';
import RecipeCard from '@/components/ui/RecipeCard';
import RecipeDetail from '@/components/small-business/RecipeDetail';
import BusinessFAQ from '@/components/small-business/BusinessFAQ';
import BusinessCTA from '@/components/small-business/BusinessCTA';

const GrowthReadyServices = () => {
  const StartupIcon = () => <Laptop size={24} />;
  const ScaleIcon = () => <TrendingUp size={24} />;
  const HypergrowthIcon = () => <Rocket size={24} />;

  const startupRecipe = {
    id: "startup-recipe",
    title: "Startup IT Recipe",
    description: "A flexible IT foundation for early-stage businesses experiencing or planning for rapid growth.",
    ingredients: [
      {
        title: "Help Desk Support (10/5)",
        description: "Responsive support from 7am to 5pm, Monday to Friday"
      },
      {
        title: "Cloud-First Infrastructure",
        description: "Scalable cloud solutions that grow with your business"
      },
      {
        title: "Startup Security Pack",
        description: "Essential security tools to protect your growing business"
      },
      {
        title: "Quarterly Growth Planning",
        description: "Regular IT strategy sessions focused on supporting business growth"
      }
    ],
    proTips: [
      "Start with a lean setup that can scale quickly",
      "Implement automated provisioning for quick onboarding of new staff"
    ],
    price: "R5,500/mo",
    testimonial: {
      quote: "CircleTel set up our tech stack to scale from day one. When we doubled our team size in three months, our IT infrastructure handled it seamlessly.",
      author: "Lerato Dlamini",
      company: "FinTech Innovations",
      initials: "LD"
    }
  };

  const scaleRecipe = {
    id: "scale-recipe",
    title: "Scale IT Recipe",
    description: "A robust IT solution for businesses in active scaling phases, designed to support rapid growth without disruption.",
    ingredients: [
      {
        title: "Help Desk Support (12/6)",
        description: "Extended support hours covering peak business times"
      },
      {
        title: "Rapid Deployment Framework",
        description: "Systems for quickly setting up new offices or remote teams"
      },
      {
        title: "DevOps Support",
        description: "IT operations support for development teams"
      },
      {
        title: "Adaptive Security Model",
        description: "Security systems that expand protection as your business grows"
      }
    ],
    proTips: [
      "Implement automated user provisioning workflows",
      "Consider adopting infrastructure-as-code for consistency across locations"
    ],
    price: "R12,500/mo",
    testimonial: {
      quote: "As we expanded from one office to four in just a year, CircleTel's Scale IT Recipe kept our technology running smoothly. Their rapid deployment framework was a game-changer.",
      author: "David Naidoo",
      company: "Expansion Logistics",
      initials: "DN"
    },
    background: "bg-circleTel-lightNeutral"
  };

  const hypergrowthRecipe = {
    id: "hypergrowth-recipe",
    title: "Hypergrowth IT Recipe",
    description: "An enterprise-grade IT solution for businesses experiencing extraordinary growth rates and complexity.",
    ingredients: [
      {
        title: "Help Desk Support (24/7)",
        description: "Around-the-clock support for global operations"
      },
      {
        title: "Technology Acceleration Team",
        description: "Dedicated IT specialists focused on supporting growth initiatives"
      },
      {
        title: "Global Infrastructure Management",
        description: "Support for international expansion and compliance"
      },
      {
        title: "Scalable Enterprise Architecture",
        description: "Future-proofed technology foundation that eliminates growing pains"
      }
    ],
    proTips: [
      "Implement weekly IT operations reviews during peak growth periods",
      "Consider creating a dedicated digital transformation team"
    ],
    price: "R25,500/mo",
    testimonial: {
      quote: "During our Series B funding and subsequent hypergrowth phase, CircleTel's team became an extension of our business. Their Hypergrowth IT Recipe handled our expansion from 50 to 200 staff across three countries.",
      author: "Mandla Sibeko",
      company: "AfriMarket Solutions",
      initials: "MS"
    }
  };

  const faqs = [
    {
      question: "How quickly can you scale our IT as we hire new employees?",
      answer: "With our automated provisioning systems, we can typically set up new employees with all necessary hardware, software, and security access within 24 hours of receiving the request."
    },
    {
      question: "Can you support our international expansion?",
      answer: "Yes, our Hypergrowth IT Recipe includes global infrastructure management with expertise in regional compliance requirements, international connectivity solutions, and 24/7 support across time zones."
    },
    {
      question: "What if our growth is unpredictable or happens in spurts?",
      answer: "Our recipes are designed with flexibility in mind. We can quickly scale resources up or down based on your needs, and our billing model can accommodate growth spurts without long-term commitments for temporary scaling."
    },
    {
      question: "Do you help with technology due diligence for acquisitions?",
      answer: "Yes, for clients on our Scale and Hypergrowth recipes, we offer technology due diligence services for mergers and acquisitions, including IT infrastructure assessment and integration planning."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main>
        <section className="py-16 md:py-24 bg-gradient-to-b from-white to-circleTel-lightNeutral">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-circleTel-darkNeutral mb-4">Growth-Ready IT Solutions</h1>
              <p className="text-xl text-circleTel-secondaryNeutral max-w-3xl mx-auto">
                Flexible and scalable technology solutions designed for businesses experiencing rapid growth and expansion.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              <RecipeCard 
                title="Startup IT Recipe"
                description="Flexible IT foundation for early-stage businesses with growth ambitions."
                icon={<StartupIcon />}
                specs={[
                  "Help Desk Support (10/5)",
                  "Cloud-First Infrastructure",
                  "Startup Security Pack",
                  "Quarterly Growth Planning"
                ]}
                proTips={[
                  "Perfect for newly funded startups",
                  "Ideal for teams of 5-20 employees planning to grow"
                ]}
                link="#startup-recipe"
                className="animate-fade-in"
              />
              
              <RecipeCard 
                title="Scale IT Recipe"
                description="Robust IT solution for businesses in active scaling phases."
                icon={<ScaleIcon />}
                specs={[
                  "Help Desk Support (12/6)",
                  "Rapid Deployment Framework",
                  "DevOps Support",
                  "Adaptive Security Model"
                ]}
                proTips={[
                  "Ideal for businesses adding multiple team members monthly",
                  "Perfect for expanding to new locations"
                ]}
                link="#scale-recipe"
                className="animate-fade-in delay-100"
              />
              
              <RecipeCard 
                title="Hypergrowth IT Recipe"
                description="Enterprise-grade IT for businesses experiencing extraordinary growth."
                icon={<HypergrowthIcon />}
                specs={[
                  "Help Desk Support (24/7)",
                  "Technology Acceleration Team",
                  "Global Infrastructure Management",
                  "Scalable Enterprise Architecture"
                ]}
                proTips={[
                  "Designed for rapid scaling of 100%+ annually",
                  "For organizations expanding internationally"
                ]}
                link="#hypergrowth-recipe"
                className="animate-fade-in delay-200"
              />
            </div>
          </div>
        </section>
        
        <RecipeDetail {...startupRecipe} />
        <RecipeDetail {...scaleRecipe} />
        <RecipeDetail {...hypergrowthRecipe} />
        <BusinessFAQ faqs={faqs} />
        <BusinessCTA />
      </main>
      
      <Footer />
    </div>
  );
};

export default GrowthReadyServices;
