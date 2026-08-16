'use client';

import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { bytesToGb, formatBytesAsGb } from '@/lib/usage-reports/bytes';

interface StaffPoint {
  date: string;
  totalBytes: number;
}

interface StaffWifiUsageChartProps {
  siteId: string;
}

export default function StaffWifiUsageChart({ siteId }: StaffWifiUsageChartProps) {
  const [range, setRange] = useState<'7d' | '30d'>('7d');
  const [data, setData] = useState<StaffPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/portal/sites/${siteId}/staff-wifi?range=${range}`)
      .then((r) => r.json())
      .then((res) => setData(res.timeseries ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [siteId, range]);

  const chartData = data.map((point) => ({
    time: new Date(`${point.date}T12:00:00+02:00`).toLocaleDateString('en-ZA', {
      day: '2-digit',
      month: 'short',
    }),
    gb: Number(bytesToGb(point.totalBytes).toFixed(2)),
    totalBytes: point.totalBytes,
  }));

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
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[250px] text-sm text-gray-500">
            No Staff Wi-Fi samples in this period.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 11 }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                label={{ value: 'GB', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }}
              />
              <Tooltip
                formatter={(value: number, _name, item) => {
                  const payload = item?.payload as { totalBytes?: number } | undefined;
                  return [
                    payload?.totalBytes != null
                      ? formatBytesAsGb(payload.totalBytes)
                      : `${value} GB`,
                    'Staff Wi-Fi',
                  ];
                }}
              />
              <Line
                type="monotone"
                dataKey="gb"
                stroke="#E87A1E"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
