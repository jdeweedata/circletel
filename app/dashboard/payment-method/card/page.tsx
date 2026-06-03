'use client';
import { PiArrowLeftBold, PiCreditCardBold, PiEnvelopeBold, PiLockBold, PiPhoneBold, PiShieldBold, PiSpinnerBold } from 'react-icons/pi';

import React, { useState, useEffect, useRef } from 'react';
import { useCustomerAuth } from '@/components/providers/CustomerAuthProvider';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';

interface PendingOrder {
  id: string;
  order_number: string;
}

export default function CardPaymentPage() {
  const { session } = useCustomerAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [billingDay, setBillingDay] = useState<string>('25');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const fetchInProgress = useRef(false);

  // Fetch pending orders (a mandate is tied to an order, same as the debit-order flow)
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

  const handleAddCardMandate = async () => {
    if (!session?.access_token) {
      toast.error('Please sign in to add a payment method');
      return;
    }

    if (!acceptedTerms) {
      toast.error('Please authorize the recurring card payment to continue');
      return;
    }

    const orderId = pendingOrders[0]?.id;
    if (!orderId) {
      toast.error('No pending order found. Please create an order first.');
      return;
    }

    setIsProcessing(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 60000);

    try {
      const response = await fetch('/api/payment/emandate/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          order_id: orderId,
          billing_day: parseInt(billingDay, 10),
          mandate_method: 'card',
        }),
        signal: controller.signal,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.details || 'Failed to set up card mandate');
      }

      toast.success(
        'Card mandate submitted! Check your email/SMS from NetCash to enter your card and sign the mandate.',
        { duration: 8000 }
      );

      setTimeout(() => {
        window.location.href = '/dashboard/payment-method';
      }, 3000);
    } catch (error: unknown) {
      console.error('Card mandate setup error:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        toast.error('Request timed out. Please try again.');
      } else {
        toast.error(error instanceof Error ? error.message : 'Failed to add card');
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
          <PiArrowLeftBold className="w-4 h-4" />
          <span>Back to Payment Methods</span>
        </Link>

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-circleTel-orange/10 rounded-lg">
            <PiCreditCardBold className="w-8 h-8 text-circleTel-orange" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Credit or Debit Card</h1>
            <p className="text-gray-600">Save your card for automatic monthly payments</p>
          </div>
        </div>

        {/* Info Card */}
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <PiCreditCardBold className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900">How it works</h3>
                <p className="text-sm text-blue-700 mt-1">
                  We&apos;ll send you a secure link from NetCash by email/SMS. You enter your card
                  details there once, and it&apos;s securely saved for your monthly payments — no card
                  details are stored by CircleTel.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mandate Setup */}
        <Card>
          <CardContent className="p-6 space-y-5">
            {/* Card Logos */}
            <div className="flex items-center justify-center gap-4">
              <Image
                src="/images/payment-logos/visa-logo.svg"
                alt="VISA"
                width={60}
                height={20}
                className="h-5 w-auto"
              />
              <Image
                src="/images/payment-logos/mastercard-logo.svg"
                alt="Mastercard"
                width={50}
                height={30}
                className="h-8 w-auto"
              />
              <Image
                src="/images/payment-logos/3d-secure-logo.svg"
                alt="3D Secure"
                width={50}
                height={30}
                className="h-7 w-auto"
              />
            </div>

            {/* Billing Day */}
            <div className="space-y-2">
              <Label htmlFor="billing_day" className="text-sm font-medium">
                Preferred Payment Day <span className="text-red-500">*</span>
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
              <p className="text-xs text-gray-500">Your monthly payment will be charged on this day</p>
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
                I authorize CircleTel (Pty) Ltd to charge my card for monthly service charges.
                I understand I can cancel this authorization at any time.
              </Label>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleAddCardMandate}
              disabled={isProcessing || !acceptedTerms}
              className="w-full bg-circleTel-orange hover:bg-circleTel-orange-dark text-white text-base py-6 h-auto shadow-md"
            >
              {isProcessing ? (
                <>
                  <PiSpinnerBold className="w-5 h-5 mr-2 animate-spin" />
                  Setting up mandate...
                </>
              ) : (
                <>
                  <PiShieldBold className="w-5 h-5 mr-2" />
                  Set Up Card Payment
                </>
              )}
            </Button>

            <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-2">
              <PiLockBold className="w-3.5 h-3.5" />
              <span>You&apos;ll receive a secure NetCash link to enter and sign your card</span>
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
                  <PiPhoneBold className="w-4 h-4" />
                  <span>082 487 3900</span>
                </a>
                <a
                  href="mailto:contactus@circletel.co.za"
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-circleTel-orange transition-colors"
                >
                  <PiEnvelopeBold className="w-4 h-4" />
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
