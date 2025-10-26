'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { TopProgressBar } from '@/components/order/TopProgressBar';
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
    <div className="min-h-screen">
      {/* Enhanced Progress Bar */}
      <TopProgressBar currentStep={3} />

      {/* Payment Stage Component with integrated background */}
      <PaymentStage onComplete={handleComplete} onBack={handleBack} />
    </div>
  );
}
