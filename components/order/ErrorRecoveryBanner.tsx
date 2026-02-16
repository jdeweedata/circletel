'use client';

import React from 'react';
import {
  AlertCircle,
  RefreshCw,
  CreditCard,
  Save,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CONTACT, getWhatsAppLink } from '@/lib/constants/contact';

export type ErrorType =
  | 'payment_failed'
  | 'card_declined'
  | 'network_error'
  | 'order_creation_failed'
  | 'validation_error'
  | 'timeout'
  | 'unknown';

interface ErrorRecoveryAction {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
}

interface ErrorRecoveryBannerProps {
  error: string;
  errorType?: ErrorType;
  orderNumber?: string;
  retryCount?: number;
  onRetry?: () => void;
  onContactSupport?: () => void;
  onSaveForLater?: () => void;
  onGoBack?: () => void;
  className?: string;
  showDetails?: boolean;
}

// Error type to user-friendly message mapping
const ERROR_MESSAGES: Record<ErrorType, { title: string; description: string }> = {
  payment_failed: {
    title: 'Payment Could Not Be Processed',
    description: 'Your payment was declined or could not be completed. This can happen for various reasons.',
  },
  card_declined: {
    title: 'Card Declined',
    description: 'Your card was declined by your bank. Please check your card details or try a different card.',
  },
  network_error: {
    title: 'Connection Problem',
    description: 'We couldn\'t connect to the payment server. Please check your internet connection and try again.',
  },
  order_creation_failed: {
    title: 'Order Could Not Be Created',
    description: 'There was a problem creating your order. Your payment has not been processed.',
  },
  validation_error: {
    title: 'Missing Information',
    description: 'Some required information is missing. Please go back and complete all required fields.',
  },
  timeout: {
    title: 'Request Timed Out',
    description: 'The request took too long to complete. Please try again.',
  },
  unknown: {
    title: 'Something Went Wrong',
    description: 'An unexpected error occurred. Please try again or contact support if the problem persists.',
  },
};

// Detect error type from error message
function detectErrorType(error: string): ErrorType {
  const errorLower = error.toLowerCase();

  if (errorLower.includes('declined') || errorLower.includes('insufficient funds')) {
    return 'card_declined';
  }
  if (errorLower.includes('network') || errorLower.includes('fetch') || errorLower.includes('connection')) {
    return 'network_error';
  }
  if (errorLower.includes('timeout') || errorLower.includes('timed out')) {
    return 'timeout';
  }
  if (errorLower.includes('missing') || errorLower.includes('required') || errorLower.includes('validation')) {
    return 'validation_error';
  }
  if (errorLower.includes('order') && (errorLower.includes('create') || errorLower.includes('failed'))) {
    return 'order_creation_failed';
  }
  if (errorLower.includes('payment')) {
    return 'payment_failed';
  }

  return 'unknown';
}

/**
 * ErrorRecoveryBanner - Actionable error recovery with specific guidance
 *
 * CX Improvement: Instead of generic error messages, provides users with
 * clear next steps and multiple recovery options.
 */
