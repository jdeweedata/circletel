
import React from 'react';
import { Mail, MapPin } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { CONTACT, getWhatsAppLink } from '@/lib/constants/contact';

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
        <a
          href={getWhatsAppLink()}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start hover:opacity-80 transition-opacity"
        >
          <div className="bg-[#25D366]/10 rounded-full p-3 mr-3 text-[#25D366]">
            <FaWhatsapp size={20} />
          </div>
          <div>
            <h3 className="font-bold text-circleTel-darkNeutral">WhatsApp</h3>
            <p className="text-circleTel-secondaryNeutral">{CONTACT.WHATSAPP_NUMBER}</p>
          </div>
        </a>
        
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
