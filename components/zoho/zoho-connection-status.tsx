'use client';

import { useZohoConnection } from '@/hooks/use-zoho-mcp';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';

export function ZohoConnectionStatus() {
  const { data, isLoading, error, refetch } = useZohoConnection();

  const getStatusColor = () => {
    if (isLoading) return 'secondary';
    if (error || !data?.success) return 'destructive';
    return 'default';
  };

  const getStatusIcon = () => {
    if (isLoading) return <Loader2 className="h-4 w-4 animate-spin" />;
    if (error || !data?.success) return <XCircle className="h-4 w-4" />;
    return <CheckCircle2 className="h-4 w-4" />;
  };

  const getStatusText = () => {
    if (isLoading) return 'Testing Connection...';
    if (error) return 'Connection Error';
    if (!data?.success) return 'Connection Failed';
    return 'Connected';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Zoho MCP Connection
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Test
          </Button>
        </CardTitle>
        <CardDescription>
          Status of your Zoho MCP server connection
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-4">
          <Badge variant={getStatusColor()} className="flex items-center gap-1">
            {getStatusIcon()}
            {getStatusText()}
          </Badge>
        </div>

        {data?.success && data.data && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">MCP Server:</span>
              <span className="font-mono">{data.data.mcpServerStatus}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">CRM Access:</span>
              <span className="font-mono">{data.data.crmTestStatus}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Tested:</span>
              <span className="font-mono">
                {new Date(data.data.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        )}

        {(error || (data && !data.success)) && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">
              {error?.message || data?.error || 'Unknown connection error'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}