
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

type BundleQuoteFormProps = {
  bundleName: string;
  onSuccess?: () => void;
  className?: string;
}

type FormData = {
  name: string;
  email: string;
  company: string;
  phone: string;
  employees: string;
  province: string;
  city: string;
  serviceInterest: string;
  challenges: string;
}

const BundleQuoteForm = ({ bundleName, onSuccess, className = "" }: BundleQuoteFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    company: '',
    phone: '',
    employees: '',
    province: '',
    city: '',
    serviceInterest: '',
    challenges: ''
  });
  const [loading, setLoading] = useState(false);

  const provinces = [
    'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 
    'Free State', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape'
  ];

  const serviceInterests = [
    'Fixed Wireless Access (FWA)',
    'Managed IT Services', 
    'Cloud Backup & Storage',
    'Wi-Fi as a Service',
    'Power Backup Solutions',
    'Homeschooling Setup',
    'Complete Bundle Package'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      console.log('Submitting bundle quote form:', { ...formData, bundle: bundleName });
      
      const { data, error } = await supabase.functions.invoke('zoho-crm', {
        body: {
          ...formData,
          bundle: bundleName,
          formType: 'quote'
        }
      });
      
      console.log('Zoho CRM response:', data);
      
      if (error) {
        console.error('Error response:', error);
        throw error;
      }
      
      if (!data.success) {
        console.error('Unsuccessful response:', data);
        throw new Error(data.error || 'Unknown error occurred');
      }
      
      toast({
        title: "Quote Request Submitted!",
        description: `Your ${bundleName} quote request has been received. We'll contact you within 24 hours.`,
      });
      
      setFormData({
        name: '',
        email: '',
        company: '',
        phone: '',
        employees: '',
        province: '',
        city: '',
        serviceInterest: '',
        challenges: ''
      });
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error submitting quote form:', error);
      toast({
        title: "Submission Error",
        description: "There was a problem processing your quote request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`bg-white rounded-xl p-6 shadow-lg ${className}`}>
      <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-4">
        Get Your {bundleName} Quote
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-circleTel-darkNeutral mb-1">
              Your Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-circleTel-lightNeutral border border-transparent rounded-full focus:border-circleTel-orange focus:outline-none"
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-circleTel-darkNeutral mb-1">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-circleTel-lightNeutral border border-transparent rounded-full focus:border-circleTel-orange focus:outline-none"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="company" className="block text-sm font-medium text-circleTel-darkNeutral mb-1">
              Company Name *
            </label>
            <input
              type="text"
              id="company"
              name="company"
              value={formData.company}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-circleTel-lightNeutral border border-transparent rounded-full focus:border-circleTel-orange focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-circleTel-darkNeutral mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-circleTel-lightNeutral border border-transparent rounded-full focus:border-circleTel-orange focus:outline-none"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="employees" className="block text-sm font-medium text-circleTel-darkNeutral mb-1">
              Number of Employees
            </label>
            <select
              id="employees"
              name="employees"
              value={formData.employees}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-circleTel-lightNeutral border border-transparent rounded-full focus:border-circleTel-orange focus:outline-none"
            >
              <option value="">Select an option</option>
              <option value="1-5">1-5 (SOHO)</option>
              <option value="6-10">6-10 (Small)</option>
              <option value="11-30">11-30 (Growing)</option>
              <option value="31-100">31-100 (Mid-size)</option>
              <option value="100+">100+</option>
            </select>
          </div>

          <div>
            <label htmlFor="province" className="block text-sm font-medium text-circleTel-darkNeutral mb-1">
              Province
            </label>
            <select
              id="province"
              name="province"
              value={formData.province}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-circleTel-lightNeutral border border-transparent rounded-full focus:border-circleTel-orange focus:outline-none"
            >
              <option value="">Select Province</option>
              {provinces.map(province => (
                <option key={province} value={province}>{province}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="city" className="block text-sm font-medium text-circleTel-darkNeutral mb-1">
              City/Town
            </label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-circleTel-lightNeutral border border-transparent rounded-full focus:border-circleTel-orange focus:outline-none"
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="serviceInterest" className="block text-sm font-medium text-circleTel-darkNeutral mb-1">
            Primary Service Interest
          </label>
          <select
            id="serviceInterest"
            name="serviceInterest"
            value={formData.serviceInterest}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-circleTel-lightNeutral border border-transparent rounded-full focus:border-circleTel-orange focus:outline-none"
          >
            <option value="">Select your main interest</option>
            {serviceInterests.map(interest => (
              <option key={interest} value={interest}>{interest}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="challenges" className="block text-sm font-medium text-circleTel-darkNeutral mb-1">
            Current IT/Connectivity Challenges (Optional)
          </label>
          <textarea
            id="challenges"
            name="challenges"
            value={formData.challenges}
            onChange={handleChange}
            rows={3}
            placeholder="e.g., Unreliable internet, no IT support, power outages affecting work..."
            className="w-full px-4 py-2 bg-circleTel-lightNeutral border border-transparent rounded-lg focus:border-circleTel-orange focus:outline-none"
          ></textarea>
        </div>
        
        <Button
          type="submit"
          className="primary-button w-full"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting Quote Request...
            </>
          ) : (
            `Get ${bundleName} Quote`
          )}
        </Button>
        
        <p className="text-xs text-circleTel-secondaryNeutral text-center">
          Free consultation • No obligation • POPIA compliant
        </p>
      </form>
    </div>
  );
};

export default BundleQuoteForm;
