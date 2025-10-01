'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import AccountHeader from '@/components/billing/AccountHeader';
import AccountTabs from '@/components/billing/AccountTabs';
import BillingOverview from '@/components/billing/BillingOverview';
import TransactionsList from '@/components/billing/TransactionsList';
import CallDetailRecords from '@/components/billing/CallDetailRecords';
import CustomerDetailsSidebar from '@/components/billing/CustomerDetailsSidebar';
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionGate } from '@/components/rbac/PermissionGate';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import type { Transaction, CallDetailRecord, CustomerDetails } from '@/lib/types/billing';

export default function BillingDashboard() {
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);

  // Sample data - in production this would come from APIs
  const transactions: Transaction[] = [
    {
      id: '1',
      date: new Date('2025-01-17'),
      type: 'Debit',
      detail: 'Unlimited intro 30GB',
      amount: 46.00,
      tags: []
    },
    {
      id: '2',
      date: new Date('2025-01-17'),
      type: 'Discount',
      detail: 'Account setup promotion',
      amount: 12.00,
      tags: []
    },
    {
      id: '3',
      date: new Date('2025-01-17'),
      type: 'Debit',
      detail: 'Account setup',
      amount: 12.00,
      tags: []
    },
    {
      id: '4',
      date: new Date('2025-01-16'),
      type: 'Credit',
      detail: 'Payment received',
      amount: 50.00,
      tags: []
    }
  ];

  const callRecords: CallDetailRecord[] = [
    {
      id: '1',
      callDate: new Date('2025-01-13T08:30:00'),
      originatingNumber: '8714840852',
      receivingNumber: '2089914912',
      duration: 1830,
      charge: 2.10,
      direction: 'Outbound',
      voiceProduct: 'Long distance plan',
      carrier: 'CircleTel Communications',
      usageModifier: 'Default modifier',
      rateSchedule: 'Default rate schedule',
      invoiceNumber: '11234'
    },
    {
      id: '2',
      callDate: new Date('2025-01-12T12:30:00'),
      originatingNumber: '8714840852',
      receivingNumber: '2089914912',
      duration: 610,
      charge: 0.85,
      direction: 'Outbound',
      voiceProduct: 'Long distance plan',
      carrier: 'CircleTel Communications',
      usageModifier: 'Default modifier',
      rateSchedule: 'Default rate schedule',
      invoiceNumber: '11234'
    },
    {
      id: '3',
      callDate: new Date('2025-01-12T11:30:00'),
      originatingNumber: '2089914912',
      receivingNumber: '8714840852',
      duration: 1220,
      charge: 1.70,
      direction: 'Inbound',
      voiceProduct: 'Long distance plan',
      carrier: 'CircleTel Communications',
      usageModifier: 'Default modifier',
      rateSchedule: 'Default rate schedule',
      invoiceNumber: '11234'
    }
  ];

  const customerDetails: CustomerDetails = {
    accountType: 'Residential',
    firstName: 'Ramona',
    lastName: 'Simone',
    email: 'ramona.simone@gmail.com',
    mobilePhone: '+1 801-465-5200',
    homePhone: '+1 801-732-4848',
    physicalAddress: {
      street: '439 W. Utah ave',
      city: 'Payson',
      state: 'UT',
      zipCode: '84651',
      country: 'USA'
    },
    mailingAddress: {
      street: '439 W. Utah ave',
      city: 'Payson',
      state: 'UT',
      zipCode: '84651',
      country: 'USA'
    }
  };

  return (
    <div className="space-y-0">
      {/* Account Header */}
      <AccountHeader
        accountName="Ramona Simone"
        accountId="35510"
        workspace="CircleTel"
        status="Active"
      />

      {/* Account Tabs */}
      <AccountTabs />

      {/* Billing Overview Cards */}
      <BillingOverview
        currentInvoicePeriod="Jan 1, 2025 - Feb 1, 2025"
        dueDate="Jan 7, 2025"
        balanceDue={18.75}
        unpaid={false}
        nextRecurringCharge={67.00}
        nextChargeDate="Feb 17"
        currentBalance={18.75}
        availableFunds={25.00}
      />

      {/* Main Content */}
      <div className="px-6 py-4 space-y-6">
        {/* Transactions Section */}
        <div className="bg-white rounded-lg border border-gray-200">
          <TransactionsList transactions={transactions} />
        </div>

        {/* Call Detail Records Section */}
        <div className="bg-white rounded-lg border border-gray-200">
          <CallDetailRecords
            phoneNumber="2089914912"
            records={callRecords}
          />
        </div>

        {/* Billing Features Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            CircleTel Billing & Revenue Management
          </h2>
          <p className="text-gray-600 mb-6">
            Comprehensive billing solutions for telecommunications providers
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-lg mb-2 text-circleTel-orange">Payment Processors</h3>
              <p className="text-gray-600 text-sm">
                Integrated with major payment processors including Stripe, PayPal, and local South African providers.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-lg mb-2 text-circleTel-orange">Subscription Management</h3>
              <p className="text-gray-600 text-sm">
                Handle complex telecom subscriptions, data plans, voice packages, and usage-based billing.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-lg mb-2 text-circleTel-orange">Flexible Billing Cycles</h3>
              <p className="text-gray-600 text-sm">
                From monthly data packages to per-minute calling rates and custom enterprise billing.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Details Sidebar */}
      <CustomerDetailsSidebar
        isOpen={showCustomerDetails}
        onClose={() => setShowCustomerDetails(false)}
        details={customerDetails}
      />

      {/* Floating Action Button */}
      <Button
        onClick={() => setShowCustomerDetails(!showCustomerDetails)}
        className="fixed right-6 bottom-6 rounded-full h-14 w-14 shadow-lg bg-circleTel-orange hover:bg-circleTel-orange/90"
        size="lg"
      >
        {showCustomerDetails ? '✕' : '👤'}
      </Button>
    </div>
  );
}