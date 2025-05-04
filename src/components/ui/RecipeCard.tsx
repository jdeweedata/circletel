
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecipeCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  specs?: string[];
  proTips?: string[];
  link: string;
  className?: string;
}

const RecipeCard = ({
  title,
  description,
  icon,
  specs,
  proTips,
  link,
  className
}: RecipeCardProps) => {
  return (
    <div className={cn("recipe-card group", className)}>
      <div className="flex items-start">
        {icon && (
          <div className="mr-4 bg-circleTel-lightNeutral rounded-full p-3 text-circleTel-orange group-hover:bg-circleTel-orange group-hover:text-white transition-colors duration-300">
            {icon}
          </div>
        )}
        <div>
          <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-2">{title}</h3>
          <p className="text-circleTel-secondaryNeutral mb-4">{description}</p>
          
          {specs && specs.length > 0 && (
            <div className="mb-4">
              <h4 className="font-bold text-sm uppercase text-circleTel-darkNeutral mb-2">Ingredients</h4>
              <ul className="text-circleTel-secondaryNeutral font-space-mono text-sm space-y-1">
                {specs.map((spec, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    {spec}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {proTips && proTips.length > 0 && (
            <div className="mb-4 bg-circleTel-lightNeutral p-3 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <h4 className="font-bold text-sm uppercase text-circleTel-darkNeutral mb-1">Pro Tips</h4>
              <ul className="text-circleTel-secondaryNeutral font-space-mono text-sm space-y-1">
                {proTips.map((tip, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">👉</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <Link 
            to={link}
            className="inline-flex items-center mt-2 text-circleTel-orange font-bold hover:underline"
          >
            Learn more <ArrowRight size={16} className="ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RecipeCard;
