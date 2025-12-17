'use client';

/**
 * Business Dashboard Home Page
 *
 * Overview page showing journey progress, key metrics, and next actions.
 *
 * @module app/business/dashboard/page
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  FileText,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Wifi,
  CreditCard,
  Phone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { JourneyProgressTracker } from '@/components/business-dashboard/journey';
import { B2B_JOURNEY_STAGES, JourneyStageId, JourneyProgress } from '@/lib/business/journey-config';
import { JOURNEY_STAGE_NAV } from '@/components/business-dashboard/navigation';

// ============================================================================
// Types
// ============================================================================

interface DashboardData {
  businessCustomer: {
    id: string;
    company_name: string;
    account_number: string;
    account_status: string;
    kyc_status: string;
    primary_contact_name: string;
    primary_contact_email: string;
  } | null;
  journey: JourneyProgress | null;
  stats: {
    activeServices: number;
    pendingQuotes: number;
    openTickets: number;
    unpaidInvoices: number;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    timestamp: string;
  }>;
}

// ============================================================================
// Quick Actions Component
// ============================================================================

function QuickActions({ journey }: { journey: JourneyProgress | null }) {
  if (!journey) return null;

  const currentStageNav = JOURNEY_STAGE_NAV[journey.currentStage];
  const stage = B2B_JOURNEY_STAGES.find((s) => s.id === journey.currentStage);

  return (
    <Card className="border-circleTel-orange/30 bg-gradient-to-br from-white to-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-circleTel-orange" />
          Your Next Step
        </CardTitle>
        <CardDescription>
          Complete this step to continue your journey
        </CardDescription>
      </CardHeader>
      <CardContent>
        {journey.blockedStage ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-red-800">Action Required</p>
                <p className="text-sm text-red-600 mt-1">
                  {journey.blockedReason || 'Your journey is blocked. Please contact support for assistance.'}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 border-red-300 text-red-700 hover:bg-red-50"
                  asChild
                >
                  <Link href="/business/dashboard/support">
                    Contact Support
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        ) : currentStageNav && stage ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-circleTel-orange/10 flex items-center justify-center">
                <stage.icon className="h-6 w-6 text-circleTel-orange" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{stage.title}</p>
                <p className="text-sm text-gray-600">{stage.description}</p>
              </div>
            </div>
            <Button className="w-full bg-circleTel-orange hover:bg-orange-600" asChild>
              <Link href={currentStageNav.href}>
                {stage.nextAction}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        ) : (
          <div className="text-center py-4">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <p className="font-medium text-green-700">All steps completed!</p>
            <p className="text-sm text-gray-600 mt-1">
              Your business account is fully set up.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Stats Cards Component
// ============================================================================

function StatsCards({ stats, loading }: { stats: DashboardData['stats'] | null; loading: boolean }) {
  const cards = [
    {
      title: 'Active Services',
      value: stats?.activeServices ?? 0,
      icon: Wifi,
      href: '/business/dashboard/services',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Pending Quotes',
      value: stats?.pendingQuotes ?? 0,
      icon: FileText,
      href: '/business/dashboard/quotes',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Open Tickets',
      value: stats?.openTickets ?? 0,
      icon: Phone,
      href: '/business/dashboard/support',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Unpaid Invoices',
      value: stats?.unpaidInvoices ?? 0,
      icon: CreditCard,
      href: '/business/dashboard/billing',
      color: stats?.unpaidInvoices ? 'text-red-600' : 'text-gray-600',
      bgColor: stats?.unpaidInvoices ? 'bg-red-50' : 'bg-gray-50',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-8 w-8 rounded-lg mb-3" />
              <Skeleton className="h-8 w-12 mb-1" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Link key={card.title} href={card.href}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="pt-6">
              <div className={`h-10 w-10 rounded-lg ${card.bgColor} flex items-center justify-center mb-3`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-sm text-gray-600">{card.title}</p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

// ============================================================================
// Recent Activity Component
// ============================================================================

function RecentActivity({ activities, loading }: { activities: DashboardData['recentActivity']; loading: boolean }) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-4">No recent activity</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                <Clock className="h-4 w-4 text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{activity.title}</p>
                <p className="text-sm text-gray-600 truncate">{activity.description}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(activity.timestamp).toLocaleDateString('en-ZA', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function BusinessDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/business-dashboard/summary');
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setData(result.data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Mock data for initial development
  const mockData: DashboardData = {
    businessCustomer: {
      id: 'mock-id',
      company_name: 'Your Company',
      account_number: 'CT-B-2025-00001',
      account_status: 'pending_verification',
      kyc_status: 'not_started',
      primary_contact_name: 'Business User',
      primary_contact_email: 'user@company.co.za',
    },
    journey: {
      customerId: 'mock-id',
      currentStage: 'business_verification',
      currentStep: 2,
      completedStages: ['quote_request'],
      progressPercentage: 17,
      stages: [
        { stageId: 'quote_request', status: 'completed' },
        { stageId: 'business_verification', status: 'in_progress' },
        { stageId: 'site_details', status: 'pending' },
        { stageId: 'contract', status: 'pending' },
        { stageId: 'installation', status: 'pending' },
        { stageId: 'go_live', status: 'pending' },
      ],
    },
    stats: {
      activeServices: 0,
      pendingQuotes: 1,
      openTickets: 0,
      unpaidInvoices: 0,
    },
    recentActivity: [
      {
        id: '1',
        type: 'quote',
        title: 'Quote Created',
        description: 'Business Fibre 100Mbps quote submitted',
        timestamp: new Date().toISOString(),
      },
    ],
  };

  const displayData = data || mockData;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="h-6 w-6 text-circleTel-orange" />
            Welcome back
          </h1>
          <p className="text-gray-600 mt-1">
            {displayData.businessCustomer?.company_name || 'Your Business'} •{' '}
            <span className="font-mono text-sm">
              {displayData.businessCustomer?.account_number || 'Account Pending'}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={
              displayData.businessCustomer?.account_status === 'active'
                ? 'default'
                : 'secondary'
            }
          >
            {displayData.businessCustomer?.account_status?.replace('_', ' ') || 'Pending'}
          </Badge>
        </div>
      </div>

      {/* Journey Progress */}
      {displayData.journey && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-circleTel-orange" />
              Your Journey Progress
            </CardTitle>
            <CardDescription>
              Track your business onboarding from quote to go-live
            </CardDescription>
          </CardHeader>
          <CardContent>
            <JourneyProgressTracker
              progress={displayData.journey}
              variant="horizontal"
              showLabels
            />
          </CardContent>
        </Card>
      )}

      {/* Quick Actions & Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <QuickActions journey={displayData.journey} />
        </div>
        <div className="lg:col-span-2">
          <StatsCards stats={displayData.stats} loading={loading} />
        </div>
      </div>

      {/* Recent Activity */}
      <RecentActivity
        activities={displayData.recentActivity}
        loading={loading}
      />

      {/* Help Section */}
      <Card className="bg-gray-50">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 text-center sm:text-left">
              <p className="font-medium text-gray-900">Need assistance?</p>
              <p className="text-sm text-gray-600">
                Our business support team is here to help you every step of the way.
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/business/dashboard/support">
                Contact Support
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
