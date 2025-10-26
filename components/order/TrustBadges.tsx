'use client';

import React from 'react';
import { Shield, Lock, CreditCard, CheckCircle2 } from 'lucide-react';

interface TrustBadgesProps {
  variant?: 'default' | 'compact' | 'payment';
  className?: string;
}

export function TrustBadges({ variant = 'default', className = '' }: TrustBadgesProps) {
  if (variant === 'compact') {
    return (
      <div className={`flex items-center justify-center gap-3 text-sm text-gray-600 ${className}`}>
        <div className="flex items-center gap-1.5">
          <Lock className="w-4 h-4 text-green-600" />
          <span className="font-medium">Secure checkout</span>
        </div>
        <span className="text-gray-300">•</span>
        <div className="flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-blue-600" />
          <span className="font-medium">POPIA compliant</span>
        </div>
      </div>
    );
  }

  if (variant === 'payment') {
    return (
      <div className={`space-y-3 ${className}`}>
        {/* Trust Messages */}
        <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-green-600" />
            <span>Secure checkout</span>
          </div>
          <span className="text-gray-300">•</span>
          <div className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-blue-600" />
            <span>POPIA compliant</span>
          </div>
        </div>

        {/* Payment Badges */}
        <div className="flex items-center justify-center gap-3 py-3 bg-gray-50 rounded-lg border border-gray-200">
          <span className="text-xs text-gray-500 font-medium">Secured by:</span>
          
          {/* Netcash Logo (Text-based for now) */}
          <div className="px-3 py-1 bg-white border border-gray-200 rounded font-bold text-sm text-gray-700">
            Netcash
          </div>

          {/* Payment Methods */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-6 bg-gradient-to-r from-blue-600 to-blue-700 rounded flex items-center justify-center">
              <span className="text-white text-[8px] font-bold">VISA</span>
            </div>
            <div className="w-10 h-6 bg-gradient-to-r from-orange-600 to-red-600 rounded flex items-center justify-center">
              <span className="text-white text-[8px] font-bold">MC</span>
            </div>
            <CreditCard className="w-5 h-5 text-gray-400" />
          </div>
        </div>

        {/* Additional Trust Line */}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          <CheckCircle2 className="w-3 h-3 text-green-600" />
          <span>256-bit SSL encryption • Your data is safe with us</span>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <Shield className="w-5 h-5 text-green-600" />
        </div>
        <div className="flex-1 space-y-2">
          <h4 className="font-semibold text-green-900 text-sm">Secure & Private</h4>
          <ul className="space-y-1 text-xs text-green-800">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3" />
              <span>Your data is encrypted and secure</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3" />
              <span>POPIA compliant data handling</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3" />
              <span>We never share your information</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
