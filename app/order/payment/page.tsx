'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { TopProgressBar } from '@/components/order/TopProgressBar';
import { PackageSummary } from '@/components/order/PackageSummary';
import { useOrderContext } from '@/components/order/context/OrderContext';
import PaymentStage from '@/components/order/stages/PaymentStage';

export default function PaymentPage() {
  const router = useRouter();
  const { state } = useOrderContext();

  const handleBack = () => {
    router.push('/order/service-address');
  };

  const handleComplete = () => {
    router.push('/order/confirmation');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Progress Bar */}
      <TopProgressBar currentStep={3} />

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-6 sm:py-8 md:py-10 lg:py-12">
        {/* Package Summary */}
        {state.orderData.package?.selectedPackage && (
          <div className="max-w-4xl mx-auto mb-6">
            <PackageSummary package={state.orderData.package.selectedPackage} compact />
          </div>
        )}

        {/* Payment Stage Component */}
        <PaymentStage onComplete={handleComplete} onBack={handleBack} />
      </div>
    </div>
  );
}
