
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle } from 'lucide-react';
import { toast } from "@/hooks/use-toast";

interface ContactFormProps {
  className?: string;
}

const ContactForm: React.FC<ContactFormProps> = ({ className }) => {
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
    <div className={`bg-white p-8 rounded-lg shadow-md ${className || ''}`}>
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
    </div>
  );
};

export default ContactForm;
