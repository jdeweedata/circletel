import React, { useState } from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, Calendar, MapPin, Mail, Phone, Cloud } from 'lucide-react';
import { toast } from "@/hooks/use-toast";

const Contact = () => {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    serviceInterest: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleServiceChange = (value: string) => {
    setFormData(prev => ({ ...prev, serviceInterest: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real implementation, this would submit the form data
    console.log('Form submitted', formData);
    
    // Show success message
    toast({
      title: "Message Sent!",
      description: "We'll reply to your inquiry within 24 hours.",
    });
    
    // Reset form and show confirmation
    setFormSubmitted(true);
    setFormData({ name: '', email: '', serviceInterest: '' });
    
    // Reset form state after 5 seconds
    setTimeout(() => {
      setFormSubmitted(false);
    }, 5000);
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
                  Get in Touch
                </h2>
                
                {formSubmitted ? (
                  <div className="bg-green-50 border border-green-200 rounded-md p-6 text-center">
                    <CheckCircle className="mx-auto text-green-500 mb-3" size={40} />
                    <h3 className="text-lg font-bold text-green-800 mb-2">Thank You!</h3>
                    <p className="text-green-700">
                      We've received your message and will get back to you within 24 hours.
                    </p>
                  </div>
                ) : (
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
                          value={formData.name}
                          onChange={handleChange}
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
                          value={formData.email}
                          onChange={handleChange}
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="serviceInterest" className="block text-sm font-medium text-circleTel-darkNeutral mb-1">
                          Service Interest
                        </label>
                        <Select onValueChange={handleServiceChange} value={formData.serviceInterest}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a service" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="managed-it">Managed IT Services</SelectItem>
                            <SelectItem value="wifi">Wi-Fi as a Service</SelectItem>
                            <SelectItem value="connectivity">Connectivity Solutions</SelectItem>
                            <SelectItem value="cloud">Cloud Services</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <Button type="submit" className="primary-button w-full">
                        Send Message
                      </Button>
                    </div>
                  </form>
                )}

                <div className="mt-8 flex flex-col space-y-4">
                  <h3 className="font-bold text-circleTel-darkNeutral">Quick Actions</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Button variant="outline" className="flex items-center justify-center gap-2">
                      <Calendar size={18} />
                      <span>Schedule Consultation</span>
                    </Button>
                    <Button variant="outline" className="flex items-center justify-center gap-2">
                      <MapPin size={18} />
                      <span>Request Site Survey</span>
                    </Button>
                    <Button variant="outline" className="flex items-center justify-center gap-2">
                      <Cloud size={18} />
                      <span>Get Cloud Quote</span>
                    </Button>
                  </div>
                </div>
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
                        <p className="text-circleTel-secondaryNeutral">087 087 6305</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="bg-circleTel-lightNeutral rounded-full p-3 mr-3 text-circleTel-orange">
                        <Mail size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-circleTel-darkNeutral">Email</h3>
                        <p className="text-circleTel-secondaryNeutral">contactus@circletel.co.za</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="bg-circleTel-lightNeutral rounded-full p-3 mr-3 text-circleTel-orange">
                        <MapPin size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-circleTel-darkNeutral">Address</h3>
                        <p className="text-circleTel-secondaryNeutral">
                          West House, 7 Autumn Road<br />
                          Rivonia, Johannesburg<br />
                          2128<br />
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
                      <span className="text-circleTel-secondaryNeutral">08:00 AM - 17:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold text-circleTel-darkNeutral">Saturday:</span>
                      <span className="text-circleTel-secondaryNeutral">Closed</span>
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
