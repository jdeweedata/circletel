'use client';

import { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  AlertCircle,
  Loader2,
  CreditCard,
  Calendar,
  FileText,
  Send,
  Copy,
  ExternalLink,
} from 'lucide-react';

interface PaymentMethodRegistrationModalProps {
  open: boolean;
  onClose: () => void;
  order: {
    id: string;
    order_number: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    package_price: number;
  };
  onSuccess: () => void;
}

export function PaymentMethodRegistrationModal({
  open,
  onClose,
  order,
  onSuccess,
}: PaymentMethodRegistrationModalProps) {
  const [mandateAmount, setMandateAmount] = useState<string>(
    order.package_price.toFixed(2)
  );
  const [paymentMethodType, setPaymentMethodType] = useState<string>('both');
  const [debitFrequency, setDebitFrequency] = useState<string>('Monthly');
  const [debitDay, setDebitDay] = useState<string>('01');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [mandateUrl, setMandateUrl] = useState<string | null>(null);
  const [accountReference, setAccountReference] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    const amount = parseFloat(mandateAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid mandate amount');
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(`/api/admin/orders/${order.id}/payment-method`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mandateAmount: amount,
          paymentMethodType,
          debitFrequency,
          debitDay,
          notes: notes || `Monthly subscription for R${order.package_price}/mo service`,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMandateUrl(result.data.mandateUrl);
        setAccountReference(result.data.accountReference);

        toast.success('eMandate request created successfully', {
          description: 'Customer can now sign the mandate online',
        });

        // Automatically send email and SMS notification
        try {
          const notifyResponse = await fetch(`/api/admin/orders/${order.id}/payment-method/notify`, {
            method: 'POST',
          });

          const notifyResult = await notifyResponse.json();

          if (notifyResult.success) {
            const sentChannels = [];
            if (notifyResult.data.email.sent) sentChannels.push('email');
            if (notifyResult.data.sms.sent) sentChannels.push('SMS');

            if (sentChannels.length > 0) {
              toast.success(`Notification sent via ${sentChannels.join(' and ')}`, {
                description: 'Customer will receive the registration link',
              });
            }
          }
        } catch (notifyError) {
          console.error('Failed to send automatic notification:', notifyError);
          // Don't fail the whole process if notification fails
        }

        // Don't close modal yet - show mandate URL for copy/share
      } else {
        setError(result.error || 'Failed to create eMandate request');
        toast.error('Request failed', {
          description: result.error || 'Please try again',
        });
      }
    } catch (err) {
      console.error('eMandate request error:', err);
      setError('Network error. Please check your connection and try again.');
      toast.error('Network error', {
        description: 'Failed to connect to server',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!mandateUrl) {
      // Normal close
      setMandateAmount(order.package_price.toFixed(2));
      setPaymentMethodType('both');
      setDebitFrequency('Monthly');
      setDebitDay('01');
      setNotes('');
      setError('');
      setMandateUrl(null);
      setAccountReference(null);
      onClose();
    } else {
      // Close after successful creation
      onSuccess();
      onClose();

      // Reset state
      setMandateAmount(order.package_price.toFixed(2));
      setPaymentMethodType('both');
      setDebitFrequency('Monthly');
      setDebitDay('01');
      setNotes('');
      setError('');
      setMandateUrl(null);
      setAccountReference(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  if (mandateUrl) {
    // Show success state with mandate URL
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[600px] bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-green-600" />
              eMandate Request Created
            </DialogTitle>
            <DialogDescription>
              The payment method registration link has been generated for{' '}
              <span className="font-semibold text-gray-900">{order.order_number}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Success Alert */}
            <Alert className="bg-green-50 border-green-200">
              <AlertCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Success!</strong> The eMandate registration link is ready. Share this with
                the customer to complete their payment method registration.
              </AlertDescription>
            </Alert>

            {/* Account Reference */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Account Reference</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={accountReference || ''}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(accountReference || '')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                This reference links the mandate to the order
              </p>
            </div>

            {/* Mandate URL */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Customer Registration Link</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={mandateUrl}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(mandateUrl)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(mandateUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Send this link to the customer via email or SMS
              </p>
            </div>

            {/* Customer Details */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <h4 className="text-sm font-semibold text-blue-900">Customer Details</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-blue-600 font-medium">Name:</span>{' '}
                  <span className="text-blue-900">{order.first_name} {order.last_name}</span>
                </div>
                <div>
                  <span className="text-blue-600 font-medium">Email:</span>{' '}
                  <span className="text-blue-900">{order.email}</span>
                </div>
                <div>
                  <span className="text-blue-600 font-medium">Phone:</span>{' '}
                  <span className="text-blue-900">{order.phone}</span>
                </div>
                <div>
                  <span className="text-blue-600 font-medium">Amount:</span>{' '}
                  <span className="text-blue-900">R{mandateAmount}/month</span>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <Alert>
              <Send className="h-4 w-4" />
              <AlertDescription>
                <strong>Next Steps:</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                  <li>Copy and send the registration link to the customer</li>
                  <li>Customer receives OTP from NetCash and accesses the mandate form</li>
                  <li>Customer completes banking details and signs digitally</li>
                  <li>System automatically updates order status to "Payment Method Registered"</li>
                </ol>
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button type="button" onClick={handleClose}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Show request form
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-white max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Request Payment Method Registration
            </DialogTitle>
            <DialogDescription>
              Create an eMandate request for{' '}
              <span className="font-semibold text-gray-900">{order.order_number}</span> -{' '}
              {order.first_name} {order.last_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {/* Customer Info */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 space-y-0.5">
              <div className="text-xs">
                <span className="text-gray-600">Email:</span>{' '}
                <span className="font-medium text-gray-900">{order.email}</span>
              </div>
              <div className="text-xs">
                <span className="text-gray-600">Phone:</span>{' '}
                <span className="font-medium text-gray-900">{order.phone}</span>
              </div>
            </div>

            {/* Mandate Amount */}
            <div className="space-y-2">
              <Label htmlFor="mandate_amount">
                Mandate Amount <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R</span>
                <Input
                  id="mandate_amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={mandateAmount}
                  onChange={(e) => setMandateAmount(e.target.value)}
                  className="pl-8"
                  required
                />
              </div>
              <p className="text-xs text-gray-500">
                Monthly recurring amount (typically matches package price)
              </p>
            </div>

            {/* Payment Method Type */}
            <div className="space-y-2">
              <Label htmlFor="payment_method_type">
                Payment Method Type <span className="text-red-500">*</span>
              </Label>
              <Select value={paymentMethodType} onValueChange={setPaymentMethodType}>
                <SelectTrigger id="payment_method_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Customer Choice</span>
                      <span className="text-xs text-gray-500">Bank account OR Credit card (recommended)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="bank_account">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Bank Account Only</span>
                      <span className="text-xs text-gray-500">Debit order from bank account</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="credit_card">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Credit Card Only</span>
                      <span className="text-xs text-gray-500">Visa or Mastercard</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Choose which payment method(s) the customer can select
              </p>
            </div>

            {/* Debit Frequency */}
            <div className="space-y-2">
              <Label htmlFor="debit_frequency">
                Debit Frequency <span className="text-red-500">*</span>
              </Label>
              <Select value={debitFrequency} onValueChange={setDebitFrequency}>
                <SelectTrigger id="debit_frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                  <SelectItem value="Bimonthly">Twice Monthly (Bi-monthly)</SelectItem>
                  <SelectItem value="ThreeMonthly">Quarterly (Three Monthly)</SelectItem>
                  <SelectItem value="SixMonthly">Semi-Annually (Six Monthly)</SelectItem>
                  <SelectItem value="Annually">Annually</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Debit Day */}
            <div className="space-y-2">
              <Label htmlFor="debit_day">
                Debit Day <span className="text-red-500">*</span>
              </Label>
              <Select value={debitDay} onValueChange={setDebitDay}>
                <SelectTrigger id="debit_day">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <SelectItem key={day} value={day.toString().padStart(2, '0')}>
                      {day}{day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} of the month
                    </SelectItem>
                  ))}
                  <SelectItem value="LDOM">Last Day of Month</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Day of the month when debit order will run
              </p>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any internal notes about this mandate..."
                rows={2}
              />
              <p className="text-xs text-gray-500">
                Internal notes (not visible to customer)
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Info Alert */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong className="text-xs">How it works:</strong>
                <ol className="list-decimal list-inside mt-1 space-y-0.5 text-xs">
                  <li>NetCash generates a secure mandate registration link</li>
                  <li>Customer receives OTP via SMS and completes online form</li>
                  <li>Customer digitally signs the debit order mandate</li>
                  <li>Order status automatically updates when complete</li>
                </ol>
              </AlertDescription>
            </Alert>
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Create eMandate Request
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
