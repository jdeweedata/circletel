'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  CreditCard,
  Plus,
  Shield,
  CheckCircle,
  AlertCircle,
  Loader2,
  Lock,
  Building2,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import { useCustomerAuth } from '@/components/providers/CustomerAuthProvider';

interface PendingOrder {
  id: string;
  order_number: string;
  package_name: string;
  package_price: number;
  installation_address: string;
  created_at: string;
}

interface PaymentMethodSectionProps {
  pendingOrders?: PendingOrder[];
  hasPaymentMethod?: boolean;
}

type PaymentMethodType = 'card' | 'debit_order';
type ViewState = 'selection' | 'card_form' | 'debit_form';

interface BankDetails {
  bank_name: string;
  account_name: string;
  account_number: string;
  branch_code: string;
  account_type: 'cheque' | 'savings' | 'transmission';
}

// South African banks with universal branch codes
const SA_BANKS = [
  { name: 'ABSA Bank', code: '632005' },
  { name: 'Capitec Bank', code: '470010' },
  { name: 'First National Bank (FNB)', code: '250655' },
  { name: 'Investec', code: '580105' },
  { name: 'Nedbank', code: '198765' },
  { name: 'Standard Bank', code: '051001' },
  { name: 'African Bank', code: '430000' },
  { name: 'Bidvest Bank', code: '462005' },
  { name: 'Discovery Bank', code: '679000' },
  { name: 'TymeBank', code: '678910' },
];

