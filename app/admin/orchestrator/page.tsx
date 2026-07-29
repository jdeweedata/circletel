'use client';

import { OrchestratorDashboard } from '@/components/admin/orchestrator/OrchestratorDashboard';
import { PermissionGate } from '@/components/rbac/PermissionGate';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { AdminPage, PageHeader } from '@/components/backend';

export default function OrchestratorPage() {
  return (
    <PermissionGate permissions={[PERMISSIONS.SYSTEM.VIEW_ORCHESTRATOR]}>
      <AdminPage>
        <PageHeader
          title="Orchestrator Dashboard"
          subtitle="Monitor AI agent workflows, track performance metrics, and manage multi-agent coordination"
        />
        <OrchestratorDashboard />
      </AdminPage>
    </PermissionGate>
  );
}
