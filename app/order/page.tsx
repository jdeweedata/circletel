'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOrderContext } from '@/components/order/context/OrderContext';
import { OrderWizard } from '@/components/order/wizard/OrderWizard';

export default function OrderPage() {
  const router = useRouter();
  const { state } = useOrderContext();

  // Redirect to first stage
  useEffect(() => {
    router.push('/order/coverage');
  }, [router]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Order Your Internet Service
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Get connected with CircleTel's reliable internet services
        </p>
      </div>

      <OrderWizard
        onStageComplete={(stage) => {
          console.log(`Stage ${stage} completed`);
        }}
        onOrderComplete={() => {
          router.push('/order/confirmation');
        }}
      >
        <div className="text-center py-8">
          <p className="text-gray-500">Redirecting to coverage check...</p>
        </div>
      </OrderWizard>
    </div>
  );
}