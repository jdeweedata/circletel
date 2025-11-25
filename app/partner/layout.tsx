'use client';

import { usePathname } from 'next/navigation'
import { PermissionGate } from '@/components/rbac/PermissionGate'
import { PartnerNav } from '@/components/partners/PartnerNav'
import { PERMISSIONS } from '@/lib/rbac/permissions'

export default function PartnersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  // Public routes that don't require authentication
  const isPublicRoute = pathname?.startsWith('/partner/onboarding') || pathname === '/partner/login'

  // If it's a public onboarding route, render without auth
  if (isPublicRoute) {
    return <>{children}</>
  }

  // Protected partner portal routes
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
