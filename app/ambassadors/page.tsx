'use client';
import { PiArrowSquareOutBold, PiArrowUpRightBold, PiCopyBold, PiCurrencyDollarBold, PiCursorClickBold, PiPlusBold, PiShoppingCartBold, PiTrendUpBold } from 'react-icons/pi';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Ambassador {
  id: string;
  full_name: string;
  ambassador_number: string | null;
  tier: string;
  commission_rate: number;
  total_clicks: number;
  total_conversions: number;
  total_earnings: number;
  pending_earnings: number;
}

interface AmbassadorCode {
  id: string;
  code: string;
  label: string | null;
  total_clicks: number;
  total_conversions: number;
  total_revenue: number;
  is_active: boolean;
}

interface RecentActivity {
  id: string;
  event_type: string;
  created_at: string;
  order_value: number | null;
  commission_amount: number | null;
}

export default function AmbassadorDashboard() {
  const supabase = createClient();

  const [ambassador, setAmbassador] = useState<Ambassador | null>(null);
  const [codes, setCodes] = useState<AmbassadorCode[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        // Fetch ambassador data
        const { data: ambassadorData } = await supabase
          .from('ambassadors')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (ambassadorData) {
          setAmbassador(ambassadorData);

          // Fetch codes
          const { data: codesData } = await supabase
            .from('ambassador_codes')
            .select('*')
            .eq('ambassador_id', ambassadorData.id)
            .order('created_at', { ascending: false })
            .limit(5);

          setCodes(codesData || []);

          // Fetch recent activity
          const { data: activityData } = await supabase
            .from('attribution_logs')
            .select('id, event_type, created_at, order_value, commission_amount')
            .eq('source_type', 'ambassador')
            .eq('source_id', ambassadorData.id)
            .order('created_at', { ascending: false })
            .limit(10);

          setRecentActivity(activityData || []);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase]);

  const copyToClipboard = async (code: string) => {
    const trackingUrl = `${window.location.origin}/t/${code}`;
    await navigator.clipboard.writeText(trackingUrl);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getConversionRate = () => {
    if (!ambassador || ambassador.total_clicks === 0) return '0';
    return ((ambassador.total_conversions / ambassador.total_clicks) * 100).toFixed(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-circleTel-orange border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!ambassador) {
    return null;
  }

  const stats = [
    {
      label: 'Total Clicks',
      value: ambassador.total_clicks.toLocaleString(),
      icon: PiCursorClickBold,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      label: 'Conversions',
      value: ambassador.total_conversions.toLocaleString(),
      icon: PiShoppingCartBold,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      subtext: `${getConversionRate()}% rate`,
    },
    {
      label: 'Total Earnings',
      value: `R${ambassador.total_earnings.toFixed(2)}`,
      icon: PiCurrencyDollarBold,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      label: 'Pending Payout',
      value: `R${ambassador.pending_earnings.toFixed(2)}`,
      icon: PiTrendUpBold,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
    },
  ];

  const tierInfo: Record<string, { rate: string; next: string | null }> = {
    starter: { rate: '5%', next: 'rising' },
    rising: { rate: '7.5%', next: 'star' },
    star: { rate: '10%', next: 'elite' },
    elite: { rate: '15%', next: null },
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-circleTel-orange to-orange-500 rounded-2xl p-6 sm:p-8 text-white">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              Welcome back, {ambassador.full_name.split(' ')[0]}!
            </h1>
            <p className="text-white/80">
              You&apos;re earning {ambassador.commission_rate}% commission as a{' '}
              <span className="font-semibold capitalize">{ambassador.tier}</span>{' '}
              ambassador.
            </p>
            {tierInfo[ambassador.tier]?.next && (
              <p className="text-sm text-white/60 mt-1">
                Keep converting to reach {tierInfo[ambassador.tier].next} tier!
              </p>
            )}
          </div>
          {ambassador.ambassador_number && (
            <div className="bg-white/10 rounded-lg px-4 py-2 self-start">
              <p className="text-xs text-white/60">Ambassador ID</p>
              <p className="font-mono font-semibold">{ambassador.ambassador_number}</p>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl p-5 border shadow-sm"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={cn('p-2 rounded-lg', stat.bgColor)}>
                <stat.icon className={cn('w-5 h-5', stat.color)} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
            {stat.subtext && (
              <p className="text-xs text-gray-400 mt-1">{stat.subtext}</p>
            )}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Quick Share */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Your Codes</h2>
            <Link
              href="/ambassadors/codes"
              className="text-sm text-circleTel-orange hover:underline flex items-center gap-1"
            >
              Manage <PiArrowUpRightBold className="w-3 h-3" />
            </Link>
          </div>

          {codes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">
                Create your first referral code to start earning!
              </p>
              <Link
                href="/ambassadors/codes"
                className="inline-flex items-center gap-2 px-4 py-2 bg-circleTel-orange text-white rounded-lg hover:bg-orange-600"
              >
                <PiPlusBold className="w-4 h-4" />
                Create Code
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {codes.map((code) => (
                <div
                  key={code.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <code className="text-sm font-mono font-semibold text-gray-900">
                      {code.code}
                    </code>
                    {code.label && (
                      <p className="text-xs text-gray-500">{code.label}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {code.total_clicks} clicks
                    </span>
                    <button
                      onClick={() => copyToClipboard(code.code)}
                      className={cn(
                        'p-2 rounded-lg transition-colors',
                        copiedCode === code.code
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                      )}
                      title="Copy tracking link"
                    >
                      {copiedCode === code.code ? (
                        <span className="text-xs">Copied!</span>
                      ) : (
                        <PiCopyBold className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activity
          </h2>

          {recentActivity.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                No activity yet. Share your code to get started!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity) => {
                const isConversion = ['order', 'payment'].includes(activity.event_type);
                return (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center',
                          isConversion
                            ? 'bg-green-100 text-green-600'
                            : 'bg-blue-100 text-blue-600'
                        )}
                      >
                        {isConversion ? (
                          <PiShoppingCartBold className="w-4 h-4" />
                        ) : (
                          <PiCursorClickBold className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 capitalize">
                          {activity.event_type.replace('_', ' ')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(activity.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {activity.commission_amount && (
                      <span className="text-sm font-medium text-green-600">
                        +R{activity.commission_amount.toFixed(2)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <Link
            href="/ambassadors/assets"
            className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="p-2 bg-purple-100 rounded-lg">
              <PiArrowSquareOutBold className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Marketing Assets</p>
              <p className="text-xs text-gray-500">Download banners & content</p>
            </div>
          </Link>

          <Link
            href="/ambassadors/codes"
            className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="p-2 bg-blue-100 rounded-lg">
              <Link className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Create New Code</p>
              <p className="text-xs text-gray-500">Generate tracking links</p>
            </div>
          </Link>

          <Link
            href="/ambassadors/earnings"
            className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="p-2 bg-green-100 rounded-lg">
              <PiCurrencyDollarBold className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">View Earnings</p>
              <p className="text-xs text-gray-500">Check payout history</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
