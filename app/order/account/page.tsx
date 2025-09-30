'use client';

import React from 'react';
import { useOrderContext } from '@/components/order/context/OrderContext';
import { OrderWizard } from '@/components/order/wizard/OrderWizard';
import { useRouter } from 'next/navigation';

export default function AccountPage() {
  const router = useRouter();
  const { state, actions } = useOrderContext();

  // Set current stage to 2 when this page loads
  React.useEffect(() => {
    if (state.currentStage !== 2) {
      actions.setCurrentStage(2);
    }
  }, [state.currentStage, actions]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Account Setup
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Create your account or sign in to continue
        </p>
      </div>

      <OrderWizard
        onStageComplete={(stage) => {
          router.push('/order/contact');
        }}
        onOrderComplete={() => {
          router.push('/order/confirmation');
        }}
      >
        <div className="py-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Account Registration
            </h2>
            <p className="text-gray-600 mb-6">
              Account setup and authentication forms will be implemented here.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800">
                🚧 Account stage implementation coming in OSI-001-03
              </p>
            </div>
          </div>
        </div>
      </OrderWizard>
    </div>
  );
}