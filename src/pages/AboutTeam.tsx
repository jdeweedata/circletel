
import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import OurTeam from '@/components/about/OurTeam';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const AboutTeam = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main>
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-circleTel-darkNeutral mb-4">Our Team</h1>
              <p className="text-xl text-circleTel-secondaryNeutral max-w-3xl mx-auto">
                Meet the dedicated professionals behind CircleTel's success. Our team combines decades of IT expertise with a passion for helping South African businesses thrive.
              </p>
            </div>
          </div>
        </section>
        
        <OurTeam expanded={true} />
        
        <section className="py-16 bg-circleTel-lightNeutral">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-4">Join Our Team</h2>
              <p className="text-lg text-circleTel-secondaryNeutral max-w-2xl mx-auto mb-8">
                We're always looking for talented individuals who are passionate about IT and customer service. Check out our current openings below.
              </p>
              <Button asChild size="lg" className="bg-circleTel-orange hover:bg-circleTel-orange/90 text-white">
                <Link to="/careers">View Open Positions</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AboutTeam;
