// Admin Page: Coverage API Monitoring
import { ApiMonitoringDashboard } from '@/components/admin/coverage/ApiMonitoringDashboard';

export const metadata = {
  title: 'API Monitoring | CircleTel Admin',
  description: 'Real-time coverage API performance monitoring',
};

export default function CoverageMonitoringPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <ApiMonitoringDashboard />
    </div>
  );
}
