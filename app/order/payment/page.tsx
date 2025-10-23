'use client';

import React from 'react';
import { useOrderContext } from '@/components/order/context/OrderContext';
import { OrderBreadcrumb } from '@/components/order/OrderBreadcrumb';
import { useRouter } from 'next/navigation';
import PaymentStage from '@/components/order/stages/PaymentStage';

export default function PaymentPage() {
  const router = useRouter();
  const { state, actions } = useOrderContext();

  // Redirect to verification - payment is no longer part of the main flow
  React.useEffect(() => {
    // Payment should happen after KYC verification, not before
    router.push('/order/verification');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Breadcrumb Navigation */}
      <OrderBreadcrumb />

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-6 sm:py-8 md:py-10 lg:py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-circleTel-darkNeutral">
            Redirecting...
          </h1>
          <p className="mt-2 text-lg text-circleTel-secondaryNeutral">
            Please complete verification first
          </p>
        </div>
      </div>
    </div>
  );
}
