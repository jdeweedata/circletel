'use client';

import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { formatClinicShortName } from '@/lib/portal/site-format';
import { bytesToGb, formatBytesAsGb } from '@/lib/usage-reports/bytes';

interface ClinicUsage {
  siteId: string;
  siteName: string;
  totalBytes: number;
  rxBytes: number;
  txBytes: number;
}

interface StaffWifiUsageChartProps {
  currentSiteId: string;
}

export default function StaffWifiUsageChart({ currentSiteId }: StaffWifiUsageChartProps) {
  const [range, setRange] = useState<'7d' | '30d'>('7d');
  const [clinics, setClinics] = useState<ClinicUsage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/portal/sites/staff-wifi?range=${range}`)
      .then((r) => r.json())
      .then((res) => setClinics(res.clinics ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [range]);

  const chartData = clinics.map((clinic) => ({
    ...clinic,
    name: formatClinicShortName(clinic.siteName),
    gb: Number(bytesToGb(clinic.totalBytes).toFixed(2)),
  }));
  const hasSamples = clinics.some((clinic) => clinic.totalBytes > 0);
  const chartHeight = Math.max(250, chartData.length * 32);

  return (
    <div className="bg-white rounded-xl border">
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <h3
          className="text-[10px] font-extrabold tracking-[0.08em] uppercase"
          style={{ color: '#13274A' }}
        >
          Staff Wi-Fi usage
        </h3>
        <div className="flex gap-1">
          {(['7d', '30d'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`min-h-11 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                range === r
                  ? 'bg-circleTel-orange text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {r === '7d' ? '7 Days' : '30 Days'}
            </button>
          ))}
        </div>
      </div>
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center h-[250px]">
            <div className="w-8 h-8 border-4 border-circleTel-orange border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !hasSamples ? (
          <div className="flex items-center justify-center h-[250px] text-sm text-gray-500">
            No Staff Wi-Fi samples in this period.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                type="number"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                label={{ value: 'GB', position: 'insideBottom', offset: -2, style: { fontSize: 11 } }}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={110}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={(value: number, _name, item) => {
                  const payload = item?.payload as ClinicUsage | undefined;
                  return [
                    payload ? formatBytesAsGb(payload.totalBytes) : `${value} GB`,
                    'Staff Wi-Fi',
                  ];
                }}
              />
              <Bar dataKey="gb" radius={[0, 4, 4, 0]}>
                {chartData.map((clinic) => (
                  <Cell
                    key={clinic.siteId}
                    fill={clinic.siteId === currentSiteId ? '#E87A1E' : '#13274A'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
