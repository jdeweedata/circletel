'use client';

import React from 'react';
import { CheckCircle, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface OrderCreatedBannerProps {
  orderNumber: string;
  paymentReference?: string;
  customerEmail?: string;
  className?: string;
}

/**
 * OrderCreatedBanner - Shows order number immediately after order creation
 *
 * CX Improvement: Users see their order number before payment redirect,
 * allowing them to reference it if they need to contact support.
 */
export function OrderCreatedBanner({
  orderNumber,
  paymentReference,
  customerEmail,
  className,
}: OrderCreatedBannerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyOrderNumber = async () => {
    try {
      await navigator.clipboard.writeText(orderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy order number:', err);
    }
  };

  return (
    <div
      className={cn(
        'bg-green-50 border border-green-200 rounded-lg p-4 mb-6',
        'animate-in fade-in slide-in-from-top-2 duration-300',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 p-1.5 bg-green-100 rounded-full">
          <CheckCircle className="w-5 h-5 text-green-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-green-900 mb-1">
            Order Created Successfully
          </h3>

          {/* Order Number with Copy Button */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-green-700">Order Number:</span>
            <code className="px-2 py-1 bg-green-100 rounded text-sm font-mono font-bold text-green-900">
              {orderNumber}
            </code>
            <button
              type="button"
              onClick={handleCopyOrderNumber}
              className="p-1 hover:bg-green-200 rounded transition-colors"
              aria-label={copied ? 'Copied!' : 'Copy order number'}
              title={copied ? 'Copied!' : 'Copy order number'}
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 text-green-600" />
              )}
            </button>
          </div>

          {/* Payment Reference */}
          {paymentReference && (
            <p className="text-xs text-green-700 mb-2">
              Payment Reference: <span className="font-mono font-medium">{paymentReference}</span>
            </p>
          )}

          {/* Email Confirmation Notice */}
          {customerEmail && (
            <p className="text-xs text-green-700">
              Confirmation will be sent to <span className="font-medium">{customerEmail}</span>
            </p>
          )}

          {/* Keep for Records Notice */}
          <p className="text-xs text-green-600 mt-2 italic">
            Keep this order number for your records. You can reference it if you need support.
          </p>
        </div>
      </div>
    </div>
  );
}

export default OrderCreatedBanner;
