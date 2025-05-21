
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MessageSquarePlus } from 'lucide-react';

const BusinessCTA = () => {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-4">Ready to simplify your IT?</h2>
          <p className="text-lg text-circleTel-secondaryNeutral mb-8">
            Get started with a free IT assessment and recipe recommendation tailored to your small business needs.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild className="primary-button flex items-center gap-2">
              <Link to="/contact">
                <MessageSquarePlus size={18} />
                Contact Us Now
              </Link>
            </Button>
            <Button asChild className="outline-button">
              <Link to="/resources/it-health">Get Free IT Assessment</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BusinessCTA;
