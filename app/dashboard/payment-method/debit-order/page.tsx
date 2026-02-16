'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useCustomerAuth } from '@/components/providers/CustomerAuthProvider';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Building2, ArrowLeft, Lock, Shield, Phone, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

interface BankDetails {
  bank_name: string;
  account_name: string;
  account_number: string;
  branch_code: string;
  account_type: 'cheque' | 'savings' | 'transmission';
}

interface PendingOrder {
  id: string;
  order_number: string;
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

export default function DebitOrderPage() {
  const router = useRouter();
  const { session } = useCustomerAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [billingDay, setBillingDay] = useState<string>('25');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const fetchInProgress = useRef(false);
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    bank_name: '',
    account_name: '',
    account_number: '',
    branch_code: '',
    account_type: 'cheque',
  });

  // Fetch pending orders
  useEffect(() => {
    async function fetchPendingOrders() {
      if (!session?.access_token || fetchInProgress.current) return;
      fetchInProgress.current = true;

      try {
        const response = await fetch('/api/orders/pending', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setPendingOrders(data.orders || []);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        fetchInProgress.current = false;
      }
    }

    fetchPendingOrders();
  }, [session?.access_token]);

  const handleBankSelect = (bankName: string) => {
    const selectedBank = SA_BANKS.find(b => b.name === bankName);
    setBankDetails(prev => ({
      ...prev,
      bank_name: bankName,
      branch_code: selectedBank?.code || '',
    }));
  };

  const isFormValid = () => {
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

  const handleSetupDebitOrder = async () => {
    if (!isFormValid()) {
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
    }, 60000);

    try {
      const orderId = pendingOrders[0]?.id;

      if (!orderId) {
        toast.error('No pending order found. Please create an order first.');
        return;
      }

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

      // Batch processing - customer will receive email/SMS from NetCash
      if (data.file_token) {
        toast.success('Debit order mandate submitted! Check your email/SMS from NetCash to sign the mandate.', {
          duration: 8000,
        });
        
        // Redirect to payment methods page after short delay
        setTimeout(() => {
          window.location.href = '/dashboard/payment-method';
        }, 3000);
        return;
      }

      // Legacy: Direct redirect if mandate_url provided
      if (data.mandate_url) {
        toast.success('Redirecting to authorize your debit order...');
        setTimeout(() => {
          window.location.href = data.mandate_url as string;
        }, 1000);
        return;
      }

      throw new Error('No mandate response received. Please try again.');
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          href="/dashboard/payment-method"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Payment Methods</span>
        </Link>

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Building2 className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Debit Order</h1>
            <p className="text-gray-600">Set up automatic monthly deductions</p>
          </div>
        </div>

        {/* Info Card */}
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Building2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900">Setup Debit Order</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Enter your bank details below. You'll be redirected to authorize the debit order securely.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bank Details Form */}
        <Card>
          <CardContent className="p-6 space-y-5">
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
              disabled={isProcessing || !isFormValid()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-base py-6 h-auto shadow-md"
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
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card className="mt-6 border-gray-200">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm font-medium text-gray-700">
                Need help?
              </p>
              <div className="flex items-center gap-4">
                <a
                  href="https://wa.me/27824873900"
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-circleTel-orange transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  <span>082 487 3900</span>
                </a>
                <a
                  href="mailto:contactus@circletel.co.za"
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-circleTel-orange transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  <span>contactus@circletel.co.za</span>
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
