'use client';

import React, { useState } from 'react';
import { Info, HelpCircle } from 'lucide-react';
import { Input } from './input';
import { Label } from './label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';

interface InputWithHelpProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  helpText?: string;
  error?: string;
  showRequired?: boolean;
  tooltipContent?: string;
  fieldId: string;
}

export const InputWithHelp = React.forwardRef<HTMLInputElement, InputWithHelpProps>(
  ({ 
    label, 
    helpText, 
    error, 
    showRequired = false,
    tooltipContent,
    fieldId,
    ...props 
  }, ref) => {
    return (
      <div className="space-y-2">
        {/* Label with Tooltip */}
        <div className="flex items-center gap-2">
          <Label htmlFor={fieldId} className="text-sm font-medium text-gray-700">
            {label}
            {showRequired && <span className="text-red-600 ml-1">*</span>}
          </Label>
          
          {tooltipContent && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={`Help for ${label}`}
                  >
                    <HelpCircle className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">{tooltipContent}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Input Field */}
        <Input
          id={fieldId}
          ref={ref}
          aria-describedby={helpText ? `${fieldId}-help` : undefined}
          aria-invalid={error ? 'true' : 'false'}
          className={error ? 'border-red-500 focus:ring-red-500' : ''}
          {...props}
        />

        {/* Help Text */}
        {helpText && !error && (
          <div className="flex items-start gap-2 text-xs text-gray-600" id={`${fieldId}-help`}>
            <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <span>{helpText}</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <p className="text-xs text-red-600 font-medium" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

InputWithHelp.displayName = 'InputWithHelp';
