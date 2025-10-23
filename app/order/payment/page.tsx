'use client';

import React from 'react';
import { useOrderContext } from '@/components/order/context/OrderContext';
import { OrderBreadcrumb } from '@/components/order/OrderBreadcrumb';
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Breadcrumb Navigation */}
      <OrderBreadcrumb />

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-6 sm:py-8 md:py-10 lg:py-12">
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
    </div>
  );
}
