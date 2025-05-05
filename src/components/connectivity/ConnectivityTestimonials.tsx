
import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  image: string;
  quote: string;
  solution: string;
}

const ConnectivityTestimonials = () => {
  const testimonials: Testimonial[] = [
    {
      id: '1',
      name: 'Sarah Miller',
      role: 'Operations Manager',
      company: 'Retail Express',
      image: '/placeholder.svg',
      quote: "CircleTel's WaaS solution has transformed our in-store connectivity. Our customers love the reliable guest Wi-Fi, and our staff can process transactions without interruptions.",
      solution: 'Wi-Fi as a Service'
    },
    {
      id: '2',
      name: 'Michael Johnson',
      role: 'IT Director',
      company: 'MediCare Solutions',
      image: '/placeholder.svg',
      quote: "After struggling with unreliable connectivity, CircleTel's Fibre solution has given us the stability and speed we need for our critical healthcare applications. Uptime has been flawless.",
      solution: 'Fibre to the Premises'
    },
    {
      id: '3',
      name: 'Thandi Nkosi',
      role: 'Founder',
      company: 'NexTech Startups',
      image: '/placeholder.svg',
      quote: "CircleTel's FWA got us online in 48 hours! As a growing startup, we needed flexibility and quick deployment. The service has scaled perfectly with our team growth.",
      solution: 'Fixed Wireless Access'
    }
  ];

  return (
    <section className="py-16 bg-circleTel-lightNeutral">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-circleTel-darkNeutral text-center mb-8">
          Success Stories
        </h2>
        
        <p className="text-circleTel-secondaryNeutral text-center mb-12 max-w-2xl mx-auto">
          See how businesses like yours are achieving connectivity excellence with our tailored solutions.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="bg-white p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-start mb-4">
                <Avatar className="h-12 w-12 mr-4 border-2 border-circleTel-orange">
                  <AvatarImage src={testimonial.image} alt={testimonial.name} />
                  <AvatarFallback className="bg-circleTel-orange text-white">
                    {testimonial.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-circleTel-darkNeutral">{testimonial.name}</h3>
                  <p className="text-sm text-circleTel-secondaryNeutral">{testimonial.role}, {testimonial.company}</p>
                </div>
              </div>
              
              <div className="mb-4">
                <p className="italic text-circleTel-secondaryNeutral">"{testimonial.quote}"</p>
              </div>
              
              <div className="flex items-center">
                <div className="bg-circleTel-lightNeutral rounded-full px-3 py-1">
                  <p className="text-xs font-space-mono text-circleTel-darkNeutral">
                    {testimonial.solution}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <p className="text-circleTel-secondaryNeutral mb-6">
            Join hundreds of satisfied businesses across South Africa that trust CircleTel for their connectivity needs.
          </p>
          <Button asChild className="primary-button">
            <Link to="/case-studies">Read More Success Stories</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ConnectivityTestimonials;
