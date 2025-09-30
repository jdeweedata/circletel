"use client";

import React from 'react';
import { cn } from '@/lib/utils';

export interface TabOption {
  value: string;
  label: string;
}

export interface TabSelectorProps {
  options: TabOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function TabSelector({ options, value, onChange, className }: TabSelectorProps) {
  return (
    <div className={cn(
      "inline-flex rounded-lg border border-circleTel-lightNeutral bg-circleTel-lightNeutral/30 p-1",
      className
    )}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "relative px-4 py-2 text-sm font-medium transition-all duration-200 rounded-md",
            "hover:bg-white/50",
            value === option.value
              ? "bg-white text-circleTel-darkNeutral shadow-sm"
              : "text-circleTel-secondaryNeutral hover:text-circleTel-darkNeutral"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export default TabSelector;