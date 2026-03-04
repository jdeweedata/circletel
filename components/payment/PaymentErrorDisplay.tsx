/**
 * Payment Error Display Component
 * Shows user-friendly error messages with retry suggestions
 */

'use client';
import { PiArrowLeftBold, PiArrowsClockwiseBold, PiEnvelopeBold, PiInfoBold, PiPhoneBold, PiWarningBold, PiWarningCircleBold, PiXCircleBold } from 'react-icons/pi';

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { mapPaymentError, shouldSuggestAlternative, getAlternativePaymentSuggestion, PaymentErrorCode } from '@/lib/payment/payment-errors';
import { getRetryInfo } from '@/lib/payment/payment-persistence';

interface PaymentErrorDisplayProps {
  errorCode: PaymentErrorCode | string;
  errorMessage?: string;
  retryCount?: number;
  onRetry?: () => void;
  onBack?: () => void;
  onContactSupport?: () => void;
  className?: string;
}

export function PaymentErrorDisplay({
  errorCode,
  errorMessage,
  retryCount: propRetryCount,
  onRetry,
  onBack,
  onContactSupport,
  className = '',
}: PaymentErrorDisplayProps) {
  const [retryInfo] = React.useState(() => getRetryInfo());
  const retryCount = propRetryCount ?? retryInfo.count;

  const errorInfo = mapPaymentError(errorCode, errorMessage);
  const showAlternative = shouldSuggestAlternative(retryCount, errorInfo.code);

  const getSeverityIcon = () => {
    if (errorInfo.code === PaymentErrorCode.CANCELLED || errorInfo.code === PaymentErrorCode.ABANDONED) {
      return <PiInfoBold className="h-5 w-5 text-blue-500" />;
    }
    if (showAlternative) {
      return <PiWarningBold className="h-5 w-5 text-amber-500" />;
    }
    return <PiXCircleBold className="h-5 w-5 text-red-500" />;
  };

  const getSeverityColor = () => {
    if (errorInfo.code === PaymentErrorCode.CANCELLED || errorInfo.code === PaymentErrorCode.ABANDONED) {
      return 'border-blue-200 bg-blue-50';
    }
    if (showAlternative) {
      return 'border-amber-200 bg-amber-50';
    }
    return 'border-red-200 bg-red-50';
  };

  return (
    <div className={`space-y-4 ${className}`} data-testid="payment-error-display">
      {/* Main Error Alert */}
      <Alert className={`${getSeverityColor()}`}>
        <div className="flex items-start gap-3">
          {getSeverityIcon()}
          <div className="flex-1">
            <AlertTitle className="text-lg font-semibold mb-2">
              Payment {errorInfo.code === PaymentErrorCode.CANCELLED ? 'Cancelled' : 'Failed'}
            </AlertTitle>
            <AlertDescription>
              <div className="space-y-2">
                <p className="text-base">{errorInfo.userMessage}</p>
                <p className="text-sm text-gray-600">{errorInfo.suggestion}</p>
              </div>
            </AlertDescription>
          </div>
        </div>
      </Alert>

      {/* Retry Count Warning */}
      {retryCount > 0 && (
        <Alert>
          <PiInfoBold className="h-4 w-4" />
          <AlertDescription>
            You've attempted payment {retryCount} time{retryCount !== 1 ? 's' : ''}.
            {retryCount >= 3 && ' After multiple attempts, we recommend contacting support for assistance.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">What would you like to do?</CardTitle>
          <CardDescription>
            Choose an option to continue with your order
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Retry Button (if retryable) */}
          {errorInfo.retryable && onRetry && retryCount < 5 && (
            <Button
              onClick={onRetry}
              className="w-full"
              size="lg"
              variant={retryCount >= 3 ? 'outline' : 'default'}
            >
              <PiArrowsClockwiseBold className="h-4 w-4 mr-2" />
              Try Payment Again
            </Button>
          )}

          {/* Too Many Retries Warning */}
          {retryCount >= 5 && (
            <Alert variant="destructive">
              <PiWarningBold className="h-4 w-4" />
              <AlertDescription>
                Maximum retry attempts reached. Please contact support or try a different payment method.
              </AlertDescription>
            </Alert>
          )}

          {/* Back to Order Summary */}
          {onBack && (
            <Button
              onClick={onBack}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <PiArrowLeftBold className="h-4 w-4 mr-2" />
              Back to Order Summary
            </Button>
          )}

          {/* Contact Support */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={() => window.location.href = 'tel:0860247253'}
            >
              <PiPhoneBold className="h-4 w-4 mr-2" />
              Call Support
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => window.location.href = 'mailto:support@circletel.co.za'}
            >
              <PiEnvelopeBold className="h-4 w-4 mr-2" />
              Email Support
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alternative Payment Methods Card (after 3 retries) */}
      {showAlternative && (
        <Card className="border-amber-200 bg-amber-50" data-testid="alternative-payment-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <PiWarningBold className="h-5 w-5" />
              Alternative Payment Options
            </CardTitle>
            <CardDescription className="text-amber-800">
              Having trouble? Here are other ways to complete your payment
            </CardDescription>
          </CardHeader>
          <CardContent className="text-amber-900">
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold mb-1">📧 EFT/Bank Transfer</h4>
                <p className="text-sm">Pay directly from your bank account. We'll email you our banking details.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">📞 Assisted Payment</h4>
                <p className="text-sm">Call 0860 CIRCLE (247 253) and our team will help you complete the payment over the phone.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">🔗 Payment Link</h4>
                <p className="text-sm">We can email you a secure payment link that you can use at your convenience.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">⏰ Reserve Your Order</h4>
                <p className="text-sm">We can hold your order for 24 hours while you arrange payment.</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-amber-200">
              <p className="text-sm font-medium">
                📞 Support Hours: Monday - Friday, 8:00 AM - 6:00 PM
              </p>
              <p className="text-sm mt-1">
                ✉️ Email: support@circletel.co.za | 📞 Phone: 0860 CIRCLE (247 253)
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Details (for debugging - only in dev) */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-sm text-gray-600">Debug Information</CardTitle>
          </CardHeader>
          <CardContent className="text-xs font-mono text-gray-500 space-y-1">
            <div><strong>Error Code:</strong> {errorInfo.code}</div>
            <div><strong>Raw Message:</strong> {errorMessage || 'N/A'}</div>
            <div><strong>Retry Count:</strong> {retryCount}</div>
            <div><strong>Retryable:</strong> {errorInfo.retryable ? 'Yes' : 'No'}</div>
            <div><strong>Suggest Alternative:</strong> {showAlternative ? 'Yes' : 'No'}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Compact error banner for inline display
 */
export function PaymentErrorBanner({
  errorCode,
  errorMessage,
  onRetry,
  onDismiss,
}: {
  errorCode: PaymentErrorCode | string;
  errorMessage?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}) {
  const errorInfo = mapPaymentError(errorCode, errorMessage);

  return (
    <Alert variant="destructive" className="mb-4">
      <PiWarningCircleBold className="h-4 w-4" />
      <AlertTitle>Payment Failed</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>{errorInfo.userMessage}</span>
        <div className="flex gap-2 ml-4">
          {errorInfo.retryable && onRetry && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRetry}
              className="bg-white hover:bg-gray-50"
            >
              Retry
            </Button>
          )}
          {onDismiss && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onDismiss}
              className="bg-white hover:bg-gray-50"
            >
              Dismiss
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
