
import React from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import CaseStudiesHero from '../components/case-studies/CaseStudiesHero';
import CaseStudyGrid from '../components/case-studies/CaseStudyGrid';
import CaseStudiesCTA from '../components/case-studies/CaseStudiesCTA';

const CaseStudies = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <CaseStudiesHero />
        <CaseStudyGrid />
        <CaseStudiesCTA />
      </main>
      <Footer />
    </div>
  );
};

export default CaseStudies;
