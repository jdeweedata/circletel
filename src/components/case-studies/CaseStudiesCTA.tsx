
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const CaseStudiesCTA = () => {
  return (
    <section className="bg-circleTel-lightNeutral py-16">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-4">
          Ready for Your Success Story?
        </h2>
        <p className="text-xl text-circleTel-secondaryNeutral max-w-2xl mx-auto mb-8">
          Let us help your business thrive with our tailored IT solutions. 
          Get started with a free IT assessment today.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild className="primary-button">
            <Link to="/resources/it-health">Get a Free IT Assessment</Link>
          </Button>
          <Button asChild className="outline-button">
            <Link to="/contact">Contact Our Team</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CaseStudiesCTA;
