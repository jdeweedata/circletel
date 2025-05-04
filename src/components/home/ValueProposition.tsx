
import React from 'react';

interface ValueCardProps {
  title: string;
  stat: string;
  description: string;
  index: number;
}

const ValueCard = ({ title, stat, description, index }: ValueCardProps) => {
  // Alternate the animation delay for a staggered effect
  const animationDelay = `${index * 100}ms`;

  return (
    <div 
      className="bg-white rounded-lg shadow-lg p-6 relative transition-all duration-300 hover:shadow-xl"
      style={{ animationDelay }}
    >
      {/* Circular accent in top right */}
      <div className="absolute -top-4 -right-4 bg-circleTel-lightNeutral rounded-full h-12 w-12 flex items-center justify-center border-4 border-white">
        <span className="text-circleTel-orange font-bold">{index + 1}</span>
      </div>
      
      <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-3">{title}</h3>
      <div className="text-3xl font-space-mono text-circleTel-orange font-bold mb-3">
        {stat}
      </div>
      <p className="text-circleTel-secondaryNeutral">
        {description}
      </p>
      
      {/* Network-themed decoration */}
      <div className="absolute bottom-0 right-0 w-16 h-16 opacity-10">
        <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-circleTel-orange rounded-full"></div>
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-circleTel-orange rounded-full"></div>
        <div className="absolute top-3/4 left-3/4 w-2 h-2 bg-circleTel-orange rounded-full"></div>
        <div className="absolute top-1/4 left-3/4 w-1 h-1 bg-circleTel-orange rounded-full"></div>
        <div className="absolute top-3/4 left-1/4 w-1 h-1 bg-circleTel-orange rounded-full"></div>
      </div>
    </div>
  );
};

const Testimonial = ({ quote, name, position, company }: { quote: string; name: string; position: string; company: string }) => {
  return (
    <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
      <p className="text-circleTel-secondaryNeutral mb-4 italic">"{quote}"</p>
      <div className="flex items-center">
        <div className="h-10 w-10 bg-circleTel-orange rounded-full flex items-center justify-center text-white font-bold">
          {name.charAt(0)}
        </div>
        <div className="ml-3">
          <p className="font-bold text-circleTel-darkNeutral">{name}</p>
          <p className="text-sm text-circleTel-secondaryNeutral">{position}, {company}</p>
        </div>
      </div>
    </div>
  );
};

const ValueProposition = () => {
  const values = [
    {
      title: "Reliability",
      stat: "99.9%",
      description: "Uptime guaranteed with our managed services, keeping your business running smoothly."
    },
    {
      title: "Cost-Efficiency",
      stat: "35%",
      description: "Average cost savings for businesses who switch to our IT recipes from traditional solutions."
    },
    {
      title: "Expertise",
      stat: "15+ Yrs",
      description: "Combined experience in IT solutions, cybersecurity, and cloud infrastructure management."
    }
  ];

  const testimonials = [
    {
      quote: "CircleTel's IT recipe approach simplified our tech stack while improving security. It's exactly what our small retail business needed.",
      name: "Sarah Johnson",
      position: "Owner",
      company: "Urban Boutique"
    },
    {
      quote: "The IT assessment was eye-opening. CircleTel identified critical vulnerabilities we weren't aware of and provided a clear roadmap for improvement.",
      name: "Michael Ndlovu",
      position: "Operations Director",
      company: "Helios Manufacturing"
    }
  ];

  return (
    <section className="py-16 bg-circleTel-lightNeutral">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-4">Why Choose CircleTel's IT Recipes?</h2>
          <p className="text-circleTel-secondaryNeutral max-w-2xl mx-auto">
            Our proven approach delivers measurable results for businesses of all sizes.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {values.map((value, index) => (
            <ValueCard
              key={index}
              title={value.title}
              stat={value.stat}
              description={value.description}
              index={index}
            />
          ))}
        </div>
        
        <div className="bg-white rounded-lg p-6 md:p-10 shadow-lg">
          <h3 className="text-2xl font-bold text-circleTel-darkNeutral mb-6 text-center">What Our Clients Say</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <Testimonial
                key={index}
                quote={testimonial.quote}
                name={testimonial.name}
                position={testimonial.position}
                company={testimonial.company}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ValueProposition;
