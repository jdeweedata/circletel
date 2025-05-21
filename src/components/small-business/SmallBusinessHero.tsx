
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BasicIcon, CloudIcon, SecurityIcon } from './SmallBusinessIcons';

const SmallBusinessHero = () => {
  return (
    <section className="bg-white py-16">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="md:w-1/2">
            <h1 className="text-4xl font-bold text-circleTel-darkNeutral mb-4">Simple IT Recipes for Small Businesses</h1>
            <p className="text-lg text-circleTel-secondaryNeutral mb-6">
              Reliable, affordable IT solutions designed specifically for small businesses with 1-25 employees. No technical jargon, just simple recipes for success.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button asChild className="primary-button">
                <Link to="/contact">Get a Quote</Link>
              </Button>
              <Button asChild className="outline-button">
                <Link to="/resources/it-health">Free IT Assessment</Link>
              </Button>
            </div>
          </div>
          <div className="md:w-1/2 bg-circleTel-lightNeutral p-6 rounded-lg">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="recipe-card p-4 bg-white rounded-lg shadow-sm border border-circleTel-orange flex items-center justify-center aspect-square">
                <BasicIcon />
              </div>
              <div className="recipe-card p-4 bg-white rounded-lg shadow-sm border border-circleTel-orange flex items-center justify-center aspect-square">
                <CloudIcon />
              </div>
              <div className="recipe-card p-4 bg-white rounded-lg shadow-sm border border-circleTel-orange flex items-center justify-center aspect-square">
                <SecurityIcon />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SmallBusinessHero;
