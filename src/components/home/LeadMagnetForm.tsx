
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

type FormData = {
  name: string;
  email: string;
  company: string;
  phone: string;
  employees: string;
  challenges: string;
  assessmentType: string;
}

const LeadMagnetForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    company: '',
    phone: '',
    employees: '',
    challenges: '',
    assessmentType: 'comprehensive'
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      console.log('Submitting form data:', formData);
      
      const { data, error } = await supabase.functions.invoke('zoho-crm', {
        body: formData
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
        title: "Success!",
        description: "Your free IT health recipe will be emailed to you shortly.",
      });
      
      setFormData({
        name: '',
        email: '',
        company: '',
        phone: '',
        employees: '',
        challenges: '',
        assessmentType: 'comprehensive'
      });
      
      onSuccess();
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Submission Error",
        description: "There was a problem processing your request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-lg">
      <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-4">Request Your Assessment</h3>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-circleTel-darkNeutral mb-1">
            Your Name
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
            Email Address
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
        
        <div>
          <label htmlFor="company" className="block text-sm font-medium text-circleTel-darkNeutral mb-1">
            Company Name
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
            Phone Number (Optional)
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
            <option value="1-10">1-10</option>
            <option value="11-50">11-50</option>
            <option value="51-200">51-200</option>
            <option value="201+">201+</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="challenges" className="block text-sm font-medium text-circleTel-darkNeutral mb-1">
            Current IT Challenges (Optional)
          </label>
          <textarea
            id="challenges"
            name="challenges"
            value={formData.challenges}
            onChange={handleChange}
            rows={3}
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
              Processing...
            </>
          ) : (
            "Claim Your Free Recipe"
          )}
        </Button>
        
        <p className="text-xs text-circleTel-secondaryNeutral text-center">
          We respect your privacy. Your information will never be shared.
        </p>
      </div>
    </form>
  );
};

export default LeadMagnetForm;
