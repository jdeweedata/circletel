import React from 'react';
import { Check, Circle, Clock, Archive, FileText, Rocket, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Product, ProductStatus } from '@/lib/types/products';

interface ProductLifecycleStepperProps {
  product: Product;
  className?: string;
}

interface Step {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  status: 'completed' | 'current' | 'upcoming' | 'error';
}

export const ProductLifecycleStepper: React.FC<ProductLifecycleStepperProps> = ({
  product,
  className
}) => {
  const getSteps = (): Step[] => {
    const currentStatus = product.status;
    const isActive = product.is_active;

    // Determine lifecycle state
    let lifecycleState = 'draft';
    if (currentStatus === 'draft') lifecycleState = 'draft';
    else if (currentStatus === 'active' && isActive) lifecycleState = 'active';
    else if (currentStatus === 'active' && !isActive) lifecycleState = 'inactive'; // e.g. Out of stock or temporarily hidden
    else if (currentStatus === 'inactive') lifecycleState = 'inactive';
    else if (currentStatus === 'archived') lifecycleState = 'archived';

    return [
      {
        id: 'draft',
        label: 'Draft',
        description: 'Initial setup',
        icon: FileText,
        status: lifecycleState === 'draft' ? 'current' : 'completed'
      },
      {
        id: 'active',
        label: 'Active',
        description: 'Live in catalogue',
        icon: Rocket,
        status: lifecycleState === 'active' ? 'current' 
               : (lifecycleState === 'draft' ? 'upcoming' : 'completed')
      },
      {
        id: 'inactive',
        label: 'Inactive',
        description: 'Paused / Hidden',
        icon: Pause,
        status: lifecycleState === 'inactive' ? 'current'
               : (lifecycleState === 'archived' ? 'completed' : (lifecycleState === 'active' || lifecycleState === 'draft' ? 'upcoming' : 'upcoming'))
               // Logic: if currently active, inactive is upcoming. If currently archived, inactive was passed (conceptually)
               // A better simplified logic:
               // Draft -> Active -> Inactive -> Archived is a common flow, but Inactive <-> Active can cycle.
               // Let's treat "Inactive" as a state after Active but before Archive.
      },
      {
        id: 'archived',
        label: 'Archived',
        description: 'End of life',
        icon: Archive,
        status: lifecycleState === 'archived' ? 'current' : 'upcoming'
      }
    ];
  };

  const steps = getSteps();

  return (
    <div className={cn("w-full py-4", className)}>
      <nav aria-label="Progress">
        <ol role="list" className="overflow-hidden">
          <div className="relative md:flex md:flex-row md:justify-between">
            {steps.map((step, stepIdx) => {
              const isLastStep = stepIdx === steps.length - 1;
              
              return (
                <li key={step.id} className={cn("relative md:flex-1", !isLastStep ? "md:pr-8" : "")}>
                  {/* Connector Line */}
                  {!isLastStep && (
                    <div 
                      className={cn(
                        "absolute top-4 left-0 w-full h-0.5 hidden md:block", 
                        "ml-8 bg-gray-200", // Default gray
                        step.status === 'completed' ? "bg-circleTel-orange" : "" // Completed logic
                      )} 
                      aria-hidden="true" 
                    />
                  )}

                  <div className="group relative flex items-center md:flex-col md:items-start">
                    <span className="flex items-center px-6 py-4 text-sm font-medium md:px-0 md:py-0 md:flex-col md:items-start">
                      <span className={cn(
                        "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2",
                        step.status === 'completed' ? "bg-circleTel-orange border-circleTel-orange" :
                        step.status === 'current' ? "border-circleTel-orange bg-white" :
                        "border-gray-300 bg-white"
                      )}>
                        {step.status === 'completed' ? (
                          <Check className="h-5 w-5 text-white" aria-hidden="true" />
                        ) : (
                          <step.icon className={cn(
                            "h-4 w-4",
                            step.status === 'current' ? "text-circleTel-orange" : "text-gray-500"
                          )} />
                        )}
                      </span>
                      
                      <span className="ml-4 min-w-0 flex flex-col md:ml-0 md:mt-2">
                        <span className={cn(
                          "text-sm font-medium",
                          step.status === 'completed' ? "text-gray-900" :
                          step.status === 'current' ? "text-circleTel-orange" :
                          "text-gray-500"
                        )}>
                          {step.label}
                        </span>
                        <span className="text-xs text-gray-500">{step.description}</span>
                      </span>
                    </span>
                  </div>
                </li>
              );
            })}
          </div>
        </ol>
      </nav>
    </div>
  );
};
