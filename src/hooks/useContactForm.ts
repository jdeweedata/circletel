
import { useState } from 'react';
import { toast } from "@/hooks/use-toast";

interface FormData {
  name: string;
  email: string;
  serviceInterest: string;
}

export const useContactForm = () => {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState<FormData>({
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

  return {
    formData,
    formSubmitted,
    handleChange,
    handleServiceChange,
    handleSubmit
  };
};
