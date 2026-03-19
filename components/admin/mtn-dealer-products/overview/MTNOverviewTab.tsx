import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatCard } from '@/components/admin/shared/StatCard';
import { PiPackageBold, PiCalendarBold, PiDeviceMobileBold, PiCurrencyDollarBold, PiCellSignalFullBold, PiCalculatorBold } from 'react-icons/pi';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TECHNOLOGY_OPTIONS, CONTRACT_TERM_OPTIONS, MTN_COMMISSION_TIERS } from '@/lib/types/mtn-dealer-products';

interface MTNOverviewTabProps {
  stats: any;
  formatCurrency: (amount: number) => string;
}

export function MTNOverviewTab({ stats, formatCurrency }: MTNOverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Products"
          value={stats?.stats?.total || 0}
          icon={PiPackageBold}
          subValue={`${stats?.stats?.by_status?.active || 0} active`}
        />
        <StatCard
          title="Current Deals"
          value={stats?.stats?.current_deals || 0}
          icon={PiCalendarBold}
          subValue="Within promo period"
        />
        <StatCard
          title="With Device"
          value={stats?.stats?.by_device?.with_device || 0}
          icon={PiDeviceMobileBold}
          subValue={`${stats?.stats?.by_device?.sim_only || 0} SIM only`}
        />
        <StatCard
          title="Price Range"
          value={stats?.stats?.price_range ? `${formatCurrency(stats.stats.price_range.min)} - ${formatCurrency(stats.stats.price_range.max)}` : '-'}
          icon={PiCurrencyDollarBold}
          subValue={stats?.stats?.price_range ? `Avg: ${formatCurrency(stats.stats.price_range.avg)}` : ''}
        />
      </div>
      
      {/* Technology & Contract Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PiCellSignalFullBold className="h-5 w-5 text-circleTel-orange" />
              By Technology
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {TECHNOLOGY_OPTIONS.map(tech => (
                <div key={tech.value} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{tech.label}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-circleTel-orange rounded-full"
                        style={{
                          width: `${((stats?.stats?.by_technology?.[tech.value] || 0) / (stats?.stats?.total || 1)) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-gray-500 w-12 text-right">
                      {stats?.stats?.by_technology?.[tech.value] || 0}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PiCalendarBold className="h-5 w-5 text-circleTel-orange" />
              By Contract Term
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {CONTRACT_TERM_OPTIONS.map(term => {
                const key = term.value === 0 ? 'month_to_month' : `${term.value}_months`;
                return (
                  <div key={term.value} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{term.label}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{
                            width: `${((stats?.stats?.by_contract_term?.[key] || 0) / (stats?.stats?.total || 1)) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm text-gray-500 w-12 text-right">
                        {stats?.stats?.by_contract_term?.[key] || 0}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Commission Tiers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PiCalculatorBold className="h-5 w-5 text-circleTel-orange" />
            Commission Structure (Arlan Contract)
          </CardTitle>
          <CardDescription>
            CircleTel receives 30% of MTN commissions from Arlan Communications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subscription Tier</TableHead>
                <TableHead className="text-right">MTN Rate</TableHead>
                <TableHead className="text-right">CircleTel Share</TableHead>
                <TableHead className="text-right">Effective Rate</TableHead>
                <TableHead className="text-right">Products</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MTN_COMMISSION_TIERS.map(tier => (
                <TableRow key={tier.tier}>
                  <TableCell className="font-medium">{tier.tier}</TableCell>
                  <TableCell className="text-right">{tier.mtn_rate}%</TableCell>
                  <TableCell className="text-right">{tier.circletel_share}%</TableCell>
                  <TableCell className="text-right font-semibold text-circleTel-orange">
                    {tier.effective_rate.toFixed(3)}%
                  </TableCell>
                  <TableCell className="text-right">
                    {stats?.stats?.by_commission_tier?.[tier.tier] || 0}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
