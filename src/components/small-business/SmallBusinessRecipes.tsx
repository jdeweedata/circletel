
import React from 'react';
import { BasicIcon, CloudIcon, SecurityIcon } from './SmallBusinessIcons';
import RecipeCard from '@/components/ui/RecipeCard';

const SmallBusinessRecipes = () => {
  return (
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
  );
};

export default SmallBusinessRecipes;
