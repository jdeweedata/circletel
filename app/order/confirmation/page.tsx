'use client';

import React from 'react';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function ConfirmationPage() {
  const router = useRouter();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="mb-6">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Order Confirmed!
          </h1>
          <p className="text-lg text-gray-600">
            Thank you for choosing CircleTel. Your order has been successfully submitted.
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            What happens next?
          </h2>
          <div className="text-left space-y-3">
            <div className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-circleTel-orange text-white text-sm font-bold rounded-full flex items-center justify-center">1</span>
              <p className="text-gray-700">You'll receive an order confirmation email shortly</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-circleTel-orange text-white text-sm font-bold rounded-full flex items-center justify-center">2</span>
              <p className="text-gray-700">Our team will contact you within 24 hours to coordinate installation</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-circleTel-orange text-white text-sm font-bold rounded-full flex items-center justify-center">3</span>
              <p className="text-gray-700">Professional installation will be scheduled at your preferred time</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Button
            onClick={() => router.push('/')}
            className="w-full bg-circleTel-orange hover:bg-circleTel-orange/90"
          >
            Return to Homepage
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/order/coverage')}
            className="w-full"
          >
            Place Another Order
          </Button>
        </div>
      </div>
    </div>
  );
}