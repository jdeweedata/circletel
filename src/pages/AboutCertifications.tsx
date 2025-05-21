
import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Certifications from '@/components/about/Certifications';
import { Link } from 'react-router-dom';

const AboutCertifications = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main>
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-circleTel-darkNeutral mb-4">Our Certifications</h1>
              <p className="text-xl text-circleTel-secondaryNeutral max-w-3xl mx-auto">
                CircleTel maintains the highest industry standards through continuous professional development and certification. 
                Our credentials reflect our commitment to excellence in IT services.
              </p>
            </div>
          </div>
        </section>
        
        <Certifications expanded={true} />
        
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-4">Our Partners</h2>
              <p className="text-lg text-circleTel-secondaryNeutral max-w-2xl mx-auto mb-8">
                We've built strong relationships with leading technology vendors to deliver the best solutions for our clients.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
                <div className="bg-circleTel-lightNeutral p-6 rounded-lg flex items-center justify-center">
                  <span className="text-xl font-bold text-circleTel-darkNeutral">Microsoft</span>
                </div>
                <div className="bg-circleTel-lightNeutral p-6 rounded-lg flex items-center justify-center">
                  <span className="text-xl font-bold text-circleTel-darkNeutral">AWS</span>
                </div>
                <div className="bg-circleTel-lightNeutral p-6 rounded-lg flex items-center justify-center">
                  <span className="text-xl font-bold text-circleTel-darkNeutral">Cisco</span>
                </div>
                <div className="bg-circleTel-lightNeutral p-6 rounded-lg flex items-center justify-center">
                  <span className="text-xl font-bold text-circleTel-darkNeutral">Dell</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AboutCertifications;
