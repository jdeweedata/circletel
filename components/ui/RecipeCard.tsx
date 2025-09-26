'use client';

import React from 'react';
import Link from 'next/link';
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
    <div className={cn("recipe-card group rounded-lg p-6", className)}>
      <div className="flex flex-col h-full">
        <div className="flex items-center mb-4">
          {icon && (
            <div className="mr-4 bg-circleTel-lightNeutral rounded-full p-3 text-circleTel-orange group-hover:bg-circleTel-orange group-hover:text-white transition-colors duration-300">
              {icon}
            </div>
          )}
          <h3 className="text-xl font-bold text-circleTel-darkNeutral">{title}</h3>
        </div>

        <p className="text-circleTel-secondaryNeutral mb-4">{description}</p>

        {specs && specs.length > 0 && (
          <div className="mb-4 flex-grow">
            <h4 className="font-bold text-sm uppercase text-circleTel-darkNeutral mb-2">Ingredients</h4>
            <ul className="text-circleTel-secondaryNeutral font-space-mono text-sm space-y-2">
              {specs.map((spec, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2 text-circleTel-orange">•</span>
                  {spec}
                </li>
              ))}
            </ul>
          </div>
        )}

        {proTips && proTips.length > 0 && (
          <div className="mb-4 bg-circleTel-lightNeutral p-4 rounded-md opacity-80 group-hover:opacity-100 transition-all duration-300">
            <h4 className="font-bold text-sm uppercase text-circleTel-darkNeutral mb-2">Pro Tips</h4>
            <ul className="text-circleTel-secondaryNeutral font-space-mono text-sm space-y-2">
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
          href={link}
          className="inline-flex items-center mt-auto text-circleTel-orange font-bold hover:underline"
        >
          Learn more <ArrowRight size={16} className="ml-1" />
        </Link>
      </div>
    </div>
  );
};

export default RecipeCard;