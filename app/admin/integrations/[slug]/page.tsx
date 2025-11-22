'use client';

import { useState, useEffect, use } from 'react';
import { 
  ArrowLeft, 
  Activity, 
  Settings, 
  FileText, 
  Key, 
  Webhook, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Shield,
  Save,
  ExternalLink,
  Play,
  History
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

interface IntegrationDetail {
  integration: {
    id: string;
    name: string;
    slug: string;
    category: string;
    description: string;
    is_active: boolean;
    health_status: 'healthy' | 'degraded' | 'down' | 'unknown';
    health_last_checked_at: string;
    health_check_enabled: boolean;
    version: string;
    provider: string;
    docs_url: string;
    updated_at: string;
  };
  oauthTokens: {
    hasAccessToken: boolean;
    hasRefreshToken: boolean;
    expiresAt: string;
    lastRefreshedAt: string;
    refreshCount: number;
    scopes: string[];
  } | null;
  webhooks: {
    id: string;
    url: string;
    events: string[];
    is_active: boolean;
    created_at: string;
  }[];
  recentMetrics: {
    avgResponseTime: number;
    errorRate: number;
    uptime: number;
  };
  dailyMetrics: {
    metric_date: string;
    total_requests: number;
    successful_requests: number;
    failed_requests: number;
    avg_response_time_ms: number;
  }[];
  cronJobs: {
    id: string;
    name: string;
    schedule: string;
    last_run_at: string;
    next_run_at: string;
    is_active: boolean;
  }[];
  activityLogs: {
    id: string;
    action_type: string;
    action_description: string;
    created_at: string;
    action_result: 'success' | 'failure';
    performed_by_email: string;
  }[];
}

export default function IntegrationDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  // Unwrap params using React.use()
  const { slug } = use(params);
  
  const router = useRouter();
  const { toast } = useToast();
  
  const [data, setData] = useState<IntegrationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Local state for configuration form
  const [configForm, setConfigForm] = useState({
    is_active: false,
    health_check_enabled: false,
    description: ''
  });

  useEffect(() => {
    fetchData();
  }, [slug]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/integrations/${slug}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch integration details');
      }

      const result = await response.json();
      setData(result);
      
      // Initialize form state
      setConfigForm({
        is_active: result.integration.is_active,
        health_check_enabled: result.integration.health_check_enabled,
        description: result.integration.description || ''
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to load integration details',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    try {
      setIsSaving(true);
      const response = await fetch(`/api/admin/integrations/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configForm)
      });

      if (!response.ok) throw new Error('Failed to update integration');

      toast({
        title: 'Success',
        description: 'Integration settings updated successfully',
      });
      
      // Refresh data
      fetchData();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to save changes',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const statusConfig = {
    healthy: { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', icon: CheckCircle },
    degraded: { color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', icon: AlertTriangle },
    down: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: XCircle },
    unknown: { color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', icon: Activity }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f7f8fa]">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="h-8 w-8 animate-spin text-circleTel-orange" />
          <p className="text-muted-foreground">Loading integration details...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const StatusIcon = statusConfig[data.integration.health_status].icon;
  const statusStyle = statusConfig[data.integration.health_status];

  // Prepare chart data (reverse to show chronological order)
  const chartData = [...data.dailyMetrics].reverse().map(m => ({
    ...m,
    date: new Date(m.metric_date).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })
  }));

  return (
    <div className="w-full min-h-screen bg-[#f7f8fa] text-gray-800 p-6 md:p-10 space-y-8">
      {/* HEADER */}
      <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild className="mt-1">
            <Link href="/admin/integrations">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                {data.integration.name}
              </h1>
              <Badge className={`${statusStyle.bg} ${statusStyle.color} ${statusStyle.border} border`}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {data.integration.health_status.toUpperCase()}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {data.integration.description}
            </p>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                {data.integration.provider || 'Internal'}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Updated {new Date(data.integration.updated_at).toLocaleDateString()}
              </span>
              {data.integration.docs_url && (
                <a href={data.integration.docs_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-circleTel-orange hover:underline">
                  <ExternalLink className="h-3 w-3" />
                  Documentation
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleSaveChanges} disabled={isSaving} className="bg-circleTel-orange hover:bg-orange-600">
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-3xl grid-cols-4 bg-white shadow-sm p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-circleTel-orange data-[state=active]:text-white">
            Overview
          </TabsTrigger>
          <TabsTrigger value="configuration" className="data-[state=active]:bg-circleTel-orange data-[state=active]:text-white">
            Configuration
          </TabsTrigger>
          <TabsTrigger value="logs" className="data-[state=active]:bg-circleTel-orange data-[state=active]:text-white">
            Logs
          </TabsTrigger>
          <TabsTrigger value="health" className="data-[state=active]:bg-circleTel-orange data-[state=active]:text-white">
            Health History
          </TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Uptime (7d)</p>
                  <h3 className="text-2xl font-bold">{(data.recentMetrics.uptime * 100).toFixed(1)}%</h3>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <Activity className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Response</p>
                  <h3 className="text-2xl font-bold">{data.recentMetrics.avgResponseTime}ms</h3>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Error Rate</p>
                  <h3 className="text-2xl font-bold">{(data.recentMetrics.errorRate * 100).toFixed(2)}%</h3>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Details Column */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Response Time Trend (7 Days)</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorTime" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#F5831F" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#F5831F" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Area 
                          type="monotone" 
                          dataKey="avg_response_time_ms" 
                          stroke="#F5831F" 
                          fillOpacity={1} 
                          fill="url(#colorTime)" 
                          name="Response Time (ms)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      No metric data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Side Info Column */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Integration Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium">Active Status</label>
                      <p className="text-xs text-muted-foreground">Enable/Disable this integration</p>
                    </div>
                    <Switch 
                      checked={configForm.is_active}
                      onCheckedChange={(checked) => setConfigForm(prev => ({ ...prev, is_active: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium">Health Checks</label>
                      <p className="text-xs text-muted-foreground">Automatic monitoring</p>
                    </div>
                    <Switch 
                      checked={configForm.health_check_enabled}
                      onCheckedChange={(checked) => setConfigForm(prev => ({ ...prev, health_check_enabled: checked }))}
                    />
                  </div>
                </CardContent>
              </Card>

              {data.oauthTokens && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      OAuth Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Access Token:</span>
                      <Badge variant={data.oauthTokens.hasAccessToken ? 'outline' : 'destructive'} className={data.oauthTokens.hasAccessToken ? 'text-green-600 bg-green-50' : ''}>
                        {data.oauthTokens.hasAccessToken ? 'Valid' : 'Missing'}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Refresh Token:</span>
                      <Badge variant={data.oauthTokens.hasRefreshToken ? 'outline' : 'destructive'} className={data.oauthTokens.hasRefreshToken ? 'text-green-600 bg-green-50' : ''}>
                        {data.oauthTokens.hasRefreshToken ? 'Valid' : 'Missing'}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                      Expires: {new Date(data.oauthTokens.expiresAt).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* CONFIGURATION TAB */}
        <TabsContent value="configuration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Configure basic integration details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={configForm.description}
                  onChange={(e) => setConfigForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter a description for this integration..."
                />
              </div>
            </CardContent>
          </Card>

          {data.webhooks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Webhooks</CardTitle>
                <CardDescription>Configured webhook endpoints</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.webhooks.map((webhook) => (
                    <div key={webhook.id} className="flex items-start justify-between p-4 border rounded-lg">
                      <div>
                        <div className="flex items-center gap-2 font-medium">
                          <Webhook className="h-4 w-4 text-muted-foreground" />
                          {webhook.url}
                        </div>
                        <div className="flex gap-2 mt-2">
                          {webhook.events.map((event: string) => (
                            <Badge key={event} variant="secondary" className="text-xs">
                              {event}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Switch checked={webhook.is_active} disabled />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* LOGS TAB */}
        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>Recent actions and events</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.activityLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No activity logs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.activityLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{log.action_type}</div>
                          <div className="text-xs text-muted-foreground">{log.action_description}</div>
                        </TableCell>
                        <TableCell>{log.performed_by_email}</TableCell>
                        <TableCell>
                          <Badge variant={log.action_result === 'success' ? 'outline' : 'destructive'} 
                            className={log.action_result === 'success' ? 'text-green-600 bg-green-50 border-green-200' : ''}
                          >
                            {log.action_result}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* HEALTH HISTORY TAB */}
        <TabsContent value="health" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Request Volume (7 Days)</CardTitle>
            </CardHeader>
            <CardContent className="h-[350px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="successful_requests" name="Success" stackId="a" fill="#22c55e" />
                    <Bar dataKey="failed_requests" name="Failed" stackId="a" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No traffic data available
                </div>
              )}
            </CardContent>
          </Card>
          
          {data.cronJobs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Scheduled Jobs</CardTitle>
                <CardDescription>Status of background cron tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.cronJobs.map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <Clock className="h-5 w-5 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-medium">{job.name}</p>
                          <p className="text-xs text-muted-foreground">Schedule: {job.schedule}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">Next Run</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(job.next_run_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
