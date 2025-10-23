'use client';

import React, { useState } from 'react';
import { X, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InfoTooltipModalProps {
  title: string;
  description: string;
  triggerClassName?: string;
}

/**
 * InfoTooltipModal Component
 *
 * Small info icon button that opens a modal with detailed information.
 * Inspired by WebAfrica's benefit tooltips.
 *
 * Features:
 * - Circular info icon button (blue)
 * - Modal overlay with title + description
 * - Close button (X in top-right)
 * - Backdrop click to close
 * - Keyboard accessible (Escape to close)
 *
 * @example
 * ```tsx
 * <InfoTooltipModal
 *   title="Free set-up worth R1699"
 *   description="We'll cover your set-up fee on your behalf. You're welcome! If your Fibre is not installed and activated within 14 (MDU) / 21 (SDU) days, we will credit your account with R999. T&Cs apply."
 * />
 * ```
 */
export function InfoTooltipModal({
  title,
  description,
  triggerClassName,
}: InfoTooltipModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  // Close on Escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeModal();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          openModal();
        }}
        className={cn(
          'inline-flex items-center justify-center',
          'w-5 h-5 rounded-full',
          'bg-blue-100 hover:bg-blue-200',
          'text-blue-600 hover:text-blue-700',
          'transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
          triggerClassName
        )}
        aria-label={`More information about ${title}`}
      >
        <Info className="w-3.5 h-3.5" aria-hidden="true" />
      </button>

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />

          {/* Modal Content */}
          <div
            className={cn(
              'relative bg-white rounded-2xl shadow-2xl',
              'max-w-md w-full',
              'p-6',
              'animate-in fade-in-0 zoom-in-95 duration-200'
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={closeModal}
              className={cn(
                'absolute top-4 right-4',
                'w-8 h-8 rounded-full',
                'flex items-center justify-center',
                'bg-gray-100 hover:bg-gray-200',
                'text-gray-600 hover:text-gray-800',
                'transition-colors duration-200',
                'focus:outline-none focus:ring-2 focus:ring-gray-400'
              )}
              aria-label="Close modal"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>

            {/* Title */}
            <h3
              id="modal-title"
              className="text-lg font-bold text-gray-900 pr-8 mb-3"
            >
              {title}
            </h3>

            {/* Description */}
            <p className="text-sm text-gray-700 leading-relaxed">
              {description}
            </p>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * InfoTooltipButton Component
 *
 * Standalone info button without modal functionality.
 * Useful for custom modal implementations.
 */
export interface InfoTooltipButtonProps {
  onClick: () => void;
  className?: string;
  'aria-label'?: string;
}

export function InfoTooltipButton({
  onClick,
  className,
  'aria-label': ariaLabel,
}: InfoTooltipButtonProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        'inline-flex items-center justify-center',
        'w-5 h-5 rounded-full',
        'bg-blue-100 hover:bg-blue-200',
        'text-blue-600 hover:text-blue-700',
        'transition-colors duration-200',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        className
      )}
      aria-label={ariaLabel || 'More information'}
    >
      <Info className="w-3.5 h-3.5" aria-hidden="true" />
    </button>
  );
}
