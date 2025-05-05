
import React from 'react';

const AboutHero = () => {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-white to-circleTel-lightNeutral">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-8 md:mb-0 md:pr-8">
            <h1 className="text-4xl md:text-5xl font-bold text-circleTel-darkNeutral mb-4">
              Your Trusted IT Recipe Partner
            </h1>
            <p className="text-xl text-circleTel-secondaryNeutral mb-6">
              Serving South African businesses with reliable IT since 2010.
            </p>
            <div className="flex gap-4">
              <a 
                href="#team" 
                className="bg-circleTel-orange hover:bg-circleTel-orange/90 text-white px-6 py-3 rounded-full font-bold transition-all duration-300"
              >
                Meet Our Team
              </a>
              <a 
                href="#certifications" 
                className="bg-white border-2 border-circleTel-orange text-circleTel-orange px-6 py-3 rounded-full font-bold hover:bg-circleTel-orange hover:text-white transition-all duration-300"
              >
                View Certifications
              </a>
            </div>
          </div>
          <div className="md:w-1/2">
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-full h-full bg-circleTel-orange rounded-xl"></div>
              <div className="relative z-10 bg-white p-6 rounded-xl shadow-lg">
                <div className="aspect-video bg-circleTel-lightNeutral rounded-lg flex items-center justify-center">
                  <img 
                    src="/placeholder.svg" 
                    alt="CircleTel Team" 
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutHero;
