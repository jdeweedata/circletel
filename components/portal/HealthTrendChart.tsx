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
  Legend,
} from 'recharts';

interface HealthPoint {
  health_score: number;
  connected_clients: number;
  created_at: string;
}

interface HealthTrendChartProps {
  siteId: string;
}

export default function HealthTrendChart({ siteId }: HealthTrendChartProps) {
  const [range, setRange] = useState<'7d' | '30d'>('7d');
  const [data, setData] = useState<HealthPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [noMonitoring, setNoMonitoring] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/portal/sites/${siteId}/health?range=${range}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.message) {
          setNoMonitoring(true);
          setData([]);
        } else {
          setNoMonitoring(false);
          setData(res.timeseries ?? []);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [siteId, range]);

  if (noMonitoring) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        Automated monitoring is not available for this site. Status is updated manually.
      </div>
    );
  }

  const chartData = data.map((point) => ({
    time: new Date(point.created_at).toLocaleDateString('en-ZA', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }),
    'Health Score': point.health_score,
    Clients: point.connected_clients,
  }));

  return (
    <div className="bg-white rounded-xl border">
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Health Trend</h3>
        <div className="flex gap-1">
          {(['7d', '30d'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
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
            No health data available for this period.
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
                yAxisId="health"
                domain={[0, 100]}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                label={{ value: 'Health %', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }}
              />
              <YAxis
                yAxisId="clients"
                orientation="right"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                label={{ value: 'Clients', angle: 90, position: 'insideRight', style: { fontSize: 11 } }}
              />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="health"
                type="monotone"
                dataKey="Health Score"
                stroke="#E87A1E"
                strokeWidth={2}
                dot={false}
              />
              <Line
                yAxisId="clients"
                type="monotone"
                dataKey="Clients"
                stroke="#3B82F6"
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
