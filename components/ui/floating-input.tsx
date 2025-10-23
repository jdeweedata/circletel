'use client';

import React, { useState, forwardRef, InputHTMLAttributes } from 'react';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FloatingInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  isDisabled?: boolean;
  showLockIcon?: boolean;
}

export const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ label, error, className, isDisabled = false, showLockIcon = false, required, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(!!props.value || !!props.defaultValue);

    const isActive = isFocused || hasValue || props.placeholder !== ' ';

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      setHasValue(!!e.target.value);
      props.onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(!!e.target.value);
      props.onChange?.(e);
    };

    return (
      <div className="relative w-full">
        <input
          ref={ref}
          {...props}
          disabled={isDisabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          className={cn(
            'w-full h-14 px-3 pt-4 pb-2',
            'border rounded-lg',
            'text-[#1E4B85] text-base',
            'transition-all duration-200',
            'placeholder-transparent',
            isDisabled
              ? 'bg-gray-50 border-gray-200 cursor-not-allowed text-gray-500'
              : error
              ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100'
              : 'border-[#CDD6F4] focus:border-[#1E4B85] focus:ring-2 focus:ring-blue-50',
            'focus:outline-none',
            showLockIcon && 'pr-10',
            className
          )}
        />

        {/* Floating Label */}
        <label
          className={cn(
            'absolute left-3 transition-all duration-200 pointer-events-none',
            'bg-white px-1',
            isActive
              ? 'top-[-8px] text-xs'
              : 'top-4 text-base',
            error
              ? 'text-red-600'
              : isActive
              ? 'text-[#1E4B85]'
              : 'text-gray-500'
          )}
        >
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>

        {/* Lock Icon for disabled fields */}
        {showLockIcon && isDisabled && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Lock className="w-4 h-4 text-gray-400" />
          </div>
        )}

        {/* Error Message */}
        {error && (
          <p className="text-red-600 text-xs mt-1 ml-1">{error}</p>
        )}
      </div>
    );
  }
);

FloatingInput.displayName = 'FloatingInput';
