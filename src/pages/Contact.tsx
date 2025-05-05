
import React from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, Mail, Phone, MapPin } from 'lucide-react';

const Contact = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real implementation, this would submit the form data
    console.log('Form submitted');
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <section className="bg-gradient-to-b from-circleTel-lightNeutral to-white py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h1 className="text-3xl md:text-4xl font-bold text-circleTel-darkNeutral mb-4">
                Contact CircleTel
              </h1>
              <p className="text-lg text-circleTel-secondaryNeutral max-w-2xl mx-auto">
                Have questions or ready to get started with a connectivity solution tailored to your business? Our team is here to help.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-lg shadow-md">
                <h2 className="text-xl font-bold text-circleTel-darkNeutral mb-6">
                  Send Us a Message
                </h2>
                
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-circleTel-darkNeutral mb-1">
                        Your Name
                      </label>
                      <Input 
                        id="name"
                        type="text" 
                        placeholder="John Doe" 
                        className="w-full rounded-md"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-circleTel-darkNeutral mb-1">
                        Email Address
                      </label>
                      <Input 
                        id="email"
                        type="email" 
                        placeholder="john@example.com" 
                        className="w-full rounded-md"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-circleTel-darkNeutral mb-1">
                        Phone Number
                      </label>
                      <Input 
                        id="phone"
                        type="tel" 
                        placeholder="087 123 4567" 
                        className="w-full rounded-md"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-circleTel-darkNeutral mb-1">
                        Subject
                      </label>
                      <Input 
                        id="subject"
                        type="text" 
                        placeholder="I'm interested in Wi-Fi as a Service" 
                        className="w-full rounded-md"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-circleTel-darkNeutral mb-1">
                        Your Message
                      </label>
                      <Textarea 
                        id="message"
                        placeholder="Tell us about your business and connectivity needs..." 
                        className="w-full rounded-md"
                        rows={5}
                        required
                      />
                    </div>
                    
                    <Button type="submit" className="primary-button w-full">
                      Send Message
                    </Button>
                  </div>
                </form>
              </div>
              
              <div>
                <div className="bg-white p-8 rounded-lg shadow-md mb-8">
                  <h2 className="text-xl font-bold text-circleTel-darkNeutral mb-6">
                    Contact Information
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="bg-circleTel-lightNeutral rounded-full p-3 mr-3 text-circleTel-orange">
                        <Phone size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-circleTel-darkNeutral">Phone</h3>
                        <p className="text-circleTel-secondaryNeutral">087 123 4567</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="bg-circleTel-lightNeutral rounded-full p-3 mr-3 text-circleTel-orange">
                        <Mail size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-circleTel-darkNeutral">Email</h3>
                        <p className="text-circleTel-secondaryNeutral">info@circletel.co.za</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="bg-circleTel-lightNeutral rounded-full p-3 mr-3 text-circleTel-orange">
                        <MapPin size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-circleTel-darkNeutral">Address</h3>
                        <p className="text-circleTel-secondaryNeutral">
                          123 Business Park<br />
                          Innovation Drive<br />
                          Sandton, 2196<br />
                          South Africa
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-8 rounded-lg shadow-md">
                  <h2 className="text-xl font-bold text-circleTel-darkNeutral mb-6">
                    Our Support Hours
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="font-bold text-circleTel-darkNeutral">Monday - Friday:</span>
                      <span className="text-circleTel-secondaryNeutral">8:00 AM - 6:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold text-circleTel-darkNeutral">Saturday:</span>
                      <span className="text-circleTel-secondaryNeutral">9:00 AM - 2:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold text-circleTel-darkNeutral">Sunday:</span>
                      <span className="text-circleTel-secondaryNeutral">Closed</span>
                    </div>
                    <div className="pt-4 border-t">
                      <p className="text-circleTel-secondaryNeutral">
                        <CheckCircle className="inline-block text-circleTel-orange mr-2" size={16} />
                        24/7 emergency support available for business clients
                      </p>
                    </div>
                  </div>
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

export default Contact;
