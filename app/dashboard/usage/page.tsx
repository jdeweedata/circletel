'use client';

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Activity,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  TrendingUp,
  Zap,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

interface UsageData {
  service: {
    id: string;
    package_name: string;
    service_type: string;
    speed_down: number;
    speed_up: number;
    monthly_price: number;
  };
  currentMonth: {
    downloadGB: number;
    uploadGB: number;
    totalGB: number;
    averageSpeed: number;
    peakSpeed: number;
  };
  speedTests: Array<{
    id: string;
    date: string;
    downloadSpeed: number;
    uploadSpeed: number;
    ping: number;
  }>;
}

function UsagePageContent() {
  const searchParams = useSearchParams();
  const serviceId = searchParams.get('service');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<UsageData | null>(null);
  const [runningSpeedTest, setRunningSpeedTest] = useState(false);

  useEffect(() => {
    if (!serviceId) {
      setError("No service ID provided");
      setLoading(false);
      return;
    }

    // Simulate API call - replace with actual API endpoint
    setTimeout(() => {
      setData({
        service: {
          id: serviceId,
          package_name: "Fibre 100Mbps Uncapped",
          service_type: "fibre",
          speed_down: 100,
          speed_up: 100,
          monthly_price: 799,
        },
        currentMonth: {
          downloadGB: 245.5,
          uploadGB: 52.3,
          totalGB: 297.8,
          averageSpeed: 87.5,
          peakSpeed: 98.2,
        },
        speedTests: [
          {
            id: "1",
            date: "2025-10-26 14:30",
            downloadSpeed: 98.2,
            uploadSpeed: 97.5,
            ping: 12,
          },
          {
            id: "2",
            date: "2025-10-25 09:15",
            downloadSpeed: 95.8,
            uploadSpeed: 96.1,
            ping: 15,
          },
          {
            id: "3",
            date: "2025-10-24 18:45",
            downloadSpeed: 92.3,
            uploadSpeed: 93.7,
            ping: 14,
          },
        ],
      });
      setLoading(false);
    }, 800);
  }, [serviceId]);

  const handleRunSpeedTest = () => {
    setRunningSpeedTest(true);
    // Simulate speed test - replace with actual speed test logic
    setTimeout(() => {
      setRunningSpeedTest(false);
      // Refresh data or add new speed test result
    }, 5000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-circleTel-orange" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{error || "Failed to load usage data"}</p>
            <Link href="/dashboard">
              <Button className="mt-4 bg-circleTel-orange hover:bg-orange-600">
                Back to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Usage & Performance</h1>
          <p className="text-base text-gray-600 mt-2">
            Monitor your data usage and internet speeds
          </p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>

      {/* Service Info Card */}
      <Card className="border-2 border-circleTel-orange/30 bg-gradient-to-br from-orange-50 to-white">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900">{data.service.package_name}</h2>
              <p className="text-sm text-gray-600 mt-1 capitalize">
                {data.service.service_type} • R{data.service.monthly_price}/month
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-600">Download Speed</p>
                <p className="text-2xl font-extrabold text-blue-600">{data.service.speed_down} Mbps</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-600">Upload Speed</p>
                <p className="text-2xl font-extrabold text-green-600">{data.service.speed_up} Mbps</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Usage */}
        <Card className="shadow-md hover:shadow-xl transition-all duration-300 border-2">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600">Total Usage</p>
                <p className="text-3xl font-extrabold text-gray-900 mt-2">
                  {data.currentMonth.totalGB.toFixed(1)} GB
                </p>
                <p className="text-xs text-gray-500 mt-1">This month</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Activity className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Download Usage */}
        <Card className="shadow-md hover:shadow-xl transition-all duration-300 border-2">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600">Downloaded</p>
                <p className="text-3xl font-extrabold text-blue-600 mt-2">
                  {data.currentMonth.downloadGB.toFixed(1)} GB
                </p>
                <p className="text-xs text-gray-500 mt-1">This month</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <ArrowDown className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload Usage */}
        <Card className="shadow-md hover:shadow-xl transition-all duration-300 border-2">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600">Uploaded</p>
                <p className="text-3xl font-extrabold text-green-600 mt-2">
                  {data.currentMonth.uploadGB.toFixed(1)} GB
                </p>
                <p className="text-xs text-gray-500 mt-1">This month</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <ArrowUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Average Speed */}
        <Card className="shadow-md hover:shadow-xl transition-all duration-300 border-2">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600">Avg Speed</p>
                <p className="text-3xl font-extrabold text-orange-600 mt-2">
                  {data.currentMonth.averageSpeed.toFixed(1)} Mbps
                </p>
                <p className="text-xs text-gray-500 mt-1">Download average</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Speed Test Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-gray-900">Speed Test History</CardTitle>
              <p className="text-sm text-gray-600 mt-1">Recent speed test results</p>
            </div>
            <Button
              onClick={handleRunSpeedTest}
              disabled={runningSpeedTest}
              className="bg-circleTel-orange hover:bg-orange-600"
            >
              {runningSpeedTest ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Test...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Run Speed Test
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {data.speedTests.length > 0 ? (
            <div className="space-y-4">
              {data.speedTests.map((test) => (
                <div
                  key={test.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-2 border-gray-200 hover:border-circleTel-orange transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Activity className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{test.date}</p>
                      <p className="text-xs text-gray-500">Speed test completed</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-xs font-semibold text-gray-600">Download</p>
                      <p className="text-lg font-extrabold text-blue-600">{test.downloadSpeed} Mbps</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-semibold text-gray-600">Upload</p>
                      <p className="text-lg font-extrabold text-green-600">{test.uploadSpeed} Mbps</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-semibold text-gray-600">Ping</p>
                      <p className="text-lg font-extrabold text-gray-900">{test.ping} ms</p>
                    </div>
                    {test.downloadSpeed >= data.service.speed_down * 0.8 ? (
                      <Badge className="bg-green-100 text-green-800 border-green-300">Excellent</Badge>
                    ) : test.downloadSpeed >= data.service.speed_down * 0.6 ? (
                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Good</Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800 border-red-300">Below Expected</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Activity className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-base">No speed tests recorded yet</p>
              <p className="text-sm mt-2">Run your first speed test to track performance</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Tips */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-blue-900 flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Performance Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>For best results, run speed tests when connected via Ethernet cable</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>Close background applications that may consume bandwidth during testing</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>Speeds may vary based on time of day and network congestion</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>If speeds are consistently below expected, contact support for assistance</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

export default function UsagePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-circleTel-orange" />
      </div>
    }>
      <UsagePageContent />
    </Suspense>
  );
}
