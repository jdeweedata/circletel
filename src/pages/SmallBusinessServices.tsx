
import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import SmallBusinessHero from '@/components/small-business/SmallBusinessHero';
import SmallBusinessRecipes from '@/components/small-business/SmallBusinessRecipes';
import RecipeDetail from '@/components/small-business/RecipeDetail';
import BusinessFAQ from '@/components/small-business/BusinessFAQ';
import BusinessCTA from '@/components/small-business/BusinessCTA';

const SmallBusinessServices = () => {
  const basicRecipe = {
    id: "basic-recipe",
    title: "Basic IT Recipe",
    description: "Our foundational IT service package designed for small businesses that need reliable support without the complexity.",
    ingredients: [
      {
        title: "Help Desk Support (8/5)",
        description: "Technical support available Monday to Friday, 8am to 5pm"
      },
      {
        title: "Basic Security Suite",
        description: "Anti-virus, firewall, and basic email security"
      },
      {
        title: "Cloud Email Setup",
        description: "Microsoft 365 or Google Workspace configuration and management"
      },
      {
        title: "Data Backup Solutions",
        description: "Weekly automated backups of critical business data"
      }
    ],
    proTips: [
      "Add monthly maintenance for optimal system performance",
      "Consider basic security awareness training for employees"
    ],
    price: "R3,500/mo",
    testimonial: {
      quote: "CircleTel's Basic IT Recipe gave us the perfect amount of support without breaking our budget. Their team is responsive and always explains things in plain language.",
      author: "Sarah Baloyi",
      company: "Green Leaf Accounting",
      initials: "SB"
    }
  };

  const growthRecipe = {
    id: "growth-recipe",
    title: "Growth IT Recipe",
    description: "A comprehensive IT solution for small businesses planning to scale over the next 1-2 years.",
    ingredients: [
      {
        title: "Help Desk Support (10/5)",
        description: "Extended hours technical support Monday to Friday, 7am to 5pm"
      },
      {
        title: "Advanced Security Suite",
        description: "Next-gen antivirus, advanced email protection, and endpoint security"
      },
      {
        title: "Cloud Migration Services",
        description: "Migration of on-premises systems to cloud platforms"
      },
      {
        title: "Disaster Recovery Planning",
        description: "Development and implementation of business continuity plans"
      }
    ],
    proTips: [
      "Add quarterly IT strategy sessions to align with business growth",
      "Consider implementing multi-factor authentication across all systems"
    ],
    price: "R6,500/mo",
    testimonial: {
      quote: "CircleTel helped us grow from 8 to 22 employees without any IT headaches. Their Growth IT Recipe scaled perfectly with our business needs.",
      author: "Michael Tshabalala",
      company: "InnovateZA Design Studio",
      initials: "MT"
    },
    background: "bg-circleTel-lightNeutral"
  };

  const secureRecipe = {
    id: "secure-recipe",
    title: "Secure IT Recipe",
    description: "A specialized security-focused IT solution for small businesses that handle sensitive data or face strict compliance requirements.",
    ingredients: [
      {
        title: "Help Desk Support (8/5)",
        description: "Technical support available Monday to Friday, 8am to 5pm"
      },
      {
        title: "Premium Security Stack",
        description: "Enterprise-level security with SIEM, DLP, and advanced threat protection"
      },
      {
        title: "Compliance Management",
        description: "POPIA, GDPR, and industry-specific compliance implementation"
      },
      {
        title: "Regular Security Audits",
        description: "Quarterly vulnerability assessments and security reviews"
      }
    ],
    proTips: [
      "Add monthly security awareness training for all staff",
      "Consider penetration testing for critical systems"
    ],
    price: "R8,500/mo",
    testimonial: {
      quote: "As a financial services provider, security is non-negotiable. CircleTel's Secure IT Recipe ensures we meet all compliance requirements while keeping our client data protected.",
      author: "Thandi Moyo",
      company: "TrustWealth Financial Advisors",
      initials: "TM"
    }
  };

  const faqs = [
    {
      question: "How quickly can you respond to IT issues?",
      answer: "For small business clients, we guarantee a response within 1 hour during business hours, with most issues being resolved within 4 hours."
    },
    {
      question: "Can I customize my IT recipe?",
      answer: "Absolutely! Our recipes are starting points, but we can add or remove ingredients based on your specific business needs and budget."
    },
    {
      question: "Do I need to sign a long-term contract?",
      answer: "We offer flexible month-to-month options as well as annual contracts with preferential rates. There's no long-term lock-in if your needs change."
    },
    {
      question: "What if I outgrow my current IT recipe?",
      answer: "We conduct quarterly reviews with all clients and can easily upgrade your recipe as your business grows. Transitions are seamless and planned to avoid disruption."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main>
        <SmallBusinessHero />
        <SmallBusinessRecipes />
        <RecipeDetail {...basicRecipe} />
        <RecipeDetail {...growthRecipe} />
        <RecipeDetail {...secureRecipe} />
        <BusinessFAQ faqs={faqs} />
        <BusinessCTA />
      </main>
      
      <Footer />
    </div>
  );
};

export default SmallBusinessServices;
