
import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const TermsOfService = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow py-16 bg-white">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-circleTel-darkNeutral mb-8">Terms of Service</h1>
          
          <div className="prose max-w-none">
            <p className="mb-6">Last updated: May 21, 2025</p>
            
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-circleTel-darkNeutral mb-4">1. Introduction</h2>
              <p>These terms and conditions outline the rules and regulations for the use of CircleTel's website and services. By accessing this website and using our services, we assume you accept these terms and conditions in full. Do not continue to use CircleTel's website or services if you do not accept all of the terms and conditions stated on this page.</p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-circleTel-darkNeutral mb-4">2. Service Description</h2>
              <p>CircleTel provides IT services, including but not limited to managed IT services, Wi-Fi as a service, connectivity solutions, and cloud services to businesses in South Africa. The specific services to be provided to you will be detailed in a separate service agreement.</p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-circleTel-darkNeutral mb-4">3. Payment and Fees</h2>
              <p>Payment terms for our services are outlined in your service agreement. Unless otherwise specified, invoices are due within 30 days of the invoice date. Late payments may result in service interruptions or termination.</p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-circleTel-darkNeutral mb-4">4. Service Level Agreement</h2>
              <p>Our service level commitments are detailed in a separate Service Level Agreement (SLA) that forms part of your service contract. This includes our response times, uptime guarantees, and support availability.</p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-circleTel-darkNeutral mb-4">5. Intellectual Property</h2>
              <p>All intellectual property rights in relation to the services, including but not limited to software, documentation, and methodologies, belong to CircleTel or its licensors. No transfer of ownership is intended under these terms.</p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-circleTel-darkNeutral mb-4">6. Limitation of Liability</h2>
              <p>To the maximum extent permitted by law, CircleTel shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly.</p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-circleTel-darkNeutral mb-4">7. Term and Termination</h2>
              <p>The term of service is specified in your service agreement. Either party may terminate for material breach if not remedied within 30 days of written notice. CircleTel reserves the right to terminate services immediately if you violate these terms.</p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-circleTel-darkNeutral mb-4">8. Governing Law</h2>
              <p>These terms shall be governed by and construed in accordance with the laws of South Africa, and any disputes will be subject to the exclusive jurisdiction of the South African courts.</p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-circleTel-darkNeutral mb-4">9. Contact</h2>
              <p>If you have any questions about these Terms of Service, please contact us at:</p>
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

export default TermsOfService;
