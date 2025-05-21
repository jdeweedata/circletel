
import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Cloud } from 'lucide-react';

interface QuickActionsProps {
  className?: string;
}

const QuickActions: React.FC<QuickActionsProps> = ({ className }) => {
  return (
    <div className={`mt-8 flex flex-col space-y-4 ${className || ''}`}>
      <h3 className="font-bold text-circleTel-darkNeutral">Quick Actions</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Button variant="outline" className="flex items-center justify-center gap-2">
          <Calendar size={18} />
          <span>Schedule Consultation</span>
        </Button>
        <Button variant="outline" className="flex items-center justify-center gap-2">
          <MapPin size={18} />
          <span>Request Site Survey</span>
        </Button>
        <Button variant="outline" className="flex items-center justify-center gap-2">
          <Cloud size={18} />
          <span>Get Cloud Quote</span>
        </Button>
      </div>
    </div>
  );
};

export default QuickActions;
