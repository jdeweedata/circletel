import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/admin/layout/Sidebar'
import { AdminHeader } from '@/components/admin/layout/AdminHeader'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { Loader2 } from 'lucide-react'

export function AdminLayout() {
  const { user, isLoading, validateSession } = useAdminAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const location = useLocation()

  useEffect(() => {
    validateSession()
  }, [validateSession])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-circleTel-orange" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        user={user}
      />

      {/* Main content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <AdminHeader
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          user={user}
        />

        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}