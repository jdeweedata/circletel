'use client';
import { PiArrowUpRightBold, PiCalendarBold, PiCheckCircleBold, PiClockBold, PiCurrencyDollarBold, PiDownloadSimpleBold, PiTrendUpBold } from 'react-icons/pi';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface Ambassador {
  id: string;
  total_earnings: number;
  pending_earnings: number;
  commission_rate: number;
}

interface EarningPeriod {
  id: string;
  period_start: string;
  period_end: string;
  clicks: number;
  conversions: number;
  gross_revenue: number;
  commission_rate: number;
  gross_earnings: number;
  adjustments: number;
  net_earnings: number;
  status: string;
  paid_at: string | null;
  payment_reference: string | null;
}

interface RecentConversion {
  id: string;
  event_type: string;
  created_at: string;
  order_value: number | null;
  commission_amount: number | null;
  commission_status: string;
  tracking_code: string | null;
}

export default function AmbassadorEarningsPage() {
  const supabase = createClient();

  const [ambassador, setAmbassador] = useState<Ambassador | null>(null);
  const [earnings, setEarnings] = useState<EarningPeriod[]>([]);
  const [recentConversions, setRecentConversions] = useState<RecentConversion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        // Get ambassador
        const { data: ambassadorData } = await supabase
          .from('ambassadors')
          .select('id, total_earnings, pending_earnings, commission_rate')
          .eq('user_id', user.id)
          .single();

        if (!ambassadorData) return;

        setAmbassador(ambassadorData);

        // Fetch earnings periods
        const { data: earningsData } = await supabase
          .from('ambassador_earnings')
          .select('*')
          .eq('ambassador_id', ambassadorData.id)
          .order('period_start', { ascending: false })
          .limit(12);

        setEarnings(earningsData || []);

        // Fetch recent conversions
        const { data: conversionsData } = await supabase
          .from('attribution_logs')
          .select('id, event_type, created_at, order_value, commission_amount, commission_status, tracking_code')
          .eq('source_type', 'ambassador')
          .eq('source_id', ambassadorData.id)
          .in('event_type', ['order', 'payment'])
          .order('created_at', { ascending: false })
          .limit(20);

        setRecentConversions(conversionsData || []);
      } catch (error) {
        console.error('Error fetching earnings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase]);

  const formatPeriod = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${startDate.toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-blue-100 text-blue-700',
      processing: 'bg-purple-100 text-purple-700',
      paid: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
    };

    return (
      <span
        className={cn(
          'px-2 py-1 text-xs font-medium rounded-full capitalize',
          styles[status] || 'bg-gray-100 text-gray-700'
        )}
      >
        {status}
      </span>
    );
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

  // Calculate lifetime stats
  const lifetimePaid = earnings
    .filter((e) => e.status === 'paid')
    .reduce((sum, e) => sum + e.net_earnings, 0);

  const stats = [
    {
      label: 'Total Earned',
      value: `R${ambassador.total_earnings.toFixed(2)}`,
      icon: PiCurrencyDollarBold,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      label: 'Pending Payout',
      value: `R${ambassador.pending_earnings.toFixed(2)}`,
      icon: PiClockBold,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
    },
    {
      label: 'Total Paid Out',
      value: `R${lifetimePaid.toFixed(2)}`,
      icon: PiCheckCircleBold,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      label: 'Commission Rate',
      value: `${ambassador.commission_rate}%`,
      icon: PiTrendUpBold,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Earnings</h1>
        <p className="text-gray-500 mt-1">
          Track your commissions and payout history
        </p>
      </div>

      {/* Stats */}
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
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Payout History */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Payout History
            </h2>
            <button className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
              <PiDownloadSimpleBold className="w-4 h-4" />
              Export
            </button>
          </div>

          {earnings.length === 0 ? (
            <div className="text-center py-8">
              <PiCalendarBold className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No earnings history yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Your first payout will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {earnings.map((period) => (
                <div
                  key={period.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {formatPeriod(period.period_start, period.period_end)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {period.conversions} conversions · R
                      {period.gross_revenue.toFixed(0)} revenue
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      R{period.net_earnings.toFixed(2)}
                    </p>
                    {getStatusBadge(period.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Conversions */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Conversions
          </h2>

          {recentConversions.length === 0 ? (
            <div className="text-center py-8">
              <PiTrendUpBold className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No conversions yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Share your code to start earning
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentConversions.map((conversion) => (
                <div
                  key={conversion.id}
                  className="flex items-center justify-between py-3 border-b last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center',
                        conversion.commission_status === 'paid'
                          ? 'bg-green-100 text-green-600'
                          : conversion.commission_status === 'pending'
                          ? 'bg-yellow-100 text-yellow-600'
                          : 'bg-gray-100 text-gray-600'
                      )}
                    >
                      {conversion.commission_status === 'paid' ? (
                        <PiArrowUpRightBold className="w-4 h-4" />
                      ) : (
                        <PiClockBold className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Order via{' '}
                        <code className="text-xs bg-gray-100 px-1 rounded">
                          {conversion.tracking_code || 'direct'}
                        </code>
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(conversion.created_at).toLocaleDateString(
                          'en-ZA',
                          {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          }
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {conversion.order_value && (
                      <p className="text-xs text-gray-500">
                        R{conversion.order_value.toFixed(0)} order
                      </p>
                    )}
                    <p
                      className={cn(
                        'text-sm font-medium',
                        conversion.commission_status === 'paid'
                          ? 'text-green-600'
                          : 'text-gray-900'
                      )}
                    >
                      +R{(conversion.commission_amount || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* How Payouts Work */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 mb-2">How Payouts Work</h3>
        <ul className="text-sm text-blue-800 space-y-2">
          <li>
            • Commissions are calculated at the end of each month
          </li>
          <li>
            • You earn {ambassador.commission_rate}% of the order value for each
            conversion
          </li>
          <li>
            • Minimum payout threshold: R100
          </li>
          <li>
            • Payouts are processed within 7 business days after approval
          </li>
          <li>
            • Payments are made via bank transfer to your registered account
          </li>
        </ul>
      </div>
    </div>
  );
}
