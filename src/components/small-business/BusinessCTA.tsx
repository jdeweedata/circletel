
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MessageSquarePlus, Clock } from 'lucide-react';

const BusinessCTA = () => {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-4">Ready to simplify your IT journey?</h2>
          <p className="text-lg text-circleTel-secondaryNeutral mb-6">
            Let's take the tech burden off your shoulders so you can focus on what you do best — running your business.
          </p>
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center bg-circleTel-orange bg-opacity-10 rounded-full px-5 py-2">
              <Clock size={18} className="text-circleTel-orange mr-2" />
              <span className="text-circleTel-secondaryNeutral font-medium">Most clients hear back from us within 2 hours</span>
            </div>
          </div>
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
