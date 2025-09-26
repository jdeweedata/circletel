
import React from 'react';
import ContactFormRenderer from './ContactFormRenderer';
import { useContactForm } from '@/hooks/useContactForm';

interface ContactFormProps {
  className?: string;
}

const ContactForm: React.FC<ContactFormProps> = ({ className }) => {
  const {
    formData,
    formSubmitted,
    handleChange,
    handleServiceChange,
    handleSubmit
  } = useContactForm();

  return (
    <ContactFormRenderer
      formData={formData}
      formSubmitted={formSubmitted}
      handleChange={handleChange}
      handleServiceChange={handleServiceChange}
      handleSubmit={handleSubmit}
      className={className}
    />
  );
};

export default ContactForm;
