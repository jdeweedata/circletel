
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle } from 'lucide-react';

interface ContactFormRendererProps {
  formData: {
    name: string;
    email: string;
    serviceInterest: string;
  };
  formSubmitted: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleServiceChange: (value: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  className?: string;
}

const ContactFormRenderer: React.FC<ContactFormRendererProps> = ({
  formData,
  formSubmitted,
  handleChange,
  handleServiceChange,
  handleSubmit,
  className
}) => {
  return (
    <div className={`bg-white p-8 rounded-lg shadow-md ${className || ''}`}>
      <h2 className="text-xl font-bold text-circleTel-darkNeutral mb-6">
        Get in Touch
      </h2>
      
      {formSubmitted ? (
        <SuccessMessage />
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-6">
            <FormField
              id="name"
              label="Your Name"
              type="text"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
            />
            
            <FormField
              id="email"
              label="Email Address"
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={handleChange}
            />
            
            <ServiceSelectField 
              value={formData.serviceInterest}
              onChange={handleServiceChange}
            />
            
            <Button type="submit" className="primary-button w-full">
              Send Message
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

const SuccessMessage: React.FC = () => (
  <div className="bg-green-50 border border-green-200 rounded-md p-6 text-center">
    <CheckCircle className="mx-auto text-green-500 mb-3" size={40} />
    <h3 className="text-lg font-bold text-green-800 mb-2">Thank You!</h3>
    <p className="text-green-700">
      We've received your message and will get back to you within 24 hours.
    </p>
  </div>
);

interface FormFieldProps {
  id: string;
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const FormField: React.FC<FormFieldProps> = ({
  id, label, type, placeholder, value, onChange
}) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-circleTel-darkNeutral mb-1">
      {label}
    </label>
    <Input 
      id={id}
      type={type}
      placeholder={placeholder}
      className="w-full rounded-md"
      required
      value={value}
      onChange={onChange}
    />
  </div>
);

interface ServiceSelectFieldProps {
  value: string;
  onChange: (value: string) => void;
}

const ServiceSelectField: React.FC<ServiceSelectFieldProps> = ({ value, onChange }) => (
  <div>
    <label htmlFor="serviceInterest" className="block text-sm font-medium text-circleTel-darkNeutral mb-1">
      Service Interest
    </label>
    <Select onValueChange={onChange} value={value}>
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
);

export default ContactFormRenderer;
