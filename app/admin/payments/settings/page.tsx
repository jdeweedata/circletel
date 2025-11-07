'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';

export default function PaymentSettingsPage() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payment Settings</h1>
        <p className="text-gray-600 mt-1">Configure payment provider settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Provider Configuration
          </CardTitle>
          <CardDescription>
            Coming soon: Configure NetCash, ZOHO Billing, PayFast, and PayGate settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <Settings className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">Provider Settings</p>
            <p className="text-sm mt-2">This feature is coming soon</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
