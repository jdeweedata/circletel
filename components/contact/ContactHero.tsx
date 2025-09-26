import React from 'react';

interface ContactHeroProps {
  className?: string;
}

const ContactHero: React.FC<ContactHeroProps> = ({ className }) => {
  return (
    <div className={`text-center mb-12 ${className || ''}`}>
      <h1 className="text-3xl md:text-4xl font-bold text-circleTel-darkNeutral mb-4">
        Contact CircleTel
      </h1>
      <p className="text-lg text-circleTel-secondaryNeutral max-w-2xl mx-auto">
        Have questions or ready to get started with a connectivity solution tailored to your business? Our team is here to help.
      </p>
    </div>
  );
};

export default ContactHero;