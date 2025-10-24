'use client';

import React from 'react';
import { OrderBreadcrumb } from '@/components/order/OrderBreadcrumb';
import PaymentStage from '@/components/order/stages/PaymentStage';

export default function PaymentPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Breadcrumb Navigation */}
      <OrderBreadcrumb />

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-6 sm:py-8 md:py-10 lg:py-12">
        {/* Payment Stage Component */}
        <PaymentStage />
      </div>
    </div>
  );
}
