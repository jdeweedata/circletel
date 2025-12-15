'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { ArrowUp, ArrowDown, HardDrive, RefreshCw } from 'lucide-react'
import { format, parseISO } from 'date-fns'

interface UsageDataPoint {
  time: string
  uploadMb: number
  downloadMb: number
  totalMb: number
}

interface UsageSummary {
  totalUploadGb: number
  totalDownloadGb: number
  totalCombinedGb: number
  dataPoints: number
}

interface UsageChartProps {
  data: UsageDataPoint[]
  summary: UsageSummary | null
  aggregation: 'hourly' | 'daily' | 'weekly' | 'monthly'
  onAggregationChange?: (aggregation: 'hourly' | 'daily' | 'weekly' | 'monthly') => void
  onRefresh?: () => void
  isLoading?: boolean
  title?: string
}

export function UsageChart({
  data,
  summary,
  aggregation,
  onAggregationChange,
  onRefresh,
  isLoading = false,
  title = 'Data Usage',
}: UsageChartProps) {
  const [showUpload, setShowUpload] = useState(true)
  const [showDownload, setShowDownload] = useState(true)

  // Format data for chart
  const chartData = data.map((point) => ({
    ...point,
    formattedTime:
      aggregation === 'hourly'
        ? format(parseISO(point.time), 'HH:mm')
        : aggregation === 'daily'
        ? format(parseISO(point.time), 'MMM d')
        : aggregation === 'weekly'
        ? format(parseISO(point.time), 'MMM d')
        : format(parseISO(point.time), 'MMM yyyy'),
  }))

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) => {
    if (!active || !payload?.length) return null

    return (
      <div className="bg-white p-3 border rounded-lg shadow-lg">
        <p className="font-medium text-sm mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-600">{entry.name}:</span>
            <span className="font-medium">{entry.value.toFixed(2)} MB</span>
          </div>
        ))}
      </div>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 w-32 bg-gray-200 animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-gray-100 animate-pulse rounded" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            {title}
          </CardTitle>
          <div className="flex items-center gap-2">
            {onAggregationChange && (
              <Select value={aggregation} onValueChange={(v) => onAggregationChange(v as typeof aggregation)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            )}
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        {summary && (
          <div className="flex items-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <ArrowUp className="h-4 w-4 text-green-500" />
              <span className="text-gray-600">Upload:</span>
              <span className="font-medium">{summary.totalUploadGb.toFixed(2)} GB</span>
            </div>
            <div className="flex items-center gap-2">
              <ArrowDown className="h-4 w-4 text-blue-500" />
              <span className="text-gray-600">Download:</span>
              <span className="font-medium">{summary.totalDownloadGb.toFixed(2)} GB</span>
            </div>
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-purple-500" />
              <span className="text-gray-600">Total:</span>
              <span className="font-medium">{summary.totalCombinedGb.toFixed(2)} GB</span>
            </div>
          </div>
        )}

        {/* Legend toggles */}
        <div className="flex items-center gap-4 mt-4">
          <Button
            variant={showUpload ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowUpload(!showUpload)}
            className={showUpload ? 'bg-green-500 hover:bg-green-600' : ''}
          >
            <ArrowUp className="h-3 w-3 mr-1" />
            Upload
          </Button>
          <Button
            variant={showDownload ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowDownload(!showDownload)}
            className={showDownload ? 'bg-blue-500 hover:bg-blue-600' : ''}
          >
            <ArrowDown className="h-3 w-3 mr-1" />
            Download
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-80 flex items-center justify-center text-gray-500">
            No usage data available for this period
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="uploadGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="downloadGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="formattedTime"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickFormatter={(value) => `${value} MB`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {showUpload && (
                  <Area
                    type="monotone"
                    dataKey="uploadMb"
                    name="Upload"
                    stroke="#22c55e"
                    fill="url(#uploadGradient)"
                    strokeWidth={2}
                  />
                )}
                {showDownload && (
                  <Area
                    type="monotone"
                    dataKey="downloadMb"
                    name="Download"
                    stroke="#3b82f6"
                    fill="url(#downloadGradient)"
                    strokeWidth={2}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
