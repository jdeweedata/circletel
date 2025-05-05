
import React from 'react';
import { ArrowRight, Calendar, Target, Users, Zap } from 'lucide-react';

const OurStory = () => {
  const timelineEvents = [
    {
      year: '2010',
      title: 'Founded',
      description: 'CircleTel was established to provide simple IT solutions for small businesses.',
      icon: <Calendar size={24} />,
    },
    {
      year: '2014',
      title: 'Expansion',
      description: 'Expanded services to mid-sized businesses and opened a second office.',
      icon: <Users size={24} />,
    },
    {
      year: '2018',
      title: 'Recipe Concept',
      description: 'Launched our signature "IT Recipe" concept to simplify service packages.',
      icon: <Zap size={24} />,
    },
    {
      year: '2023',
      title: 'Digital Transformation',
      description: 'Integrated AI and cloud solutions into our service offerings.',
      icon: <Target size={24} />,
    },
  ];

  return (
    <section id="story" className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-circleTel-darkNeutral mb-4">Our Story</h2>
          <div className="w-16 h-1 bg-circleTel-orange mx-auto mb-8"></div>
          <p className="text-lg max-w-3xl mx-auto text-circleTel-secondaryNeutral">
            Since our inception, CircleTel has been on a mission to simplify IT for businesses of all sizes.
            We believe that technology should be an enabler, not a barrier, to your success.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-0 md:left-1/2 transform md:-translate-x-1/2 h-full w-1 bg-circleTel-lightNeutral"></div>
            
            {/* Timeline events */}
            {timelineEvents.map((event, index) => (
              <div key={index} className={`mb-12 relative flex flex-col ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                <div className="hidden md:block w-1/2"></div>
                <div className="absolute left-0 md:left-1/2 transform -translate-x-1/2 -translate-y-1/4">
                  <div className="rounded-full bg-white border-4 border-circleTel-orange p-2 text-circleTel-orange">
                    {event.icon}
                  </div>
                </div>
                <div className={`pl-10 md:pl-0 ${index % 2 === 0 ? 'md:pr-12' : 'md:pl-12'} w-full md:w-1/2`}>
                  <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-circleTel-orange">
                    <span className="inline-block px-3 py-1 rounded-full bg-circleTel-lightNeutral text-sm font-semibold mb-2">
                      {event.year}
                    </span>
                    <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-2">{event.title}</h3>
                    <p className="text-circleTel-secondaryNeutral">{event.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-lg font-bold text-circleTel-darkNeutral mb-8">
            Today, we continue our journey of helping South African businesses leverage technology for growth.
          </p>
          <a 
            href="#team" 
            className="inline-flex items-center text-circleTel-orange font-bold hover:underline"
          >
            Meet Our Team <ArrowRight size={16} className="ml-1" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default OurStory;
