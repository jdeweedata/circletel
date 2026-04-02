'use client';

import React, { Suspense, useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { PiCheckCircleBold, PiSpinnerBold, PiWarningBold, PiPhoneBold } from 'react-icons/pi';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

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

  // Fire confetti when order loads successfully
  useEffect(() => {
    if (!order) return;

    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    return () => clearInterval(interval);
  }, [order]);

  if (loading) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <PiSpinnerBold className="w-12 h-12 text-circleTel-orange mx-auto mb-4 animate-spin" />
          <p className="text-gray-600 font-medium">Confirming your order…</p>
          <p className="text-sm text-gray-400 mt-1">Please wait while we verify your payment</p>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
          <PiWarningBold className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-1">Order submitted</h1>
          <p className="text-sm text-gray-400 mb-1">
            Reference: <span className="font-mono font-semibold text-gray-600">{paymentReference}</span>
          </p>
          <p className="text-sm text-gray-400 mb-6">{error}</p>
          <a
            href="https://wa.me/27824873900"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-medium text-sm"
          >
            <PiPhoneBold /> Contact us on WhatsApp
          </a>
        </div>
      </div>
    );
  }

  const phoneUnverified = order && !order.phone?.startsWith('verified:');

  return (
    <div className="max-w-md mx-auto space-y-4">
      {/* Success card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
        {/* Icon */}
        <div className="flex items-center justify-center w-20 h-20 bg-green-50 rounded-full mx-auto mb-5">
          <PiCheckCircleBold className="w-12 h-12 text-green-500" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-1">Successful!</h1>
        <p className="text-gray-500 text-sm mb-6">
          Congratulations on your purchase, {order?.first_name || 'you&apos;re'} all set.
        </p>

        {/* Order summary line items */}
        {order && (
          <div className="bg-gray-50 rounded-xl p-4 text-sm text-left space-y-2.5 mb-6">
            <div className="flex justify-between">
              <span className="text-gray-500">Order</span>
              <span className="font-mono font-semibold text-gray-700">{order.order_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Package</span>
              <span className="text-gray-700 font-medium">{order.package_name}</span>
            </div>
            {order.package_speed && (
              <div className="flex justify-between">
                <span className="text-gray-500">Speed</span>
                <span className="text-gray-700">{order.package_speed}</span>
              </div>
            )}
            <div className="border-t border-gray-200 pt-2.5 flex justify-between">
              <span className="text-gray-500">Monthly fee</span>
              <span className="font-semibold text-gray-900">R{order.package_price}/mo</span>
            </div>
          </div>
        )}

        {/* Phone verification banner */}
        {phoneUnverified && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-left mb-5">
            <p className="text-sm font-medium text-amber-800">Verify your phone number</p>
            <p className="text-xs text-amber-600 mt-0.5 mb-2">
              Required before we can schedule your installation.
            </p>
            <Link
              href="/dashboard/profile?verify=phone"
              className="text-xs font-semibold text-amber-700 underline"
            >
              Verify now →
            </Link>
          </div>
        )}

        {/* Primary CTA */}
        <Button
          onClick={() => router.push('/dashboard')}
          className="w-full bg-circleTel-orange hover:bg-orange-600 text-white font-semibold rounded-xl py-3 text-sm"
        >
          Continue
        </Button>
        <button
          onClick={() => router.push('/')}
          className="mt-3 text-xs text-gray-400 hover:text-gray-600 w-full"
        >
          Return to home
        </button>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="max-w-md mx-auto p-8 text-center">
        <PiSpinnerBold className="w-10 h-10 text-circleTel-orange mx-auto animate-spin" />
      </div>
    }>
      <ConfirmationContent />
    </Suspense>
  );
}
