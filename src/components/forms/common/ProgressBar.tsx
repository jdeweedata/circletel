import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  progress: number; // 0-100
  className?: string;
}

export function ProgressBar({ progress, className }: ProgressBarProps) {
  return (
    <div className={cn("w-full bg-gray-200 rounded-full h-8 mb-6 overflow-hidden", className)}>
      <div
        className="h-full bg-gradient-to-r from-circleTel-orange to-orange-600 rounded-full flex items-center justify-center text-white font-semibold text-sm transition-all duration-300 ease-out"
        style={{ width: `${Math.max(progress, 0)}%` }}
      >
        {progress > 10 && `${Math.round(progress)}% Complete`}
      </div>
    </div>
  );
}