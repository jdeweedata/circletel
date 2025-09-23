import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

// Basic Input Field
interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  required?: boolean;
  error?: string;
  tooltip?: string;
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, required, error, tooltip, className, ...props }, ref) => {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
          {tooltip && (
            <span className="ml-2 group relative">
              <span className="inline-flex items-center justify-center w-4 h-4 bg-gray-500 text-white rounded-full text-xs cursor-help">?</span>
              <span className="invisible group-hover:visible absolute z-10 w-64 p-2 mt-1 text-xs text-white bg-gray-800 rounded-md shadow-lg">
                {tooltip}
              </span>
            </span>
          )}
        </label>
        <input
          ref={ref}
          className={cn(
            "w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-circleTel-orange focus:ring-2 focus:ring-orange-200 transition-all duration-200",
            error && "border-red-500",
            className
          )}
          {...props}
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>
    );
  }
);

InputField.displayName = 'InputField';

// Select Field
interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  required?: boolean;
  error?: string;
  tooltip?: string;
  options: Array<{ value: string; label: string; group?: string }>;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, required, error, tooltip, options, className, ...props }, ref) => {
    // Group options by group property
    const groupedOptions = options.reduce((acc, option) => {
      const group = option.group || 'default';
      if (!acc[group]) acc[group] = [];
      acc[group].push(option);
      return acc;
    }, {} as Record<string, typeof options>);

    return (
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
          {tooltip && (
            <span className="ml-2 group relative">
              <span className="inline-flex items-center justify-center w-4 h-4 bg-gray-500 text-white rounded-full text-xs cursor-help">?</span>
              <span className="invisible group-hover:visible absolute z-10 w-64 p-2 mt-1 text-xs text-white bg-gray-800 rounded-md shadow-lg">
                {tooltip}
              </span>
            </span>
          )}
        </label>
        <select
          ref={ref}
          className={cn(
            "w-full px-4 py-3 pr-10 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-circleTel-orange focus:ring-2 focus:ring-orange-200 transition-all duration-200 bg-white appearance-none",
            error && "border-red-500",
            className
          )}
          style={{
            backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 10px center',
            backgroundSize: '20px'
          }}
          {...props}
        >
          <option value="">Select {label}...</option>
          {Object.entries(groupedOptions).map(([groupName, groupOptions]) => {
            if (groupName === 'default') {
              return groupOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ));
            }
            return (
              <optgroup key={groupName} label={groupName}>
                {groupOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </optgroup>
            );
          })}
        </select>
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>
    );
  }
);

SelectField.displayName = 'SelectField';

// Textarea Field
interface TextareaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  required?: boolean;
  error?: string;
  tooltip?: string;
}

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  ({ label, required, error, tooltip, className, ...props }, ref) => {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
          {tooltip && (
            <span className="ml-2 group relative">
              <span className="inline-flex items-center justify-center w-4 h-4 bg-gray-500 text-white rounded-full text-xs cursor-help">?</span>
              <span className="invisible group-hover:visible absolute z-10 w-64 p-2 mt-1 text-xs text-white bg-gray-800 rounded-md shadow-lg">
                {tooltip}
              </span>
            </span>
          )}
        </label>
        <textarea
          ref={ref}
          className={cn(
            "w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-circleTel-orange focus:ring-2 focus:ring-orange-200 transition-all duration-200 resize-y min-h-[100px]",
            error && "border-red-500",
            className
          )}
          {...props}
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>
    );
  }
);

TextareaField.displayName = 'TextareaField';

// Radio Group
interface RadioOption {
  value: string;
  label: string;
}

interface RadioGroupProps {
  label: string;
  name: string;
  options: RadioOption[];
  value?: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  tooltip?: string;
}

export function RadioGroup({ label, name, options, value, onChange, required, error, tooltip }: RadioGroupProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        {tooltip && (
          <span className="ml-2 group relative">
            <span className="inline-flex items-center justify-center w-4 h-4 bg-gray-500 text-white rounded-full text-xs cursor-help">?</span>
            <span className="invisible group-hover:visible absolute z-10 w-64 p-2 mt-1 text-xs text-white bg-gray-800 rounded-md shadow-lg">
              {tooltip}
            </span>
          </span>
        )}
      </label>
      <div className="flex flex-wrap gap-3">
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              "flex items-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer transition-all duration-200 hover:border-circleTel-orange hover:bg-orange-50",
              value === option.value && "border-circleTel-orange bg-orange-50"
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange(e.target.value)}
              className="mr-2 text-circleTel-orange"
            />
            <span className={cn("text-sm", value === option.value && "text-circleTel-orange font-semibold")}>
              {option.label}
            </span>
          </label>
        ))}
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
}