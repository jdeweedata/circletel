
import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Cloud, Server, Laptop } from 'lucide-react';

const CloudMigration = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main>
        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-white to-circleTel-lightNeutral">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="md:w-1/2">
                <h1 className="text-4xl md:text-5xl font-bold text-circleTel-darkNeutral mb-4">Cloud Migration Services</h1>
                <p className="text-xl text-circleTel-secondaryNeutral mb-6">
                  Seamlessly move your business to the cloud with our expert migration services designed for South African businesses.
                </p>
                <Button asChild size="lg" className="bg-circleTel-orange hover:bg-circleTel-orange/90 text-white">
                  <Link to="/contact">Get Migration Assessment</Link>
                </Button>
              </div>
              <div className="md:w-1/2 flex justify-center">
                <div className="relative">
                  <div className="h-64 w-64 rounded-full bg-circleTel-orange/10 flex items-center justify-center">
                    <Cloud size={100} className="text-circleTel-orange" />
                  </div>
                  <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-white flex items-center justify-center shadow-lg">
                    <Server size={40} className="text-circleTel-orange" />
                  </div>
                  <div className="absolute -left-4 bottom-0 h-32 w-32 rounded-full bg-white flex items-center justify-center shadow-lg">
                    <Laptop size={48} className="text-circleTel-orange" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Content Placeholder */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-8">Coming Soon</h2>
            <p className="text-xl text-circleTel-secondaryNeutral mb-8 max-w-2xl mx-auto">
              Our detailed cloud migration services page is under construction. Contact us today to learn how we can help move your business to the cloud.
            </p>
            <Button asChild className="bg-circleTel-orange hover:bg-circleTel-orange/90 text-white">
              <Link to="/contact">Contact Us</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default CloudMigration;
