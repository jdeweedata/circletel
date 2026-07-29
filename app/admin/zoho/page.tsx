import { Metadata } from 'next';
import { ZohoConnectionStatus } from '@/components/zoho/zoho-connection-status';
import { ZohoLeadForm } from '@/components/zoho/zoho-lead-form';
import { ZohoQuickActions } from '@/components/zoho/zoho-quick-actions';

import {
  AdminPage,
  PageHeader,
  DetailPageHeader,
  StatCard,
  SectionCard,
  StatusBadge,
  LoadingState,
  EmptyState,
  ErrorState,
  type StatusVariant,
} from '@/components/backend';


export const metadata: Metadata = {
  title: 'Zoho Integration | CircleTel Admin',
  description: 'Manage Zoho MCP integration and perform quick actions',
};

export default function ZohoPage() {
  return (
    <AdminPage>
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
    </AdminPage>
  );
}
