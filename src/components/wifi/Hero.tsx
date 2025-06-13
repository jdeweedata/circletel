import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Hero = () => (
  <section
    id="hero"
    className="relative bg-gray-900 text-white overflow-hidden"
    style={{ backgroundImage: 'url(/img/hero.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}
  >
    <div className="absolute inset-0 bg-black/50" aria-hidden="true"></div>

    <div className="relative z-10 container mx-auto px-4 py-24 text-center max-w-3xl">
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight">
        Blanket Your Home in High-Speed Wi-Fi – Installed This Week
      </h1>
      <p className="text-lg md:text-xl mb-8 font-medium">
        From R3&nbsp;000 once-off. Free coverage survey in Gauteng.
      </p>
      <Button
        asChild
        size="lg"
        className="bg-circleTel-orange hover:bg-circleTel-orange/90 text-white font-bold"
        aria-label="Book My Free Survey"
      >
        <Link to="#lead-form">Book My Free Survey</Link>
      </Button>
    </div>
  </section>
);

export default Hero;
