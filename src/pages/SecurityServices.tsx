
import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

const SecurityServices = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main>
        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-white to-circleTel-lightNeutral">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="md:w-1/2">
                <h1 className="text-4xl md:text-5xl font-bold text-circleTel-darkNeutral mb-4">IT Security Solutions</h1>
                <p className="text-xl text-circleTel-secondaryNeutral mb-6">
                  Comprehensive security solutions to protect your South African business from cyber threats and data breaches.
                </p>
                <Button asChild size="lg" className="bg-circleTel-orange hover:bg-circleTel-orange/90 text-white">
                  <Link to="/contact">Get Security Assessment</Link>
                </Button>
              </div>
              <div className="md:w-1/2 flex justify-center">
                <div className="relative">
                  <div className="h-64 w-64 rounded-lg bg-circleTel-orange/10 flex items-center justify-center">
                    <ShieldCheck size={100} className="text-circleTel-orange" />
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
              Our detailed security services page is under construction. Contact us today to learn how we can help protect your business from cyber threats.
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

export default SecurityServices;
