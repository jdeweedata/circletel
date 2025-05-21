
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const RegisterInterestForm = () => {
  const { toast } = useToast();
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast({
      title: "Interest registered!",
      description: "We'll notify you when our new connectivity services launch.",
    });
    
    // Reset the form
    const form = e.target as HTMLFormElement;
    form.reset();
  };
  
  return (
    <div className="bg-circleTel-lightNeutral rounded-lg p-6 shadow-lg">
      <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-4">Stay Updated on Our New Services</h3>
      <p className="mb-4 text-circleTel-secondaryNeutral">
        Be the first to know when our Fibre and Wireless solutions launch. Register your interest below.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-circleTel-darkNeutral mb-1">
            Full Name
          </label>
          <Input 
            id="name" 
            placeholder="John Smith" 
            required 
            className="w-full"
          />
        </div>
        
        <div>
          <label htmlFor="company" className="block text-sm font-medium text-circleTel-darkNeutral mb-1">
            Company Name
          </label>
          <Input 
            id="company" 
            placeholder="Your Company" 
            required 
            className="w-full"
          />
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-circleTel-darkNeutral mb-1">
            Email Address
          </label>
          <Input 
            id="email" 
            type="email" 
            placeholder="john@company.com" 
            required 
            className="w-full"
          />
        </div>
        
        <div>
          <label htmlFor="services" className="block text-sm font-medium text-circleTel-darkNeutral mb-1">
            Services of Interest
          </label>
          <select 
            id="services" 
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
            required
          >
            <option value="">Select services</option>
            <option value="Fibre">Fibre Internet</option>
            <option value="Wireless">Wireless/Fixed Wireless</option>
            <option value="Both">Both Fibre and Wireless</option>
          </select>
        </div>
        
        <Button 
          type="submit" 
          className="w-full bg-circleTel-orange hover:bg-circleTel-orange/90 text-white"
        >
          Register Interest
        </Button>
      </form>
    </div>
  );
};

export default RegisterInterestForm;
