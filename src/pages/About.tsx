
import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import AboutHero from '@/components/about/AboutHero';
import OurStory from '@/components/about/OurStory';
import OurTeam from '@/components/about/OurTeam';
import Certifications from '@/components/about/Certifications';

const About = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main>
        <AboutHero />
        <OurStory />
        <OurTeam />
        <Certifications />
      </main>
      <Footer />
    </div>
  );
};

export default About;
