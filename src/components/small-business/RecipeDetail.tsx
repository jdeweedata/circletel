
import React from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RecipeDetailProps {
  id: string;
  title: string;
  description: string;
  ingredients: Array<{
    title: string;
    description: string;
  }>;
  proTips: string[];
  price: string;
  testimonial: {
    quote: string;
    author: string;
    company: string;
    initials: string;
  };
  background?: string;
}

const RecipeDetail = ({ 
  id, 
  title, 
  description, 
  ingredients, 
  proTips, 
  price,
  testimonial,
  background = "bg-white"
}: RecipeDetailProps) => {
  return (
    <section id={id} className={`py-16 ${background}`}>
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-4">{title}</h2>
          <p className="text-lg text-circleTel-secondaryNeutral mb-8">
            {description}
          </p>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden border border-circleTel-orange mb-8">
            <div className="p-6">
              <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-4">Ingredients</h3>
              <ul className="space-y-3 mb-6">
                {ingredients.map((ingredient, index) => (
                  <li key={index} className="flex">
                    <Check className="text-circleTel-orange mr-2 mt-1 flex-shrink-0" size={18} />
                    <div>
                      <span className="font-bold">{ingredient.title}</span>
                      <p className="text-sm text-circleTel-secondaryNeutral">{ingredient.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
              
              <div className="bg-circleTel-lightNeutral p-4 rounded-lg mb-6">
                <h4 className="font-bold text-circleTel-darkNeutral mb-2">Pro Tips</h4>
                <ul className="space-y-2 font-space-mono text-sm">
                  {proTips.map((tip, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2">👉</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <span className="block font-space-mono text-sm text-circleTel-secondaryNeutral">Starting from</span>
                  <span className="text-2xl font-bold text-circleTel-darkNeutral">{price}</span>
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
              "{testimonial.quote}"
            </blockquote>
            <div className="flex items-center">
              <div className="h-10 w-10 bg-circleTel-orange rounded-full flex items-center justify-center text-white font-bold">{testimonial.initials}</div>
              <div className="ml-3">
                <p className="font-bold text-circleTel-darkNeutral">{testimonial.author}</p>
                <p className="text-sm text-circleTel-secondaryNeutral">{testimonial.company}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RecipeDetail;
