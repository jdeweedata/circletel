
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { ArrowRight } from 'lucide-react';

type FormData = {
  guestWifi: boolean;
  fibreCoverage: boolean;
  multipleLocations: boolean;
  missionCritical: boolean;
  quickDeployment: boolean;
  highBandwidth: boolean;
  name: string;
  email: string;
};

const ConnectivityTool = () => {
  const [showRecommendation, setShowRecommendation] = useState(false);
  const [recommendation, setRecommendation] = useState('');
  const [submittedData, setSubmittedData] = useState<FormData | null>(null);
  
  const form = useForm<FormData>({
    defaultValues: {
      guestWifi: false,
      fibreCoverage: false,
      multipleLocations: false,
      missionCritical: false,
      quickDeployment: false,
      highBandwidth: false,
      name: '',
      email: '',
    },
  });

  const getRecommendation = (data: FormData) => {
    // Logic to determine the recommended solution based on form responses
    if (data.fibreCoverage && data.highBandwidth) {
      return 'Fibre to the Premises (FTTP)';
    } else if (data.quickDeployment || !data.fibreCoverage) {
      return 'Fixed Wireless Access (FWA)';
    } else if (data.guestWifi && data.multipleLocations) {
      return 'Wi-Fi as a Service (WaaS)';
    } else {
      return 'Custom Hybrid Solution';
    }
  };

  const onSubmit = (data: FormData) => {
    const rec = getRecommendation(data);
    setRecommendation(rec);
    setSubmittedData(data);
    setShowRecommendation(true);
    
    // In a real application, you would send this data to your backend or CRM
    console.log('Form submitted:', data);
  };

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-circleTel-darkNeutral text-center mb-8">
          Build Your Connectivity Recipe
        </h2>

        <div className="max-w-3xl mx-auto">
          {!showRecommendation ? (
            <Card className="p-6 md:p-8">
              <p className="text-circleTel-secondaryNeutral mb-8 text-center">
                Answer a few simple questions and we'll recommend the perfect connectivity solution for your business.
              </p>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="guestWifi"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox 
                              checked={field.value}
                              onCheckedChange={field.onChange} 
                            />
                          </FormControl>
                          <FormLabel className="font-normal text-circleTel-darkNeutral cursor-pointer">
                            Need guest Wi-Fi?
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="fibreCoverage"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox 
                              checked={field.value}
                              onCheckedChange={field.onChange} 
                            />
                          </FormControl>
                          <FormLabel className="font-normal text-circleTel-darkNeutral cursor-pointer">
                            Fibre coverage in your area?
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="multipleLocations"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox 
                              checked={field.value}
                              onCheckedChange={field.onChange} 
                            />
                          </FormControl>
                          <FormLabel className="font-normal text-circleTel-darkNeutral cursor-pointer">
                            Multiple locations?
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="missionCritical"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox 
                              checked={field.value}
                              onCheckedChange={field.onChange} 
                            />
                          </FormControl>
                          <FormLabel className="font-normal text-circleTel-darkNeutral cursor-pointer">
                            Mission-critical applications?
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="quickDeployment"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox 
                              checked={field.value}
                              onCheckedChange={field.onChange} 
                            />
                          </FormControl>
                          <FormLabel className="font-normal text-circleTel-darkNeutral cursor-pointer">
                            Need quick deployment?
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="highBandwidth"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox 
                              checked={field.value}
                              onCheckedChange={field.onChange} 
                            />
                          </FormControl>
                          <FormLabel className="font-normal text-circleTel-darkNeutral cursor-pointer">
                            High bandwidth requirements?
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-lg font-bold text-circleTel-darkNeutral mb-4">
                      Get Your Custom Recipe
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-circleTel-darkNeutral mb-1">Name</label>
                        <input
                          id="name"
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-circleTel-orange"
                          placeholder="Your name"
                          {...form.register('name')}
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-circleTel-darkNeutral mb-1">Email</label>
                        <input
                          id="email"
                          type="email"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-circleTel-orange"
                          placeholder="your@email.com"
                          {...form.register('email')}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <Button type="submit" className="primary-button">
                      Get Your Custom Recipe
                    </Button>
                  </div>
                </form>
              </Form>
            </Card>
          ) : (
            <Card className="p-6 md:p-8 bg-gradient-to-br from-circleTel-lightNeutral to-white">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-circleTel-orange rounded-full text-white mb-4">
                  <ArrowRight size={28} />
                </div>
                <h3 className="text-xl font-bold text-circleTel-darkNeutral">
                  Your Recommended Recipe
                </h3>
              </div>
              
              <div className="bg-white rounded-lg p-6 border border-circleTel-orange mb-6">
                <h4 className="text-2xl font-bold text-circleTel-orange mb-2 text-center">
                  {recommendation}
                </h4>
                <p className="text-circleTel-secondaryNeutral text-center mb-4">
                  Based on your requirements, we recommend:
                </p>
                
                <div className="space-y-2 font-space-mono text-sm text-circleTel-secondaryNeutral">
                  {submittedData?.guestWifi && (
                    <div className="flex items-center">
                      <span className="w-2 h-2 bg-circleTel-orange rounded-full mr-2"></span>
                      <p>Guest Wi-Fi capabilities</p>
                    </div>
                  )}
                  {submittedData?.multipleLocations && (
                    <div className="flex items-center">
                      <span className="w-2 h-2 bg-circleTel-orange rounded-full mr-2"></span>
                      <p>Multi-location network management</p>
                    </div>
                  )}
                  {submittedData?.missionCritical && (
                    <div className="flex items-center">
                      <span className="w-2 h-2 bg-circleTel-orange rounded-full mr-2"></span>
                      <p>High reliability for mission-critical applications</p>
                    </div>
                  )}
                  {submittedData?.quickDeployment && (
                    <div className="flex items-center">
                      <span className="w-2 h-2 bg-circleTel-orange rounded-full mr-2"></span>
                      <p>Rapid deployment option</p>
                    </div>
                  )}
                  {submittedData?.highBandwidth && (
                    <div className="flex items-center">
                      <span className="w-2 h-2 bg-circleTel-orange rounded-full mr-2"></span>
                      <p>Enhanced bandwidth allocation</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-circleTel-secondaryNeutral mb-4">
                  Thank you, {submittedData?.name}! Our team will contact you at {submittedData?.email} within 24 hours with your personalized connectivity plan.
                </p>
                <Button 
                  onClick={() => setShowRecommendation(false)} 
                  variant="outline" 
                  className="mr-4"
                >
                  Start Over
                </Button>
                <Button asChild className="primary-button">
                  <Link to="/resources/it-health">Get a Detailed Assessment</Link>
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
};

export default ConnectivityTool;
