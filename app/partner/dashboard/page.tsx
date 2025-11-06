import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, DollarSign, TrendingUp, Clock } from 'lucide-react'

export const metadata = {
  title: 'Partner Dashboard | CircleTel',
  description: 'Sales partner dashboard overview',
}

export default function PartnerDashboard() {
  // TODO: Fetch real partner data from API
  const stats = [
    {
      title: 'Total Leads',
      value: '0',
      description: 'Assigned to you',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Active Leads',
      value: '0',
      description: 'In progress',
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'Converted',
      value: '0',
      description: 'This month',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Commission',
      value: 'R0.00',
      description: 'Pending payout',
      icon: DollarSign,
      color: 'text-circleTel-orange',
      bgColor: 'bg-orange-100',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-circleTel-darkNeutral">
          Partner Dashboard
        </h1>
        <p className="text-circleTel-secondaryNeutral mt-2">
          Welcome to your CircleTel partner portal
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
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
                <div className="text-3xl font-bold text-circleTel-darkNeutral">
                  {stat.value}
                </div>
                <p className="text-xs text-circleTel-secondaryNeutral mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Welcome Message / Onboarding Status */}
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="text-lg">View Leads</CardTitle>
            <CardDescription>Manage your assigned leads</CardDescription>
          </CardHeader>
        </Card>
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="text-lg">Check Commissions</CardTitle>
            <CardDescription>Track your earnings</CardDescription>
          </CardHeader>
        </Card>
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="text-lg">Access Resources</CardTitle>
            <CardDescription>Download marketing materials</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}
