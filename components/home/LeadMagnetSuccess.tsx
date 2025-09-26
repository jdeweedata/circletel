'use client';

import React from 'react';
import { Button } from '@/components/ui/button';

interface LeadMagnetSuccessProps {
  onReset: () => void;
}

const LeadMagnetSuccess: React.FC<LeadMagnetSuccessProps> = ({ onReset }) => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-circleTel-orange rounded-full text-white mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-2">Thank You!</h3>
      <p className="text-circleTel-secondaryNeutral mb-4">
        Your IT assessment request has been submitted successfully. Our team will contact you shortly with your customized IT health recipe.
      </p>
      <Button
        onClick={onReset}
        variant="outline"
        className="mt-2"
      >
        Submit Another Request
      </Button>
    </div>
  );
};

export default LeadMagnetSuccess;