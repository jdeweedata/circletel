import Link from 'next/link';
import { Lock, Shield, AlertCircle, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PaymentDisclaimerCardProps {
  variant?: 'default' | 'compact';
  showRefundPolicy?: boolean;
}

/**
 * PaymentDisclaimerCard Component
 *
 * Displays payment security information and links to legal policies.
 * Required for NetCash legal compliance.
 *
 * @param variant - 'default' shows full details, 'compact' shows minimal
 * @param showRefundPolicy - Whether to show refund policy link (default: true)
 */
export function PaymentDisclaimerCard({
  variant = 'default',
  showRefundPolicy = true,
}: PaymentDisclaimerCardProps) {
  if (variant === 'compact') {
    return (
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-blue-900 font-semibold mb-2">Secure Payment Processing</p>
            <p className="text-xs text-blue-800 mb-3">
              Powered by NetCash - PCI DSS Level 1 certified payment gateway. Your card details are never stored by CircleTel.
            </p>
            <div className="flex flex-wrap gap-3 text-xs">
              <Link
                href="/payment-terms"
                target="_blank"
                className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
              >
                <FileText className="h-3 w-3" />
                Payment Terms
              </Link>
              {showRefundPolicy && (
                <Link
                  href="/refund-policy"
                  target="_blank"
                  className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                >
                  <FileText className="h-3 w-3" />
                  Refund Policy
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Lock className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-lg font-bold text-blue-900">
            Secure Payment Processing
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Security Information */}
        <div className="bg-white/70 rounded-lg p-4 border border-blue-200">
          <div className="flex items-start gap-3 mb-3">
            <Shield className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-1">
                PCI DSS Level 1 Certified
              </p>
              <p className="text-sm text-gray-700">
                Your payment is processed by <strong>NetCash (Pty) Ltd</strong>, a PCI DSS Level 1 certified payment gateway.
                This is the highest security standard for payment processors.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-1">
                Your Data is Protected
              </p>
              <p className="text-sm text-gray-700">
                CircleTel <strong>does not store</strong> your full card details. All payment information is securely
                tokenized and encrypted by NetCash.
              </p>
            </div>
          </div>
        </div>

        {/* Merchant Information */}
        <div className="bg-white/70 rounded-lg p-4 border border-blue-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-1">
                Merchant of Record
              </p>
              <p className="text-sm text-gray-700">
                <strong>CircleTel (Pty) Ltd</strong> is the merchant of record. Payment processing is handled by
                NetCash on our behalf. Your bank statement will show a CircleTel charge.
              </p>
            </div>
          </div>
        </div>

        {/* Policy Links */}
        <div className="pt-3 border-t border-blue-200">
          <p className="text-xs text-gray-600 mb-3">
            By proceeding with payment, you agree to our:
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/terms"
              target="_blank"
              className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              <FileText className="h-4 w-4" />
              Terms & Conditions
            </Link>
            <Link
              href="/privacy-policy"
              target="_blank"
              className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              <FileText className="h-4 w-4" />
              Privacy Policy
            </Link>
            <Link
              href="/payment-terms"
              target="_blank"
              className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              <FileText className="h-4 w-4" />
              Payment Terms
            </Link>
            {showRefundPolicy && (
              <Link
                href="/refund-policy"
                target="_blank"
                className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                <FileText className="h-4 w-4" />
                Refund Policy
              </Link>
            )}
          </div>
        </div>

        {/* NetCash Logo/Badge */}
        <div className="pt-3 border-t border-blue-200 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Secured by NetCash
          </p>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-green-600" />
            <span className="text-xs font-semibold text-green-700">256-bit SSL Encryption</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
