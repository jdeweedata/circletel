
import React from 'react';
import { Check, Shield } from 'lucide-react';

interface Certification {
  name: string;
  description: string;
  icon?: React.ReactNode;
}

const Certifications = () => {
  const certifications: Certification[] = [
    {
      name: 'Microsoft Gold Partner',
      description: 'Microsoft certification recognizing our expertise in Microsoft solutions.',
      icon: <Shield className="text-circleTel-orange" size={24} />,
    },
    {
      name: 'CompTIA A+',
      description: 'Industry standard certification for PC support technicians.',
      icon: <Shield className="text-circleTel-orange" size={24} />,
    },
    {
      name: 'Cisco Certified',
      description: 'Expertise in networking solutions and infrastructure.',
      icon: <Shield className="text-circleTel-orange" size={24} />,
    },
    {
      name: 'Amazon Web Services',
      description: 'Certified for cloud solutions and migrations.',
      icon: <Shield className="text-circleTel-orange" size={24} />,
    },
  ];

  const businessValues = [
    "Reliable service with 99.9% uptime guarantee",
    "Transparent pricing with no hidden costs",
    "Dedicated technical support team",
    "Regular security audits and updates",
    "Data protection and privacy compliance",
    "Customized IT solutions for your business needs",
  ];

  return (
    <section id="certifications" className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-circleTel-darkNeutral mb-4">Our Certifications</h2>
          <div className="w-16 h-1 bg-circleTel-orange mx-auto mb-8"></div>
          <p className="text-lg max-w-3xl mx-auto text-circleTel-secondaryNeutral">
            We maintain the highest standards of technical expertise through continuous education
            and professional certifications in the IT industry.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {certifications.map((cert, index) => (
            <div key={index} className="bg-white rounded-xl shadow-md p-6 border-t-4 border-circleTel-orange">
              <div className="flex items-center mb-4">
                {cert.icon}
                <h3 className="text-xl font-bold text-circleTel-darkNeutral ml-2">{cert.name}</h3>
              </div>
              <p className="text-circleTel-secondaryNeutral">{cert.description}</p>
            </div>
          ))}
        </div>

        <div className="bg-circleTel-lightNeutral rounded-2xl p-8">
          <div className="text-center mb-10">
            <h3 className="text-2xl font-bold text-circleTel-darkNeutral mb-4">Our Commitment to You</h3>
            <p className="text-circleTel-secondaryNeutral max-w-2xl mx-auto">
              At CircleTel, our certifications back up our commitment to providing reliable, 
              secure, and effective IT solutions for your business.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {businessValues.map((value, index) => (
              <div key={index} className="flex items-start">
                <div className="mt-1 mr-3 flex-shrink-0 bg-circleTel-orange rounded-full p-1 text-white">
                  <Check size={16} />
                </div>
                <p className="text-circleTel-secondaryNeutral">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-12">
          <a 
            href="/case-studies" 
            className="inline-block bg-circleTel-orange hover:bg-circleTel-orange/90 text-white px-8 py-3 rounded-full font-bold transition-all duration-300"
          >
            See Our Work
          </a>
        </div>
      </div>
    </section>
  );
};

export default Certifications;
