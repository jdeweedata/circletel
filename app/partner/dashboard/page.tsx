'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, DollarSign, TrendingUp, Clock, FileText, BarChart3, FolderOpen } from 'lucide-react'

interface PartnerStats {
  totalLeads: number
  activeLeads: number
  convertedThisMonth: number
  pendingCommission: number
  partnerStatus: string
  businessName: string
  tier: string
}

export default function PartnerDashboard() {
  const [stats, setStats] = useState<PartnerStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/partners/stats')
        const data = await response.json()

        if (!data.success) {
          setError(data.error || 'Failed to fetch stats')
          return
        }

        setStats(data.stats)
      } catch (err) {
        console.error('Error fetching stats:', err)
        setError('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const statsCards = [
    {
      title: 'Total Leads',
      value: loading ? null : stats?.totalLeads?.toString() || '0',
      description: 'Assigned to you',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Active Leads',
      value: loading ? null : stats?.activeLeads?.toString() || '0',
      description: 'In progress',
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'Converted',
      value: loading ? null : stats?.convertedThisMonth?.toString() || '0',
      description: 'This month',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Commission',
      value: loading ? null : formatCurrency(stats?.pendingCommission || 0),
      description: 'Pending payout',
      icon: DollarSign,
      color: 'text-circleTel-orange',
      bgColor: 'bg-orange-100',
    },
  ]

  const isApproved = stats?.partnerStatus === 'approved'
  const isPending = stats?.partnerStatus === 'pending' || stats?.partnerStatus === 'under_review'

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-circleTel-darkNeutral">
          Partner Dashboard
        </h1>
        <p className="text-circleTel-secondaryNeutral mt-2">
          {loading ? (
            <Skeleton className="h-5 w-64" />
          ) : (
            <>Welcome back, {stats?.businessName || 'Partner'}!</>
          )}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-9 w-24" />
                ) : (
                  <div className="text-3xl font-bold text-circleTel-darkNeutral">
                    {stat.value}
                  </div>
                )}
                <p className="text-xs text-circleTel-secondaryNeutral mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-2 border-red-300 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Dashboard</CardTitle>
            <CardDescription className="text-red-500">{error}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Welcome Message / Onboarding Status - Show for pending partners */}
      {!loading && isPending && (
        <Card className="border-2 border-circleTel-orange">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span className="text-circleTel-orange">🎉</span>
              <span>Welcome to CircleTel Partner Program!</span>
            </CardTitle>
            <CardDescription>
              Your partner application is pending approval. Once approved, you'll be able to manage leads and earn commissions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-circleTel-orange text-white flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div>
                <p className="font-medium text-circleTel-darkNeutral">Complete your profile</p>
                <p className="text-sm text-circleTel-secondaryNeutral">Update your business information</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-300 text-white flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div>
                <p className="font-medium text-gray-400">Upload verification documents</p>
                <p className="text-sm text-gray-400">KYC documents required for approval</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-300 text-white flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div>
                <p className="font-medium text-gray-400">Wait for approval</p>
                <p className="text-sm text-gray-400">We'll review your application within 48 hours</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Partner Tier Badge - Show for approved partners */}
      {!loading && isApproved && stats?.tier && (
        <Card className="border-2 border-green-300 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span className="text-green-600">✓</span>
              <span>Active Partner - {stats.tier.charAt(0).toUpperCase() + stats.tier.slice(1)} Tier</span>
            </CardTitle>
            <CardDescription className="text-green-700">
              Your account is approved and active. Start managing your leads and earning commissions!
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/partner/leads">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">View Leads</CardTitle>
                  <CardDescription>Manage your assigned leads</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/partner/commissions">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-orange-100">
                  <BarChart3 className="h-5 w-5 text-circleTel-orange" />
                </div>
                <div>
                  <CardTitle className="text-lg">Check Commissions</CardTitle>
                  <CardDescription>Track your earnings</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/partner/resources">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-purple-100">
                  <FolderOpen className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Access Resources</CardTitle>
                  <CardDescription>Download marketing materials</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  )
}
