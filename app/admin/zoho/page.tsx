import { Metadata } from 'next';
import { ZohoConnectionStatus } from '@/components/zoho/zoho-connection-status';
import { ZohoLeadForm } from '@/components/zoho/zoho-lead-form';
import { ZohoQuickActions } from '@/components/zoho/zoho-quick-actions';

export const metadata: Metadata = {
  title: 'Zoho Integration | CircleTel Admin',
  description: 'Manage Zoho MCP integration and perform quick actions',
};

export default function ZohoPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Zoho Integration</h1>
        <p className="text-muted-foreground">
          Manage your Zoho MCP integration and perform quick actions across Zoho apps.
        </p>
      </div>

      <div className="grid gap-8">
        {/* Connection Status */}
        <ZohoConnectionStatus />

        {/* Quick Actions */}
        <ZohoQuickActions />

        {/* Lead Creation Form */}
        <ZohoLeadForm />
      </div>
    </div>
  );
}