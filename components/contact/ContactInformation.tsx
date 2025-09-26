
import React from 'react';
import { Phone, Mail, MapPin } from 'lucide-react';

interface ContactInformationProps {
  className?: string;
}

const ContactInformation: React.FC<ContactInformationProps> = ({ className }) => {
  return (
    <div className={`bg-white p-8 rounded-lg shadow-md mb-8 ${className || ''}`}>
      <h2 className="text-xl font-bold text-circleTel-darkNeutral mb-6">
        Contact Information
      </h2>
      
      <div className="space-y-4">
        <div className="flex items-start">
          <div className="bg-circleTel-lightNeutral rounded-full p-3 mr-3 text-circleTel-orange">
            <Phone size={20} />
          </div>
          <div>
            <h3 className="font-bold text-circleTel-darkNeutral">Phone</h3>
            <p className="text-circleTel-secondaryNeutral">087 087 6305</p>
          </div>
        </div>
        
        <div className="flex items-start">
          <div className="bg-circleTel-lightNeutral rounded-full p-3 mr-3 text-circleTel-orange">
            <Mail size={20} />
          </div>
          <div>
            <h3 className="font-bold text-circleTel-darkNeutral">Email</h3>
            <p className="text-circleTel-secondaryNeutral">contactus@circletel.co.za</p>
          </div>
        </div>
        
        <div className="flex items-start">
          <div className="bg-circleTel-lightNeutral rounded-full p-3 mr-3 text-circleTel-orange">
            <MapPin size={20} />
          </div>
          <div>
            <h3 className="font-bold text-circleTel-darkNeutral">Address</h3>
            <p className="text-circleTel-secondaryNeutral">
              West House, 7 Autumn Road<br />
              Rivonia, Johannesburg<br />
              2128<br />
              South Africa
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactInformation;
