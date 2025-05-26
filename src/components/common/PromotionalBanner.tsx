
import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

type PromotionalBannerProps = {
  onClose?: () => void;
  showCloseButton?: boolean;
  className?: string;
}

const PromotionalBanner = ({ onClose, showCloseButton = true, className = "" }: PromotionalBannerProps) => {
  return (
    <div className={`bg-gradient-to-r from-circleTel-orange to-orange-500 text-white p-4 ${className}`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 text-center">
            <p className="font-bold text-lg">
              🎉 Limited Time: First Month FREE on All Services!
            </p>
            <p className="text-sm mt-1">
              Sign up by September 30, 2025 • Free FWA installation with 12-month contract
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              asChild 
              className="bg-white text-circleTel-orange hover:bg-gray-100 font-bold rounded-full"
            >
              <Link to="/contact">
                Claim Offer
              </Link>
            </Button>
            
            {showCloseButton && onClose && (
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 p-1"
                aria-label="Close promotional banner"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromotionalBanner;
