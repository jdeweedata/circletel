
import React from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import ContactHero from '../components/contact/ContactHero';
import ContactForm from '../components/contact/ContactForm';
import QuickActions from '../components/contact/QuickActions';
import ContactInformation from '../components/contact/ContactInformation';
import SupportHours from '../components/contact/SupportHours';

const Contact = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <section className="bg-gradient-to-b from-circleTel-lightNeutral to-white py-16">
          <div className="container mx-auto px-4">
            <ContactHero />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <ContactForm />
                <QuickActions />
              </div>
              
              <div>
                <ContactInformation />
                <SupportHours />
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
