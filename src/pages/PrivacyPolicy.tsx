
import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow py-16 bg-white">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-circleTel-darkNeutral mb-8">Privacy Policy</h1>
          
          <div className="prose max-w-none">
            <p className="mb-6">Last updated: May 21, 2025</p>
            
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-circleTel-darkNeutral mb-4">1. Introduction</h2>
              <p>CircleTel ("we", "our", or "us") respects your privacy and is committed to protecting your personal data. This privacy policy will inform you about how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.</p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-circleTel-darkNeutral mb-4">2. The Data We Collect</h2>
              <p>We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>Identity Data includes first name, last name, username or similar identifier.</li>
                <li>Contact Data includes billing address, delivery address, email address and telephone numbers.</li>
                <li>Technical Data includes internet protocol (IP) address, your login data, browser type and version.</li>
                <li>Usage Data includes information about how you use our website, products and services.</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-circleTel-darkNeutral mb-4">3. How We Use Your Data</h2>
              <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>To provide our services to you</li>
                <li>To process and deliver your order</li>
                <li>To manage our relationship with you</li>
                <li>To improve our website, products/services, marketing or customer relationships</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-circleTel-darkNeutral mb-4">4. Data Security</h2>
              <p>We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors and other third parties who have a business need to know.</p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-circleTel-darkNeutral mb-4">5. Data Retention</h2>
              <p>We will only retain your personal data for as long as necessary to fulfill the purposes we collected it for, including for the purposes of satisfying any legal, accounting, or reporting requirements.</p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-circleTel-darkNeutral mb-4">6. Your Legal Rights</h2>
              <p>Under data protection laws, you have rights including:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>Your right of access</li>
                <li>Your right to rectification</li>
                <li>Your right to erasure</li>
                <li>Your right to restriction of processing</li>
                <li>Your right to object to processing</li>
                <li>Your right to data portability</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-circleTel-darkNeutral mb-4">7. Contact</h2>
              <p>If you have any questions about this privacy policy or our privacy practices, please contact us at:</p>
              <p>Email: contactus@circletel.co.za</p>
              <p>Phone: 087 087 6305</p>
              <p>Address: West House, 7 Autumn Road, Rivonia, Johannesburg, 2128</p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
