'use client';
import { PiCheckCircleBold, PiSpinnerBold, PiWarningBold, PiPhoneBold } from 'react-icons/pi';

import React, { Suspense, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface OrderDetails {
  id: string;
  order_number: string;
  payment_reference: string;
  status: string;
  payment_status: string;
  package_name: string;
  package_speed: string;
  package_price: number;
  installation_fee: number;
  installation_address: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  created_at: string;
}

function ConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const paymentReference = searchParams.get('Reference') || searchParams.get('reference');

  useEffect(() => {
    const fetchOrder = async () => {
      if (!paymentReference) {
        setError('No payment reference found.');
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/orders?reference=${encodeURIComponent(paymentReference)}`);
        if (!res.ok) throw new Error('Order not found');
        const data = await res.json();
        setOrder(data.order);
      } catch {
        setError('We could not load your order details. Your payment was still processed.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [paymentReference]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <PiSpinnerBold className="w-16 h-16 text-orange-500 mx-auto mb-4 animate-spin" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Confirming your order...</h1>
          <p className="text-gray-600">Please wait while we verify your payment</p>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <PiWarningBold className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Order submitted</h1>
          <p className="text-gray-500 mb-2">
            Payment Reference: <span className="font-mono font-semibold">{paymentReference}</span>
          </p>
          <p className="text-sm text-gray-400 mb-6">{error}</p>
          <a
            href="https://wa.me/27824873900"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-medium"
          >
            <PiPhoneBold /> Contact us on WhatsApp
          </a>
        </div>
      </div>
    );
  }

  const phoneUnverified = order && !order.phone?.startsWith('verified:');

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Success header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <PiCheckCircleBold className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
        <p className="text-gray-600">Thank you for choosing CircleTel.</p>
        {order && (
          <div className="mt-4 bg-gray-50 rounded-lg p-4 text-sm text-gray-500 text-left space-y-1">
            <div className="flex justify-between">
              <span>Order number</span>
              <span className="font-mono font-semibold">{order.order_number}</span>
            </div>
            <div className="flex justify-between">
              <span>Package</span>
              <span>{order.package_name}</span>
            </div>
            <div className="flex justify-between">
              <span>Address</span>
              <span className="text-right max-w-xs">{order.installation_address}</span>
            </div>
            <div className="flex justify-between">
              <span>Monthly fee</span>
              <span>R{order.package_price}/month</span>
            </div>
          </div>
        )}
      </div>

      {/* What happens next */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">What happens next?</h2>
        <div className="space-y-4">
          {/* Phone verification — shown when phone not yet verified */}
          {phoneUnverified && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <span className="flex-shrink-0 w-6 h-6 bg-amber-500 text-white text-xs font-bold rounded-full flex items-center justify-center">1</span>
              <div>
                <p className="font-medium text-amber-900">Verify your phone number</p>
                <p className="text-sm text-amber-700 mt-1">
                  We need to verify {order?.phone || 'your number'} before we can schedule installation.
                </p>
                <Link
                  href="/dashboard/profile?verify=phone"
                  className="inline-block mt-2 text-sm bg-amber-500 text-white px-4 py-1.5 rounded-lg hover:bg-amber-600"
                >
                  Verify Now →
                </Link>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {phoneUnverified ? '2' : '1'}
            </span>
            <p className="text-gray-700">You&apos;ll receive an order confirmation email shortly.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {phoneUnverified ? '3' : '2'}
            </span>
            <p className="text-gray-700">
              Our team will contact you within 24 hours to schedule installation.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {phoneUnverified ? '4' : '3'}
            </span>
            <p className="text-gray-700">Professional installation — we&apos;ll get you connected.</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <Button variant="outline" onClick={() => router.push('/')} className="flex-1">
          Return to Home
        </Button>
        <Button
          onClick={() => router.push('/dashboard')}
          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
        >
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="max-w-2xl mx-auto p-8 text-center">
        <PiSpinnerBold className="w-12 h-12 text-orange-500 mx-auto animate-spin" />
      </div>
    }>
      <ConfirmationContent />
    </Suspense>
  );
}
