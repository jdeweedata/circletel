import React from 'react';
import { cn } from '@/lib/utils';

interface FormSectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

export function FormSection({ title, subtitle, children, className, icon }: FormSectionProps) {
  return (
    <div className={cn("mb-8 p-6 bg-gray-50 rounded-xl border border-gray-200", className)}>
      <div className="flex items-center mb-6">
        {icon && <div className="mr-3 text-blue-600">{icon}</div>}
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-blue-600 border-b-2 border-blue-600 pb-2 mb-2 flex items-center">
            <div className="w-1 h-6 bg-purple-600 rounded mr-3"></div>
            {title}
          </h2>
          {subtitle && <p className="text-gray-600 text-sm">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}