
import React from 'react';
import { CheckCircle } from 'lucide-react';

interface SupportHoursProps {
  className?: string;
}

const SupportHours: React.FC<SupportHoursProps> = ({ className }) => {
  return (
    <div className={`bg-white p-8 rounded-lg shadow-md ${className || ''}`}>
      <h2 className="text-xl font-bold text-circleTel-darkNeutral mb-6">
        Our Support Hours
      </h2>
      
      <div className="space-y-4">
        <div className="flex justify-between">
          <span className="font-bold text-circleTel-darkNeutral">Monday - Friday:</span>
          <span className="text-circleTel-secondaryNeutral">08:00 AM - 17:00 PM</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold text-circleTel-darkNeutral">Saturday:</span>
          <span className="text-circleTel-secondaryNeutral">Closed</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold text-circleTel-darkNeutral">Sunday:</span>
          <span className="text-circleTel-secondaryNeutral">Closed</span>
        </div>
        <div className="pt-4 border-t">
          <p className="text-circleTel-secondaryNeutral">
            <CheckCircle className="inline-block text-circleTel-orange mr-2" size={16} />
            24/7 emergency support available for business clients
          </p>
        </div>
      </div>
    </div>
  );
};

export default SupportHours;
