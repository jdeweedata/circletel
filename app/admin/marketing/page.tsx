'use client';
import { PiArrowRightBold, PiArrowsClockwiseBold, PiCalendarBold, PiChartBarBold, PiGiftBold, PiMegaphoneBold, PiPercentBold, PiPlusBold, PiSpinnerBold, PiTargetBold, PiTrendUpBold, PiUsersBold } from 'react-icons/pi';

/**
 * Marketing Dashboard
 *
 * Overview of marketing activities: promotions, campaigns, and performance metrics.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MarketingStats {
  activePromotions: number;
  totalRedemptions: number;
  conversionRate: number;
  revenueFromPromotions: number;
}

interface Promotion {
  id: string;
  name: string;
  promo_code: string;
  discount_type: string;
  discount_value: number;
  usage_count: number;
  status: string;
  valid_until: string | null;
}

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  href,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  trend?: { value: number; positive: boolean };
  href?: string;
}) {
  const content = (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="p-2 bg-circleTel-orange/10 rounded-lg">
          <Icon className="h-5 w-5 text-circleTel-orange" />
        </div>
        {trend && (
          <span
            className={cn(
              'text-sm font-medium flex items-center gap-1',
              trend.positive ? 'text-green-600' : 'text-red-600'
            )}
          >
            <PiTrendUpBold
              className={cn('h-4 w-4', !trend.positive && 'rotate-180')}
            />
            {trend.value}%
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {description && (
          <p className="text-xs text-gray-400 mt-1">{description}</p>
        )}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

function QuickAction({
  title,
  description,
  icon: Icon,
  href,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200 hover:border-circleTel-orange hover:shadow-sm transition-all group"
    >
      <div className="p-3 bg-gray-100 rounded-lg group-hover:bg-circleTel-orange/10 transition-colors">
        <Icon className="h-5 w-5 text-gray-600 group-hover:text-circleTel-orange transition-colors" />
      </div>
      <div className="flex-1">
        <p className="font-medium text-gray-900">{title}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <PiArrowRightBold className="h-5 w-5 text-gray-400 group-hover:text-circleTel-orange group-hover:translate-x-1 transition-all" />
    </Link>
  );
}

function RecentPromotionRow({ promotion }: { promotion: Promotion }) {
  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    draft: 'bg-gray-100 text-gray-600',
    paused: 'bg-yellow-100 text-yellow-700',
    expired: 'bg-red-100 text-red-700',
    archived: 'bg-gray-100 text-gray-500',
  };

  const discountLabel =
    promotion.discount_type === 'percentage'
      ? `${promotion.discount_value}% off`
      : promotion.discount_type === 'fixed'
        ? `R${promotion.discount_value} off`
        : promotion.discount_type === 'free_installation'
          ? 'Free Installation'
          : 'Free Month';

  return (
    <Link
      href={`/admin/marketing/promotions?id=${promotion.id}`}
      className="flex items-center justify-between py-3 px-4 hover:bg-gray-50 rounded-lg transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-circleTel-orange/10 rounded-lg">
          <PiGiftBold className="h-4 w-4 text-circleTel-orange" />
        </div>
        <div>
          <p className="font-medium text-gray-900">{promotion.name}</p>
          <p className="text-sm text-gray-500">
            {promotion.promo_code ? (
              <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">
                {promotion.promo_code}
              </code>
            ) : (
              discountLabel
            )}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          {promotion.usage_count} uses
        </span>
        <span
          className={cn(
            'px-2 py-1 text-xs font-medium rounded-full capitalize',
            statusColors[promotion.status] || statusColors.draft
          )}
        >
          {promotion.status}
        </span>
      </div>
    </Link>
  );
}

export default function MarketingDashboardPage() {
  const [stats, setStats] = useState<MarketingStats | null>(null);
  const [recentPromotions, setRecentPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch stats
      const statsRes = await fetch('/api/admin/marketing/stats');
      if (!statsRes.ok) throw new Error('Failed to fetch marketing stats');
      const statsData = await statsRes.json();
      setStats(statsData);

      // Fetch recent promotions
      const promoRes = await fetch('/api/admin/marketing/promotions?limit=5');
      if (!promoRes.ok) throw new Error('Failed to fetch promotions');
      const promoData = await promoRes.json();
      setRecentPromotions(promoData.promotions || []);
    } catch (err) {
      console.error('Error fetching marketing data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
      // Set default values on error
      setStats({
        activePromotions: 0,
        totalRedemptions: 0,
        conversionRate: 0,
        revenueFromPromotions: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketing</h1>
          <p className="text-gray-500 mt-1">
            Manage promotions, campaigns, and track marketing performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
          >
            <PiArrowsClockwiseBold
              className={cn('h-4 w-4 mr-2', loading && 'animate-spin')}
            />
            Refresh
          </Button>
          <Link href="/admin/marketing/promotions/new">
            <Button>
              <PiPlusBold className="h-4 w-4 mr-2" />
              New Promotion
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <PiSpinnerBold className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Active Promotions"
            value={stats?.activePromotions || 0}
            icon={PiMegaphoneBold}
            description="Currently running"
            href="/admin/marketing/promotions?status=active"
          />
          <StatCard
            title="Total Redemptions"
            value={stats?.totalRedemptions || 0}
            icon={PiGiftBold}
            description="This month"
            trend={{ value: 12, positive: true }}
          />
          <StatCard
            title="Conversion Rate"
            value={`${stats?.conversionRate || 0}%`}
            icon={PiTargetBold}
            description="Promo to purchase"
            trend={{ value: 3.2, positive: true }}
          />
          <StatCard
            title="Revenue Impact"
            value={`R${(stats?.revenueFromPromotions || 0).toLocaleString()}`}
            icon={PiChartBarBold}
            description="From promotions"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          <div className="space-y-3">
            <QuickAction
              title="Create Promotion"
              description="Set up a new discount or promo code"
              icon={PiPlusBold}
              href="/admin/marketing/promotions/new"
            />
            <QuickAction
              title="View All Promotions"
              description="Manage existing promotions"
              icon={PiPercentBold}
              href="/admin/marketing/promotions"
            />
            <QuickAction
              title="Campaign Analytics"
              description="View performance metrics"
              icon={PiChartBarBold}
              href="/admin/marketing/analytics"
            />
            <QuickAction
              title="Schedule Campaign"
              description="Plan future promotions"
              icon={PiCalendarBold}
              href="/admin/marketing/campaigns"
            />
          </div>
        </div>

        {/* Recent Promotions */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Promotions
            </h2>
            <Link
              href="/admin/marketing/promotions"
              className="text-sm text-circleTel-orange hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="bg-white rounded-xl border border-gray-200">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <PiSpinnerBold className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : recentPromotions.length === 0 ? (
              <div className="text-center py-12">
                <PiGiftBold className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No promotions yet</p>
                <Link href="/admin/marketing/promotions/new">
                  <Button variant="outline" className="mt-4">
                    <PiPlusBold className="h-4 w-4 mr-2" />
                    Create your first promotion
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentPromotions.map((promotion) => (
                  <RecentPromotionRow key={promotion.id} promotion={promotion} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Coming Soon Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-8 text-center">
          <PiUsersBold className="h-10 w-10 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">
            Ambassador Portal
          </h3>
          <p className="text-sm text-gray-500 mt-2">
            Brand ambassador management and referral tracking
          </p>
          <span className="inline-block mt-4 px-3 py-1 bg-gray-200 text-gray-600 text-xs font-medium rounded-full">
            Coming in Phase 2
          </span>
        </div>
        <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-8 text-center">
          <PiMegaphoneBold className="h-10 w-10 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">
            Social Media Integration
          </h3>
          <p className="text-sm text-gray-500 mt-2">
            Multi-platform content scheduling and analytics
          </p>
          <span className="inline-block mt-4 px-3 py-1 bg-gray-200 text-gray-600 text-xs font-medium rounded-full">
            Coming in Phase 4
          </span>
        </div>
      </div>
    </div>
  );
}
