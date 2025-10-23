'use client';

import React, { useState, ReactNode } from 'react';
import { ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollapsibleSectionProps {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
  titleClassName?: string;
}

export function CollapsibleSection({
  title,
  description,
  defaultOpen = true,
  children,
  className,
  titleClassName,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={cn('mb-6', className)}>
      {/* Header - Clickable */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-white rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
        type="button"
      >
        <div className="text-left">
          <h3 className={cn(
            'text-circleTel-orange font-bold text-lg',
            titleClassName
          )}>
            {title}
          </h3>
          {description && (
            <p className="text-gray-600 text-sm mt-1">{description}</p>
          )}
        </div>
        <ChevronUp
          className={cn(
            'w-5 h-5 text-circleTel-orange transition-transform duration-200 flex-shrink-0 ml-4',
            !isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Content - Collapsible */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-300',
          isOpen ? 'max-h-[2000px] opacity-100 mt-4' : 'max-h-0 opacity-0'
        )}
      >
        <div className="px-4">
          {children}
        </div>
      </div>
    </div>
  );
}
