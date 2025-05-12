import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const ITAssessment = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    employees: '',
    challenges: '',
    assessmentType: 'comprehensive'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    // Validate required fields for step 1
    if (step === 1) {
      if (!formData.name || !formData.email || !formData.company) {
        toast({
          title: "Required Fields Missing",
          description: "Please fill in all required fields (Name, Email, and Company).",
          variant: "destructive"
        });
        return;
      }
    }
    setStep(step + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final validation
    if (!formData.name || !formData.email || !formData.company) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log('Submitting IT Assessment form data:', formData);
      
      const { data, error } = await supabase.functions.invoke('zoho-crm', {
        body: formData
      });
      
      console.log('Zoho CRM response for IT Assessment:', data);
      
      if (error) {
        console.error('Error response:', error);
        throw error;
      }
      
      if (!data.success) {
        console.error('Unsuccessful response:', data);
        throw new Error(data.error || 'Unknown error occurred');
      }
      
      // Show success message
      toast({
        title: "Assessment Request Submitted!",
        description: "Our team will contact you within 24 hours to schedule your IT assessment.",
      });
      
      // Reset form and go to thank you step
      setStep(3);
      
    } catch (error) {
      console.error('Error submitting assessment request:', error);
      toast({
        title: "Submission Error",
        description: "There was a problem submitting your assessment request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <section className="bg-gradient-to-b from-circleTel-lightNeutral to-white py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h1 className="text-3xl md:text-4xl font-bold text-circleTel-darkNeutral mb-4">
                Free IT Health Assessment
              </h1>
              <p className="text-lg text-circleTel-secondaryNeutral max-w-2xl mx-auto">
                Get a comprehensive evaluation of your IT infrastructure with actionable recommendations from our experts.
              </p>
            </div>

            <div className="max-w-3xl mx-auto">
              {step === 1 && (
                <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
                  <h2 className="text-xl font-bold text-circleTel-darkNeutral mb-6">Tell Us About Your Business</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-circleTel-darkNeutral mb-1">
                        Your Name <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full"
                        placeholder="Enter your full name"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-circleTel-darkNeutral mb-1">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full"
                        placeholder="youremail@company.com"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="company" className="block text-sm font-medium text-circleTel-darkNeutral mb-1">
                        Company Name <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="text"
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        required
                        className="w-full"
                        placeholder="Your company name"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-circleTel-darkNeutral mb-1">
                        Phone Number
                      </label>
                      <Input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full"
                        placeholder="Optional contact number"
                      />
                    </div>
                    
                    <div className="mt-6">
                      <Button 
                        onClick={handleNext} 
                        className="primary-button w-full"
                      >
                        Continue to Assessment Details
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {step === 2 && (
                <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6 md:p-8">
                  <h2 className="text-xl font-bold text-circleTel-darkNeutral mb-6">IT Assessment Details</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="employees" className="block text-sm font-medium text-circleTel-darkNeutral mb-1">
                        Number of Employees
                      </label>
                      <select
                        id="employees"
                        name="employees"
                        value={formData.employees}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-circleTel-orange"
                      >
                        <option value="">Select an option</option>
                        <option value="1-10">1-10</option>
                        <option value="11-50">11-50</option>
                        <option value="51-200">51-200</option>
                        <option value="201+">201+</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="challenges" className="block text-sm font-medium text-circleTel-darkNeutral mb-1">
                        Current IT Challenges
                      </label>
                      <Textarea
                        id="challenges"
                        name="challenges"
                        value={formData.challenges}
                        onChange={handleChange}
                        rows={4}
                        className="w-full"
                        placeholder="Tell us about any specific IT issues or goals you have..."
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="assessmentType" className="block text-sm font-medium text-circleTel-darkNeutral mb-1">
                        Assessment Type
                      </label>
                      <select
                        id="assessmentType"
                        name="assessmentType"
                        value={formData.assessmentType}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-circleTel-orange"
                      >
                        <option value="comprehensive">Comprehensive IT Assessment</option>
                        <option value="security">Security-Focused Assessment</option>
                        <option value="network">Network Infrastructure Assessment</option>
                        <option value="cloud">Cloud Readiness Assessment</option>
                      </select>
                    </div>
                    
                    <div className="pt-4 flex items-center space-x-4">
                      <Button 
                        type="button"
                        onClick={() => setStep(1)} 
                        variant="outline"
                        className="flex-1"
                      >
                        Back
                      </Button>
                      <Button 
                        type="submit" 
                        className="primary-button flex-1"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          "Submit Assessment Request"
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              )}
              
              {step === 3 && (
                <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-circleTel-orange rounded-full text-white mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-circleTel-darkNeutral mb-4">Thank You!</h2>
                  <p className="text-circleTel-secondaryNeutral mb-6">
                    Your IT assessment request has been received. Our team will review your information and contact you within 24 hours to schedule your assessment.
                  </p>
                  <p className="text-circleTel-secondaryNeutral font-bold mb-8">
                    We've sent a confirmation email to {formData.email}.
                  </p>
                  <Button asChild className="primary-button">
                    <a href="/">Return to Home</a>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>
        
        <section className="bg-white py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold text-circleTel-darkNeutral mb-8 text-center">
                What Our IT Assessment Includes
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-circleTel-lightNeutral p-6 rounded-lg">
                  <div className="flex items-center mb-4">
                    <div className="bg-circleTel-orange rounded-full p-2 mr-4 text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <h3 className="font-bold text-circleTel-darkNeutral">Security Evaluation</h3>
                  </div>
                  <ul className="space-y-2 text-circleTel-secondaryNeutral">
                    <li className="flex items-start">
                      <span className="text-circleTel-orange mr-2">•</span>
                      <span>Vulnerability scanning</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-circleTel-orange mr-2">•</span>
                      <span>Threat detection analysis</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-circleTel-orange mr-2">•</span>
                      <span>Security policy review</span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-circleTel-lightNeutral p-6 rounded-lg">
                  <div className="flex items-center mb-4">
                    <div className="bg-circleTel-orange rounded-full p-2 mr-4 text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="font-bold text-circleTel-darkNeutral">Cost Optimization</h3>
                  </div>
                  <ul className="space-y-2 text-circleTel-secondaryNeutral">
                    <li className="flex items-start">
                      <span className="text-circleTel-orange mr-2">•</span>
                      <span>License utilization review</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-circleTel-orange mr-2">•</span>
                      <span>Infrastructure cost analysis</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-circleTel-orange mr-2">•</span>
                      <span>ROI improvement recommendations</span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-circleTel-lightNeutral p-6 rounded-lg">
                  <div className="flex items-center mb-4">
                    <div className="bg-circleTel-orange rounded-full p-2 mr-4 text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h3 className="font-bold text-circleTel-darkNeutral">Performance Analysis</h3>
                  </div>
                  <ul className="space-y-2 text-circleTel-secondaryNeutral">
                    <li className="flex items-start">
                      <span className="text-circleTel-orange mr-2">•</span>
                      <span>Network speed evaluation</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-circleTel-orange mr-2">•</span>
                      <span>System response time testing</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-circleTel-orange mr-2">•</span>
                      <span>Bottleneck identification</span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-circleTel-lightNeutral p-6 rounded-lg">
                  <div className="flex items-center mb-4">
                    <div className="bg-circleTel-orange rounded-full p-2 mr-4 text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h3 className="font-bold text-circleTel-darkNeutral">Growth Readiness</h3>
                  </div>
                  <ul className="space-y-2 text-circleTel-secondaryNeutral">
                    <li className="flex items-start">
                      <span className="text-circleTel-orange mr-2">•</span>
                      <span>Scalability assessment</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-circleTel-orange mr-2">•</span>
                      <span>Future-proofing recommendations</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-circleTel-orange mr-2">•</span>
                      <span>Technology roadmap planning</span>
                    </li>
                  </ul>
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

export default ITAssessment;
