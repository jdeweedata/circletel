'use client';

import React from 'react';
import { useOrderContext } from '@/components/order/context/OrderContext';
import { OrderWizard } from '@/components/order/wizard/OrderWizard';
import { useRouter } from 'next/navigation';
import PaymentStage from '@/components/order/stages/PaymentStage';

export default function PaymentPage() {
  const router = useRouter();
  const { state, actions } = useOrderContext();

  // Set current stage to 5 when this page loads
  React.useEffect(() => {
    if (state.currentStage !== 5) {
      actions.setCurrentStage(5);
    }
  }, [state.currentStage, actions]);

  const handlePaymentComplete = () => {
    console.log('Payment stage completed - redirecting to Netcash...');
    // The PaymentStage component handles the actual redirect
  };

  const handleBack = () => {
    router.push('/order/installation');
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-circleTel-darkNeutral">
          Complete Your Order
        </h1>
        <p className="mt-2 text-lg text-circleTel-secondaryNeutral">
          Review your order and proceed to secure payment
        </p>
      </div>

      <OrderWizard
        onStageComplete={handlePaymentComplete}
        onOrderComplete={handlePaymentComplete}
      >
        <PaymentStage
          onComplete={handlePaymentComplete}
          onBack={handleBack}
        />
      </OrderWizard>
    </div>
  );
}
