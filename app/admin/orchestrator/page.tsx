import { Metadata } from 'next';
import { OrchestratorDashboard } from '@/components/admin/orchestrator/OrchestratorDashboard';
import { PermissionGate } from '@/components/rbac/PermissionGate';
import { PERMISSIONS } from '@/lib/rbac/permissions';

export const metadata: Metadata = {
  title: 'Orchestrator Dashboard | CircleTel Admin',
  description: 'Monitor AI agent workflows and system performance',
};

export default function OrchestratorPage() {
  return (
    <PermissionGate permissions={[PERMISSIONS.SYSTEM.VIEW_ORCHESTRATOR]}>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-circleTel-darkNeutral">
            Orchestrator Dashboard
          </h1>
          <p className="mt-2 text-circleTel-secondaryNeutral">
            Monitor AI agent workflows, track performance metrics, and manage multi-agent coordination
          </p>
        </div>

        {/* Dashboard Component */}
        <OrchestratorDashboard />
      </div>
    </PermissionGate>
  );
}
