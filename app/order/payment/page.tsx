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

      {/* Package Summary */}
      {state.orderData.package?.selectedPackage && (
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto py-4">
            <PackageSummary package={state.orderData.package.selectedPackage} compact />
          </div>
        </div>
      )}

      {/* Payment Stage Component */}
      <PaymentStage onComplete={handleComplete} onBack={handleBack} />
    </div>
  );
}
