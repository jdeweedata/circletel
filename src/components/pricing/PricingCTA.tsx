
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const PricingCTA = () => {
  const { toast } = useToast();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Quote request submitted!",
      description: "Our team will contact you within one business day.",
    });
  };

  return (
    <section id="custom-quote" className="py-16 bg-circleTel-lightNeutral">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-circleTel-darkNeutral mb-4">
            Not Sure Which Recipe Fits?
          </h2>
          <p className="text-center text-circleTel-secondaryNeutral mb-8">
            Let our experts recommend the perfect IT solution for your business needs and budget.
          </p>
          
          <Card className="border-0 shadow-lg rounded-xl">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-circleTel-darkNeutral mb-1">
                      Full Name
                    </label>
                    <Input 
                      id="name" 
                      placeholder="John Smith" 
                      className="w-full rounded-lg" 
                      required 
                    />
                  </div>
                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-circleTel-darkNeutral mb-1">
                      Company Name
                    </label>
                    <Input 
                      id="company" 
                      placeholder="Your Company" 
                      className="w-full rounded-lg" 
                      required 
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-circleTel-darkNeutral mb-1">
                      Email Address
                    </label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="john@company.com" 
                      className="w-full rounded-lg" 
                      required 
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-circleTel-darkNeutral mb-1">
                      Phone Number
                    </label>
                    <Input 
                      id="phone" 
                      placeholder="+27 12 345 6789" 
                      className="w-full rounded-lg" 
                      required 
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="devices" className="block text-sm font-medium text-circleTel-darkNeutral mb-1">
                    Number of Devices
                  </label>
                  <select 
                    id="devices" 
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                    required
                  >
                    <option value="">Select number of devices</option>
                    <option value="1-5">1-5 devices</option>
                    <option value="6-10">6-10 devices</option>
                    <option value="11-20">11-20 devices</option>
                    <option value="21-50">21-50 devices</option>
                    <option value="51+">51+ devices</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-circleTel-darkNeutral mb-1">
                    Additional Requirements
                  </label>
                  <textarea 
                    id="message" 
                    rows={4}
                    placeholder="Tell us about your business and specific IT needs..." 
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  ></textarea>
                </div>
                
                <div className="pt-2">
                  <Button 
                    type="submit" 
                    className="w-full bg-circleTel-orange hover:bg-circleTel-orange/90 text-white rounded-full"
                    size="lg"
                  >
                    Get Started
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default PricingCTA;
