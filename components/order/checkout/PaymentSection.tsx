'use client';

import { Button } from '@/components/ui/button';

interface PaymentSectionProps {
  monthlyPrice: number;
  packageName: string;
  onProceed: () => Promise<void>;
  isProcessing: boolean;
  errorMessage?: string;
}

export function PaymentSection({
  monthlyPrice,
  packageName,
  onProceed,
  isProcessing,
  errorMessage,
}: PaymentSectionProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment</h2>

      {/* Validation banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <span className="text-amber-600 text-lg">✓</span>
          <div>
            <p className="font-semibold text-amber-800">VALIDATION ONLY — R1.00</p>
            <p className="text-sm text-amber-700">
              Your first bill of R{monthlyPrice}/month will be processed after activation.
            </p>
          </div>
        </div>
      </div>

      {/* Payment method */}
      <div className="border-2 border-orange-500 bg-orange-50 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center">
              <span className="text-white text-xs">💳</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">Credit or Debit Card</p>
              <p className="text-xs text-gray-500">Visa, Mastercard — 3D Secure</p>
            </div>
          </div>
          <div className="text-green-500">✓</div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-6 text-xs text-blue-700">
        Clicking &quot;Proceed to Payment&quot; will redirect you to NetCash&apos;s secure payment gateway
        to complete the R1.00 validation charge.
      </div>

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
          {errorMessage}
          <a
            href="https://wa.me/27824873900"
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-1 underline"
          >
            Contact support via WhatsApp
          </a>
        </div>
      )}

      <Button
        onClick={onProceed}
        disabled={isProcessing}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white"
        size="lg"
      >
        {isProcessing ? 'Processing...' : 'Proceed to Payment →'}
      </Button>

      <p className="text-center text-xs text-gray-400 mt-3">
        By proceeding, you agree to our{' '}
        <a href="/terms-of-service" className="underline">Terms &amp; Conditions</a> and{' '}
        <a href="/privacy-policy" className="underline">Privacy Policy</a>.
      </p>

      <p className="text-center text-xs text-gray-400 mt-1">
        * R{monthlyPrice}/month billed after service activation
      </p>

      {/* packageName is available for future use (e.g. analytics, display) */}
      <span className="sr-only">{packageName}</span>
    </div>
  );
}
