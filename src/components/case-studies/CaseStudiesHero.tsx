
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const CaseStudiesHero = () => {
  return (
    <section className="bg-gradient-to-b from-circleTel-lightNeutral to-white py-20">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-circleTel-darkNeutral mb-4">
          Real Businesses, Real IT Recipes
        </h1>
        <p className="text-xl text-circleTel-secondaryNeutral max-w-2xl mx-auto mb-8">
          See how we've helped businesses like yours thrive with our tailored IT solutions.
        </p>
        <Button asChild className="primary-button">
          <Link to="/resources/it-health">Get Your Free Assessment</Link>
        </Button>
      </div>
    </section>
  );
};

export default CaseStudiesHero;
