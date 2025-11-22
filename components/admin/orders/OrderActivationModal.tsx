'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { AlertCircle, Loader2, PlayCircle, CheckCircle, XCircle } from 'lucide-react';

interface OrderActivationModalProps {
  open: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber: string;
  packagePrice: number;
  onSuccess: () => void;
}

interface ValidationResult {
  canActivate: boolean;
  errors: string[];
  warnings: string[];
  billingPreview?: {
    activationDate: string;
    prorataAmount: number;
    prorataDays: number;
    nextBillingDate: string;
    billingCycleDay: number;
    monthlyAmount: number;
  };
}

export function OrderActivationModal({
  open,
  onClose,
  orderId,
  orderNumber,
  packagePrice,
  onSuccess,
}: OrderActivationModalProps) {
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [connectionId, setConnectionId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (open) {
      validateActivation();
    }
  }, [open]);

  const validateActivation = async () => {
    setIsValidating(true);
    setError('');

    try {
      // Check order status and requirements
      const response = await fetch(`/api/admin/orders/${orderId}`);
      const result = await response.json();

      if (!result.success || !result.data) {
        setError('Failed to load order details');
        setValidation({
          canActivate: false,
          errors: ['Failed to load order details'],
          warnings: [],
        });
        return;
      }

      const order = result.data;
      const errors: string[] = [];
      const warnings: string[] = [];

      // Check status
      if (order.status !== 'installation_completed') {
        errors.push(`Order must be in "Installation Completed" status. Current status: ${order.status}`);
      }

      // Check installation document
      if (!order.installation_document_url) {
        errors.push('Installation document must be uploaded before activation');
      }

      // Check payment method
      if (!order.payment_method_id) {
        errors.push('Payment method must be registered before activation');
      } else {
        // Check if payment method is verified
        const pmResponse = await fetch(`/api/admin/payment-methods/${order.payment_method_id}`);
        if (pmResponse.ok) {
          const pmResult = await pmResponse.json();
          if (pmResult.data && !pmResult.data.verified) {
            errors.push('Payment method is not verified. Please verify before activation.');
          }
          if (pmResult.data && !pmResult.data.is_active) {
            errors.push('Payment method is not active');
          }
        }
      }

      // Set account number if exists
      if (order.account_number) {
        setAccountNumber(order.account_number);
      }

      // Calculate billing preview
      const today = new Date();
      const day = today.getDate();
      let billingCycleDay: number;
      let nextBillingDate: Date;

      if (day <= 1) {
        billingCycleDay = 1;
        nextBillingDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      } else if (day <= 5) {
        billingCycleDay = 5;
        nextBillingDate = new Date(today.getFullYear(), today.getMonth() + 1, 5);
      } else if (day <= 15) {
        billingCycleDay = 15;
        nextBillingDate = new Date(today.getFullYear(), today.getMonth() + 1, 15);
      } else if (day <= 25) {
        billingCycleDay = 25;
        nextBillingDate = new Date(today.getFullYear(), today.getMonth() + 1, 25);
      } else {
        billingCycleDay = 1;
        nextBillingDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      }

      const prorataDays = Math.ceil(
        (nextBillingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      const dailyRate = packagePrice / daysInMonth;
      const prorataAmount = Math.round(dailyRate * prorataDays * 100) / 100;

      setValidation({
        canActivate: errors.length === 0,
        errors,
        warnings,
        billingPreview: {
          activationDate: today.toISOString().split('T')[0],
          prorataAmount,
          prorataDays,
          nextBillingDate: nextBillingDate.toISOString().split('T')[0],
          billingCycleDay,
          monthlyAmount: packagePrice,
        },
      });
    } catch (err) {
      console.error('Validation error:', err);
      setError('Failed to validate order for activation');
      setValidation({
        canActivate: false,
        errors: ['Failed to validate order requirements'],
        warnings: [],
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validation?.canActivate) {
      setError('Cannot activate order. Please resolve all errors first.');
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(`/api/admin/orders/${orderId}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountNumber: accountNumber || undefined,
          connectionId: connectionId || undefined,
          notes: notes || undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Service activated successfully!', {
          description: `Order ${orderNumber} is now live. Billing has been activated.`,
        });
        onSuccess();
        handleClose();
      } else {
        setError(result.error || 'Failed to activate service');
        toast.error('Activation failed', {
          description: result.error || 'Please try again',
        });
      }
    } catch (err) {
      console.error('Activation error:', err);
      setError('Network error. Please check your connection and try again.');
      toast.error('Network error', {
        description: 'Failed to connect to server',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setAccountNumber('');
    setConnectionId('');
    setNotes('');
    setError('');
    setValidation(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlayCircle className="h-5 w-5 text-green-600" />
              Activate Service & Start Billing
            </DialogTitle>
            <DialogDescription>
              Activate service for order{' '}
              <span className="font-semibold text-gray-900">{orderNumber}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Validation Status */}
            {isValidating ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-circleTel-orange" />
                <span className="ml-3 text-gray-600">Validating requirements...</span>
              </div>
            ) : validation ? (
              <div className="space-y-3">
                {/* Errors */}
                {validation.errors.length > 0 && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      <p className="font-semibold mb-2">Cannot activate service:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {validation.errors.map((err, i) => (
                          <li key={i} className="text-sm">{err}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Success - Can Activate */}
                {validation.canActivate && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <p className="font-semibold">Ready for activation!</p>
                      <p className="text-sm mt-1">All requirements met. Service can be activated.</p>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Billing Preview */}
                {validation.billingPreview && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-3">Billing Preview</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-blue-600 font-medium">Activation Date</p>
                        <p className="text-blue-900">{validation.billingPreview.activationDate}</p>
                      </div>
                      <div>
                        <p className="text-blue-600 font-medium">Pro-rata Amount</p>
                        <p className="text-blue-900 font-semibold">
                          R{validation.billingPreview.prorataAmount.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-blue-600 font-medium">Pro-rata Days</p>
                        <p className="text-blue-900">{validation.billingPreview.prorataDays} days</p>
                      </div>
                      <div>
                        <p className="text-blue-600 font-medium">Next Billing Date</p>
                        <p className="text-blue-900">{validation.billingPreview.nextBillingDate}</p>
                      </div>
                      <div>
                        <p className="text-blue-600 font-medium">Billing Cycle Day</p>
                        <p className="text-blue-900">
                          {validation.billingPreview.billingCycleDay}{' '}
                          {validation.billingPreview.billingCycleDay === 1 ? 'st' :
                           validation.billingPreview.billingCycleDay === 5 ? 'th' :
                           validation.billingPreview.billingCycleDay === 15 ? 'th' : 'th'} of month
                        </p>
                      </div>
                      <div>
                        <p className="text-blue-600 font-medium">Monthly Amount</p>
                        <p className="text-blue-900 font-semibold">
                          R{validation.billingPreview.monthlyAmount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {/* Account Details */}
            {validation?.canActivate && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="account_number">
                    Account Number <span className="text-gray-500">(Optional)</span>
                  </Label>
                  <Input
                    id="account_number"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="CT-2025-XXXXX"
                  />
                  <p className="text-xs text-gray-500">
                    CircleTel account number (auto-generated if not provided)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="connection_id">
                    Connection ID <span className="text-gray-500">(Optional)</span>
                  </Label>
                  <Input
                    id="connection_id"
                    value={connectionId}
                    onChange={(e) => setConnectionId(e.target.value)}
                    placeholder="Provider connection/circuit ID"
                  />
                  <p className="text-xs text-gray-500">
                    Provider's connection or circuit identifier
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">
                    Activation Notes <span className="text-gray-500">(Optional)</span>
                  </Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any notes about the activation..."
                    rows={3}
                  />
                </div>
              </>
            )}

            {/* Error Alert */}
            {error && !isValidating && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !validation?.canActivate || isValidating}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Activating...
                </>
              ) : (
                <>
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Activate Service
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