export function PaymentMethodSection({
  pendingOrders = [],
  hasPaymentMethod = false
}: PaymentMethodSectionProps) {
  const { session } = useCustomerAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewState, setViewState] = useState<ViewState>('selection');
  const [billingDay, setBillingDay] = useState<string>('25');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    bank_name: '',
    account_name: '',
    account_number: '',
    branch_code: '',
    account_type: 'cheque',
  });

  const handleAddPaymentMethod = async () => {
    setIsProcessing(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 45000);

    try {
      // Initiate R1.00 validation charge using dedicated payment-method-initiate endpoint
      // This endpoint handles authentication, customer lookup, and correct return URLs
      const response = await fetch('/api/payments/payment-method-initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // No body needed - endpoint handles everything internally based on authenticated user
        body: JSON.stringify({}),
        signal: controller.signal,
      });

      const data = await response.json();

      if (!response.ok || !data.success || !data.payment_url) {
        throw new Error(data.error || 'Failed to initiate payment validation');
      }

      toast.success('Redirecting to secure payment...');

      // Redirect to NetCash payment page
      // After payment, user will be redirected to /dashboard/billing?payment_method=success|cancelled
      setTimeout(() => {
        window.location.href = data.payment_url as string;
      }, 1000);
    } catch (error: any) {
      console.error('Payment validation error:', error);
      if (error?.name === 'AbortError') {
        toast.error('Payment gateway took too long to respond. Please try again or contact support.');
      } else {
        toast.error(error instanceof Error ? error.message : 'Failed to add payment method');
      }
    } finally {
      clearTimeout(timeoutId);
      setIsProcessing(false);
    }
  };

  // Handle bank selection and auto-fill branch code
  const handleBankSelect = (bankName: string) => {
    const selectedBank = SA_BANKS.find(b => b.name === bankName);
    setBankDetails(prev => ({
      ...prev,
      bank_name: bankName,
      branch_code: selectedBank?.code || '',
    }));
  };

  // Validate bank details form
  const isDebitFormValid = () => {
    return (
      bankDetails.bank_name &&
      bankDetails.account_name.trim().length >= 2 &&
      bankDetails.account_number.trim().length >= 6 &&
      bankDetails.branch_code.trim().length >= 5 &&
      bankDetails.account_type &&
      billingDay &&
      acceptedTerms
    );
  };

  // Handle eMandate / Debit Order setup
  const handleSetupDebitOrder = async () => {
    if (!isDebitFormValid()) {
      toast.error('Please complete all required fields');
      return;
    }

    if (!session?.access_token) {
      toast.error('Please sign in to continue');
      return;
    }

    setIsProcessing(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 60000); // 60 second timeout for eMandate

    try {
      // Get the first pending order (if any) to associate with the mandate
      const orderId = pendingOrders[0]?.id;

      const response = await fetch('/api/payment/emandate/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          order_id: orderId,
          billing_day: parseInt(billingDay, 10),
          bank_details: {
            bank_name: bankDetails.bank_name,
            account_name: bankDetails.account_name,
            account_number: bankDetails.account_number,
            branch_code: bankDetails.branch_code,
            account_type: bankDetails.account_type,
          },
        }),
        signal: controller.signal,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.details || 'Failed to initiate debit order mandate');
      }

      if (!data.mandate_url) {
        throw new Error('No mandate URL received. Please try again.');
      }

      toast.success('Redirecting to authorize your debit order...');

      // Redirect to NetCash mandate signing page
      setTimeout(() => {
        window.location.href = data.mandate_url as string;
      }, 1000);
    } catch (error: any) {
      console.error('Debit order setup error:', error);
      if (error?.name === 'AbortError') {
        toast.error('Request timed out. Please try again.');
      } else {
        toast.error(error instanceof Error ? error.message : 'Failed to setup debit order');
      }
    } finally {
      clearTimeout(timeoutId);
      setIsProcessing(false);
    }
  };

  // Reset to selection view
  const handleBack = () => {
    setViewState('selection');
    setAcceptedTerms(false);
  };

  const hasPendingOrders = pendingOrders.length > 0;

  return (
    <div className="space-y-6">
      {/* Pending Orders Alert */}
      {hasPendingOrders && !hasPaymentMethod && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-orange-900 mb-1">
                Complete Your Order
              </p>
              <p className="text-xs text-orange-700 mb-3">
                You have {pendingOrders.length} pending {pendingOrders.length === 1 ? 'order' : 'orders'} waiting for payment method validation.
                Add a payment method to complete your order.
              </p>
              <div className="space-y-2">
                {pendingOrders.map((order) => (
                  <div key={order.id} className="bg-white rounded-lg p-3 text-xs">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-gray-900">{order.package_name}</span>
                      <Badge variant="outline" className="text-xs">Pending</Badge>
                    </div>
                    <p className="text-gray-600">{order.installation_address}</p>
                    <p className="text-gray-500 mt-1">
                      Order #{order.order_number} • {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Method Card */}
      <Card>
        <CardContent className="space-y-4 pt-6">
          {hasPaymentMethod ? (
            // Existing Payment Method
            <div className="border border-green-200 bg-green-50 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 mb-1">Payment Method Active</p>
                    <p className="text-sm text-gray-600">
                      Your payment method has been verified and is ready for automatic billing.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // No Payment Method - Show Add Options
            <div className="space-y-4">
              {/* Selection View - Choose Payment Type */}
              {viewState === 'selection' && (
                <>
                  {/* Info Banner */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-start gap-3">
                      <Shield className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-blue-900 mb-2">
                          Choose Your Payment Method
                        </p>
                        <p className="text-sm text-blue-700 leading-relaxed">
                          Select how you'd like to pay for your CircleTel services. Both options are secure and enable automatic billing.
                        </p>
                        <div className="mt-3 inline-flex items-center gap-2 bg-green-600 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-md">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Secured by NetCash</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Type Cards */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Credit/Debit Card Option */}
                    <button
                      onClick={() => setViewState('card_form')}
                      className="border-2 border-gray-200 rounded-xl p-6 text-left hover:border-circleTel-orange hover:bg-orange-50/30 transition-all group"
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-gradient-to-br from-circleTel-orange to-orange-600 rounded-xl shadow-md group-hover:shadow-lg transition-shadow">
                          <CreditCard className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">Credit or Debit Card</h3>
                          <p className="text-xs text-gray-500">Visa, Mastercard, Instant EFT</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        Quick R1.00 verification. Your card will be securely saved for automatic monthly payments.
                      </p>
                      <div className="flex items-center gap-3">
                        <Image src="/images/payment-logos/logo_mastercard-h.png" alt="Mastercard" width={35} height={22} className="object-contain" />
                        <Image src="/images/payment-logos/verified-by-visa.png" alt="Visa" width={30} height={19} className="object-contain" />
                        <Image src="/images/payment-logos/3d-secure.png" alt="3D Secure" width={30} height={19} className="object-contain" />
                      </div>
                    </button>

                    {/* Debit Order Option */}
                    <button
                      onClick={() => setViewState('debit_form')}
                      className="border-2 border-gray-200 rounded-xl p-6 text-left hover:border-blue-500 hover:bg-blue-50/30 transition-all group"
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl shadow-md group-hover:shadow-lg transition-shadow">
                          <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">Debit Order</h3>
                          <p className="text-xs text-gray-500">Direct from your bank account</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        Automatic monthly deductions from your bank account. Ideal for consistent billing.
                      </p>
                      <div className="text-xs text-blue-600 font-medium">
                        All major SA banks supported
                      </div>
                    </button>
                  </div>
                </>
              )}

              {/* Card Payment Form (R1.00 Validation) */}
              {viewState === 'card_form' && (
                <>
                  <Button
                    variant="ghost"
                    onClick={handleBack}
                    className="mb-2 text-gray-600 hover:text-gray-900 -ml-2"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to options
                  </Button>

                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-start gap-3">
                      <CreditCard className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-blue-900 mb-2">
                          Card Verification
                        </p>
                        <p className="text-sm text-blue-700 leading-relaxed">
                          We'll charge <strong>R1.00</strong> to verify your card. This amount will be <strong>credited to your account</strong>.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-circleTel-orange to-orange-600 rounded-full mb-4 shadow-lg">
                      <CreditCard className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg mb-2">Add Your Card</h3>
                    <p className="text-sm text-gray-600 mb-5 max-w-sm mx-auto">
                      Click below to securely enter your card details via our payment partner.
                    </p>
                    <Button
                      onClick={handleAddPaymentMethod}
                      disabled={isProcessing}
                      className="bg-circleTel-orange hover:bg-circleTel-orange/90 text-base px-6 py-5 h-auto shadow-md"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-5 h-5 mr-2" />
                          Continue to Payment
                        </>
                      )}
                    </Button>
                    <div className="flex items-center justify-center gap-4 mt-4">
                      <Image src="/images/payment-logos/logo_mastercard-h.png" alt="Mastercard" width={40} height={25} className="object-contain" />
                      <Image src="/images/payment-logos/verified-by-visa.png" alt="Visa" width={35} height={22} className="object-contain" />
                      <Image src="/images/payment-logos/3d-secure.png" alt="3D Secure" width={35} height={22} className="object-contain" />
                    </div>
                  </div>
                </>
              )}

              {/* Debit Order Form */}
              {viewState === 'debit_form' && (
                <>
                  <Button
                    variant="ghost"
                    onClick={handleBack}
                    className="mb-2 text-gray-600 hover:text-gray-900 -ml-2"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to options
                  </Button>

                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-start gap-3">
                      <Building2 className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-blue-900 mb-2">
                          Setup Debit Order
                        </p>
                        <p className="text-sm text-blue-700 leading-relaxed">
                          Enter your bank details below. You'll be redirected to authorize the debit order securely.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Bank Details Form */}
                  <div className="border rounded-xl p-6 space-y-4">
                    {/* Bank Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="bank_name" className="text-sm font-medium">
                        Bank <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={bankDetails.bank_name}
                        onValueChange={handleBankSelect}
                      >
                        <SelectTrigger id="bank_name" className="w-full">
                          <SelectValue placeholder="Select your bank" />
                        </SelectTrigger>
                        <SelectContent>
                          {SA_BANKS.map((bank) => (
                            <SelectItem key={bank.code} value={bank.name}>
                              {bank.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Account Holder Name */}
                    <div className="space-y-2">
                      <Label htmlFor="account_name" className="text-sm font-medium">
                        Account Holder Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="account_name"
                        placeholder="As it appears on your bank account"
                        value={bankDetails.account_name}
                        onChange={(e) => setBankDetails(prev => ({ ...prev, account_name: e.target.value }))}
                      />
                    </div>

                    {/* Account Number & Branch Code */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="account_number" className="text-sm font-medium">
                          Account Number <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="account_number"
                          placeholder="Your bank account number"
                          value={bankDetails.account_number}
                          onChange={(e) => setBankDetails(prev => ({ ...prev, account_number: e.target.value.replace(/\D/g, '') }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="branch_code" className="text-sm font-medium">
                          Branch Code <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="branch_code"
                          placeholder="Universal branch code"
                          value={bankDetails.branch_code}
                          onChange={(e) => setBankDetails(prev => ({ ...prev, branch_code: e.target.value.replace(/\D/g, '') }))}
                          className={bankDetails.bank_name ? 'bg-gray-50' : ''}
                        />
                        {bankDetails.bank_name && (
                          <p className="text-xs text-gray-500">Auto-filled for {bankDetails.bank_name}</p>
                        )}
                      </div>
                    </div>

                    {/* Account Type */}
                    <div className="space-y-2">
                      <Label htmlFor="account_type" className="text-sm font-medium">
                        Account Type <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={bankDetails.account_type}
                        onValueChange={(value: 'cheque' | 'savings' | 'transmission') =>
                          setBankDetails(prev => ({ ...prev, account_type: value }))
                        }
                      >
                        <SelectTrigger id="account_type" className="w-full">
                          <SelectValue placeholder="Select account type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cheque">Cheque / Current Account</SelectItem>
                          <SelectItem value="savings">Savings Account</SelectItem>
                          <SelectItem value="transmission">Transmission Account</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Billing Day */}
                    <div className="space-y-2">
                      <Label htmlFor="billing_day" className="text-sm font-medium">
                        Preferred Debit Day <span className="text-red-500">*</span>
                      </Label>
                      <Select value={billingDay} onValueChange={setBillingDay}>
                        <SelectTrigger id="billing_day" className="w-full">
                          <SelectValue placeholder="Select day of month" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1st of the month</SelectItem>
                          <SelectItem value="5">5th of the month</SelectItem>
                          <SelectItem value="25">25th of the month</SelectItem>
                          <SelectItem value="30">30th of the month</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">Your monthly payment will be debited on this day</p>
                    </div>

                    {/* Terms Acceptance */}
                    <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                      <Checkbox
                        id="accept_terms"
                        checked={acceptedTerms}
                        onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                        className="mt-0.5"
                      />
                      <Label
                        htmlFor="accept_terms"
                        className="text-sm text-gray-700 leading-relaxed cursor-pointer"
                      >
                        I authorize CircleTel (Pty) Ltd to debit my bank account for monthly service charges.
                        I understand I can cancel this authorization at any time.
                      </Label>
                    </div>

                    {/* Submit Button */}
                    <Button
                      onClick={handleSetupDebitOrder}
                      disabled={isProcessing || !isDebitFormValid()}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-base py-5 h-auto shadow-md"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Setting up mandate...
                        </>
                      ) : (
                        <>
                          <Shield className="w-5 h-5 mr-2" />
                          Authorize Debit Order
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-2">
                      <Lock className="w-3.5 h-3.5" />
                      <span>You'll be redirected to securely sign the mandate</span>
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
