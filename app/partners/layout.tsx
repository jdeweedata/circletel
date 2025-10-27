import { PermissionGate } from '@/components/rbac/PermissionGate'
import { PartnerNav } from '@/components/partners/PartnerNav'
import { PERMISSIONS } from '@/lib/rbac/permissions'

export const metadata = {
  title: 'Partner Portal | CircleTel',
  description: 'Sales partner portal for CircleTel ISP',
}

export default function PartnersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PermissionGate permissions={[PERMISSIONS.PARTNERS.VIEW]}>
      <div className="flex min-h-screen bg-circleTel-lightNeutral">
        {/* Partner Navigation Sidebar */}
        <PartnerNav />

        {/* Main Content Area */}
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </PermissionGate>
  )
}
