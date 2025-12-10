'use client';

import React, { useState } from 'react';
import { useCustomerAuth } from '@/components/providers/CustomerAuthProvider';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard, ArrowLeft, Lock, Phone, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';

export default function CardPaymentPage() {
  const router = useRouter();
  const { session } = useCustomerAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAddPaymentMethod = async () => {
    if (!session?.access_token) {
      toast.error('Please sign in to add a payment method');
      return;
    }

    setIsProcessing(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 45000);

    try {
      const response = await fetch('/api/payments/payment-method-initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({}),
        signal: controller.signal,
      });

      const data = await response.json();

      if (!response.ok || !data.success || !data.payment_url) {
        throw new Error(data.error || 'Failed to initiate payment validation');
      }

      toast.success('Redirecting to secure payment...');

      setTimeout(() => {
        window.location.href = data.payment_url as string;
      }, 1000);
    } catch (error: any) {
      console.error('Payment validation error:', error);
      if (error?.name === 'AbortError') {
        toast.error('Payment gateway took too long to respond. Please try again.');
      } else {
        toast.error(error instanceof Error ? error.message : 'Failed to add payment method');
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
          <div className="p-3 bg-circleTel-orange/10 rounded-lg">
            <CreditCard className="w-8 h-8 text-circleTel-orange" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Credit or Debit Card</h1>
            <p className="text-gray-600">Add your card for secure automatic payments</p>
          </div>
        </div>

        {/* Info Card */}
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900">Card Verification</h3>
                <p className="text-sm text-blue-700 mt-1">
                  We'll charge <strong>R1.00</strong> to verify your card. This amount will be <strong>credited to your account</strong>.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Card */}
        <Card>
          <CardContent className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-circleTel-orange to-orange-600 rounded-full mb-6 shadow-lg">
              <CreditCard className="w-10 h-10 text-white" />
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-2">Add Your Card</h2>
            <p className="text-gray-600 mb-6 max-w-sm mx-auto">
              Click below to securely enter your card details via our payment partner.
            </p>

            {/* Card Logos */}
            <div className="flex items-center justify-center gap-4 mb-6">
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
                src="/images/payment-logos/3d-secure.png"
                alt="3D Secure"
                width={40}
                height={25}
                className="h-6 w-auto"
              />
            </div>

            <Button
              onClick={handleAddPaymentMethod}
              disabled={isProcessing}
              className="bg-circleTel-orange hover:bg-circleTel-orange/90 text-white text-base px-8 py-6 h-auto shadow-md"
              size="lg"
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

            <p className="text-xs text-gray-500 mt-4 flex items-center justify-center gap-2">
              <Lock className="w-3.5 h-3.5" />
              <span>Secured by NetCash - 256-bit SSL encryption</span>
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
                  href="tel:0870876305"
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-circleTel-orange transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  <span>087 087 6305</span>
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
