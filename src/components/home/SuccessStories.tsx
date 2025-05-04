
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StoryCardProps {
  industry: string;
  title: string;
  challenge: string;
  solution: string;
  result: string;
  link: string;
}

const StoryCard = ({ industry, title, challenge, solution, result, link }: StoryCardProps) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg">
      {/* Top Accent Bar */}
      <div className="h-2 bg-circleTel-orange"></div>
      
      <div className="p-6">
        <div className="inline-block bg-circleTel-lightNeutral text-circleTel-darkNeutral text-xs font-space-mono px-2 py-1 rounded mb-3">
          {industry}
        </div>
        
        <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-3">{title}</h3>
        
        <div className="space-y-4 mb-4">
          <div>
            <p className="text-sm font-bold text-circleTel-darkNeutral">Challenge:</p>
            <p className="text-circleTel-secondaryNeutral text-sm">{challenge}</p>
          </div>
          
          <div>
            <p className="text-sm font-bold text-circleTel-darkNeutral">Solution:</p>
            <p className="text-circleTel-secondaryNeutral text-sm">{solution}</p>
          </div>
          
          <div>
            <p className="text-sm font-bold text-circleTel-darkNeutral">Result:</p>
            <p className="text-circleTel-secondaryNeutral text-sm">{result}</p>
          </div>
        </div>
        
        <Link 
          to={link}
          className="inline-flex items-center mt-2 text-circleTel-orange font-bold hover:underline"
        >
          Read Full Story <ArrowRight size={16} className="ml-1" />
        </Link>
      </div>
    </div>
  );
};

const SuccessStories = () => {
  const stories = [
    {
      industry: "RETAIL",
      title: "Urban Boutique Secures Operations",
      challenge: "Frequent system crashes and security concerns were causing downtime for this growing retail chain.",
      solution: "Implemented the Basic IT Recipe with enhanced security modules and cloud-based POS system.",
      result: "99.9% uptime achieved with zero security incidents in the first year.",
      link: "/case-studies/urban-boutique"
    },
    {
      industry: "HEALTHCARE",
      title: "MediClinic's Cloud Transformation",
      challenge: "Legacy systems couldn't handle growing patient data and compliance requirements.",
      solution: "Deployed Advanced IT Recipe with HIPAA-compliant cloud storage and automated backups.",
      result: "Reduced IT costs by 40% while improving data access times by 65%.",
      link: "/case-studies/mediclinic"
    },
    {
      industry: "STARTUP",
      title: "TechNova's Scalable Foundation",
      challenge: "Rapidly growing tech startup needed infrastructure that could scale quickly and securely.",
      solution: "Implemented Scale IT Recipe with DevOps integration and automated deployment pipelines.",
      result: "Supported 300% team growth with zero additional IT hires in first 18 months.",
      link: "/case-studies/technova"
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-4">Businesses Thriving with Our Recipes</h2>
          <p className="text-circleTel-secondaryNeutral max-w-2xl mx-auto">
            See how our IT recipes have transformed businesses across different industries.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stories.map((story, index) => (
            <StoryCard
              key={index}
              industry={story.industry}
              title={story.title}
              challenge={story.challenge}
              solution={story.solution}
              result={story.result}
              link={story.link}
            />
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <Button asChild variant="outline" className="outline-button">
            <Link to="/case-studies">See More Success Stories</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default SuccessStories;
