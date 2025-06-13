import React from 'react';

const logos = [
  { src: '/img/miro.svg', alt: 'MiRO logo' },
  { src: '/img/scoop.svg', alt: 'Scoop logo' },
  { src: '/img/switchcom.svg', alt: 'Switchcom logo' },
  { src: '/img/duxbury.svg', alt: 'Duxbury logo' },
  { src: '/img/icasa.svg', alt: 'ICASA registered badge' },
];

const TrustStrip = () => (
  <section id="trust-strip" className="bg-white py-6 border-t border-b">
    <div className="container mx-auto px-4 flex flex-wrap items-center justify-center gap-6">
      {logos.map((logo) => (
        <img
          key={logo.alt}
          src={logo.src}
          alt={logo.alt}
          className="h-10 md:h-12 object-contain opacity-80 hover:opacity-100 transition"
          loading="lazy"
        />
      ))}
    </div>
  </section>
);

export default TrustStrip;