export function ErrorRecoveryBanner({
  error,
  errorType: providedErrorType,
  orderNumber,
  retryCount = 0,
  onRetry,
  onContactSupport,
  onSaveForLater,
  onGoBack,
  className,
  showDetails = false,
}: ErrorRecoveryBannerProps) {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(showDetails);

  // Detect error type if not provided
  const errorType = providedErrorType || detectErrorType(error);
  const errorInfo = ERROR_MESSAGES[errorType];

  // Build action buttons based on error type
  const actions: ErrorRecoveryAction[] = [];

  // Primary action: Retry (for most errors)
  if (onRetry && errorType !== 'validation_error') {
    actions.push({
      id: 'retry',
      label: retryCount > 0 ? `Try Again (Attempt ${retryCount + 1})` : 'Try Again',
      description: 'Attempt the payment again',
      icon: <RefreshCw className="w-4 h-4" />,
      onClick: onRetry,
      variant: 'primary',
      disabled: retryCount >= 3, // Max 3 retries
    });
  }

  // Go back (for validation errors)
  if (onGoBack && (errorType === 'validation_error' || errorType === 'order_creation_failed')) {
    actions.push({
      id: 'goback',
      label: 'Go Back & Fix',
      description: 'Return to the previous step',
      icon: <CreditCard className="w-4 h-4" />,
      onClick: onGoBack,
      variant: 'primary',
    });
  }

  // Save for later (if order was created)
  if (onSaveForLater && orderNumber) {
    actions.push({
      id: 'save',
      label: 'Save & Pay Later',
      description: 'We\'ll email you a link to complete payment',
      icon: <Save className="w-4 h-4" />,
      onClick: onSaveForLater,
      variant: 'secondary',
    });
  }

  // Contact support (always available)
  if (onContactSupport) {
    actions.push({
      id: 'support',
      label: 'Contact Support',
      description: 'Get help from our team',
      icon: <FaWhatsapp className="w-4 h-4" />,
      onClick: onContactSupport,
      variant: 'outline',
    });
  }

  return (
    <div
      className={cn(
        'bg-red-50 border border-red-200 rounded-lg overflow-hidden',
        'animate-in fade-in slide-in-from-top-2 duration-300',
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 p-1.5 bg-red-100 rounded-full">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-red-900 mb-1">
              {errorInfo.title}
            </h3>
            <p className="text-sm text-red-700">
              {errorInfo.description}
            </p>

            {/* Order reference if available */}
            {orderNumber && (
              <p className="text-xs text-red-600 mt-2">
                Order Reference: <span className="font-mono font-medium">{orderNumber}</span>
              </p>
            )}

            {/* Retry count warning */}
            {retryCount >= 2 && (
              <p className="text-xs text-red-600 mt-2 font-medium">
                Multiple attempts failed. Consider contacting support or trying a different payment method.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {actions.length > 0 && (
        <div className="px-4 pb-4">
          <div className="flex flex-col sm:flex-row gap-2">
            {actions.map((action) => (
              <Button
                key={action.id}
                type="button"
                onClick={action.onClick}
                disabled={action.disabled}
                variant={action.variant === 'primary' ? 'default' : action.variant === 'secondary' ? 'secondary' : 'outline'}
                size="sm"
                className={cn(
                  'flex items-center gap-2',
                  action.variant === 'primary' && 'bg-red-600 hover:bg-red-700 text-white',
                  action.variant === 'secondary' && 'bg-red-100 hover:bg-red-200 text-red-900 border-red-200',
                  action.variant === 'outline' && 'border-red-300 text-red-700 hover:bg-red-50'
                )}
              >
                {action.icon}
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Technical Details (Collapsible) */}
      <div className="border-t border-red-200">
        <button
          type="button"
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="w-full px-4 py-2 flex items-center justify-between text-xs text-red-600 hover:bg-red-100/50 transition-colors"
        >
          <span>Technical Details</span>
          {showTechnicalDetails ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        {showTechnicalDetails && (
          <div className="px-4 pb-3 pt-1">
            <div className="bg-red-100/50 rounded p-3">
              <p className="text-xs font-mono text-red-800 break-all">
                {error}
              </p>
              {retryCount > 0 && (
                <p className="text-xs text-red-600 mt-2">
                  Retry attempts: {retryCount}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick Help Links */}
      <div className="bg-red-100/30 px-4 py-3 border-t border-red-200">
        <p className="text-xs text-red-700 mb-2 font-medium">Quick Help:</p>
        <div className="flex flex-wrap gap-3 text-xs">
          <a
            href={getWhatsAppLink('Hi, I need help with my order')}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[#25D366] hover:text-[#128C7E] hover:underline"
          >
            <FaWhatsapp className="w-3 h-3" />
            {CONTACT.WHATSAPP_NUMBER}
          </a>
          <a
            href="mailto:contactus@circletel.co.za"
            className="flex items-center gap-1 text-red-700 hover:text-red-900 hover:underline"
          >
            <ExternalLink className="w-3 h-3" />
            contactus@circletel.co.za
          </a>
        </div>
      </div>
    </div>
  );
}

export default ErrorRecoveryBanner;
