'use client';

import React from 'react';
import { useOrderContext } from '@/components/order/context/OrderContext';
import { OrderWizard } from '@/components/order/wizard/OrderWizard';
import { useRouter } from 'next/navigation';

export default function InstallationPage() {
  const router = useRouter();
  const { state, actions } = useOrderContext();

  // Set current stage to 4 when this page loads
  React.useEffect(() => {
    if (state.currentStage !== 4) {
      actions.setCurrentStage(4);
    }
  }, [state.currentStage, actions]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Installation & Payment
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Schedule your installation and complete payment
        </p>
      </div>

      <OrderWizard
        onStageComplete={(stage) => {
          console.log('Final stage completed');
        }}
        onOrderComplete={() => {
          router.push('/order/confirmation');
        }}
      >
        <div className="py-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Installation Scheduling
            </h2>
            <p className="text-gray-600 mb-6">
              Installation scheduling and payment processing will be implemented here.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800">
                🚧 Installation stage implementation coming in OSI-001-05
              </p>
            </div>
          </div>
        </div>
      </OrderWizard>
    </div>
  );
}