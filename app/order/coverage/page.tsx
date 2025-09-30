'use client';

import React from 'react';
import { useOrderContext } from '@/components/order/context/OrderContext';
import { OrderWizard } from '@/components/order/wizard/OrderWizard';
import { useRouter } from 'next/navigation';

export default function CoveragePage() {
  const router = useRouter();
  const { state, actions } = useOrderContext();

  // Set current stage to 1 when this page loads
  React.useEffect(() => {
    if (state.currentStage !== 1) {
      actions.setCurrentStage(1);
    }
  }, [state.currentStage, actions]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Check Coverage & Select Package
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          First, let's check if CircleTel services are available at your location
        </p>
      </div>

      <OrderWizard
        onStageComplete={(stage) => {
          router.push('/order/account');
        }}
        onOrderComplete={() => {
          router.push('/order/confirmation');
        }}
      >
        <div className="py-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Coverage Check
            </h2>
            <p className="text-gray-600 mb-6">
              This stage will integrate with the existing coverage checking components.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800">
                🚧 Coverage checking integration coming in OSI-001-02
              </p>
            </div>
          </div>
        </div>
      </OrderWizard>
    </div>
  );
}