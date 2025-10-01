'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { AlertCircle, CheckCircle, Clock, MapPin, TestTube, Zap } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TestResult {
  id: string;
  timestamp: string;
  endpoint: string;
  method: string;
  status: 'success' | 'error' | 'pending';
  responseTime: number;
  data: unknown;
  error?: string;
}

export default function CoverageTestingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [coordinates, setCoordinates] = useState({ lat: -26.2041, lng: 28.0473 });
  const [address, setAddress] = useState('Johannesburg, South Africa');
  const [includeSignalStrength, setIncludeSignalStrength] = useState(true);
  const [includeLocationInfo, setIncludeLocationInfo] = useState(true);

  const addTestResult = (result: Omit<TestResult, 'id' | 'timestamp'>) => {
    const newResult: TestResult = {
      ...result,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
    };
    setTestResults(prev => [newResult, ...prev.slice(0, 9)]);
  };

  const testCoverageCheck = async () => {
    setIsLoading(true);
    const startTime = Date.now();

    try {
      const response = await fetch('/api/coverage/mtn/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coordinates,
          includeSignalStrength,
        }),
      });

      const data = await response.json();
      const responseTime = Date.now() - startTime;

      addTestResult({
        endpoint: '/api/coverage/mtn/check',
        method: 'POST',
        status: response.ok ? 'success' : 'error',
        responseTime,
        data: response.ok ? data : null,
        error: response.ok ? undefined : data.error || 'Unknown error',
      });
    } catch (error) {
      addTestResult({
        endpoint: '/api/coverage/mtn/check',
        method: 'POST',
        status: 'error',
        responseTime: Date.now() - startTime,
        data: null,
        error: error instanceof Error ? error.message : 'Network error',
      });
    }

    setIsLoading(false);
  };

  const testGeoValidation = async () => {
    setIsLoading(true);
    const startTime = Date.now();

    try {
      const response = await fetch('/api/coverage/geo-validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coordinates,
          includeLocationInfo,
        }),
      });

      const data = await response.json();
      const responseTime = Date.now() - startTime;

      addTestResult({
        endpoint: '/api/coverage/geo-validate',
        method: 'POST',
        status: response.ok ? 'success' : 'error',
        responseTime,
        data: response.ok ? data : null,
        error: response.ok ? undefined : data.error || 'Unknown error',
      });
    } catch (error) {
      addTestResult({
        endpoint: '/api/coverage/geo-validate',
        method: 'POST',
        status: 'error',
        responseTime: Date.now() - startTime,
        data: null,
        error: error instanceof Error ? error.message : 'Network error',
      });
    }

    setIsLoading(false);
  };

  const testMonitoringStats = async () => {
    setIsLoading(true);
    const startTime = Date.now();

    try {
      const response = await fetch('/api/coverage/mtn/monitoring?action=stats&window=3600000');
      const data = await response.json();
      const responseTime = Date.now() - startTime;

      addTestResult({
        endpoint: '/api/coverage/mtn/monitoring',
        method: 'GET',
        status: response.ok ? 'success' : 'error',
        responseTime,
        data: response.ok ? data : null,
        error: response.ok ? undefined : data.error || 'Unknown error',
      });
    } catch (error) {
      addTestResult({
        endpoint: '/api/coverage/mtn/monitoring',
        method: 'GET',
        status: 'error',
        responseTime: Date.now() - startTime,
        data: null,
        error: error instanceof Error ? error.message : 'Network error',
      });
    }

    setIsLoading(false);
  };

  const testWithAddress = async () => {
    setIsLoading(true);
    const startTime = Date.now();

    try {
      const response = await fetch('/api/coverage/mtn/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          includeSignalStrength,
        }),
      });

      const data = await response.json();
      const responseTime = Date.now() - startTime;

      addTestResult({
        endpoint: '/api/coverage/mtn/check (address)',
        method: 'POST',
        status: response.ok ? 'success' : 'error',
        responseTime,
        data: response.ok ? data : null,
        error: response.ok ? undefined : data.error || 'Unknown error',
      });
    } catch (error) {
      addTestResult({
        endpoint: '/api/coverage/mtn/check (address)',
        method: 'POST',
        status: 'error',
        responseTime: Date.now() - startTime,
        data: null,
        error: error instanceof Error ? error.message : 'Network error',
      });
    }

    setIsLoading(false);
  };

  const runFullTestSuite = async () => {
    await testCoverageCheck();
    await new Promise(resolve => setTimeout(resolve, 500));
    await testGeoValidation();
    await new Promise(resolve => setTimeout(resolve, 500));
    await testMonitoringStats();
    await new Promise(resolve => setTimeout(resolve, 500));
    await testWithAddress();
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    const variants = {
      success: 'default',
      error: 'destructive',
      pending: 'secondary',
    } as const;

    return (
      <Badge variant={variants[status]} className="capitalize">
        {status}
      </Badge>
    );
  };

  const formatResponseTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Coverage Testing Tools</h1>
        <p className="text-muted-foreground">
          Test and validate coverage API endpoints with real data
        </p>
      </div>

      <Tabs defaultValue="manual" className="space-y-6">
        <TabsList>
          <TabsTrigger value="manual">Manual Testing</TabsTrigger>
          <TabsTrigger value="automated">Test Suite</TabsTrigger>
          <TabsTrigger value="results">Test Results</TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Test Parameters
                </CardTitle>
                <CardDescription>
                  Configure test coordinates and options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lat">Latitude</Label>
                    <Input
                      id="lat"
                      type="number"
                      step="0.000001"
                      value={coordinates.lat}
                      onChange={(e) => setCoordinates(prev => ({
                        ...prev,
                        lat: parseFloat(e.target.value) || 0
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lng">Longitude</Label>
                    <Input
                      id="lng"
                      type="number"
                      step="0.000001"
                      value={coordinates.lng}
                      onChange={(e) => setCoordinates(prev => ({
                        ...prev,
                        lng: parseFloat(e.target.value) || 0
                      }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address (for geocoding test)</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="signal-strength">Include Signal Strength</Label>
                  <Switch
                    id="signal-strength"
                    checked={includeSignalStrength}
                    onCheckedChange={setIncludeSignalStrength}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="location-info">Include Location Info</Label>
                  <Switch
                    id="location-info"
                    checked={includeLocationInfo}
                    onCheckedChange={setIncludeLocationInfo}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="h-5 w-5" />
                  Manual Tests
                </CardTitle>
                <CardDescription>
                  Run individual API endpoint tests
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={testCoverageCheck}
                  disabled={isLoading}
                  className="w-full justify-start"
                >
                  Test Coverage Check (Coordinates)
                </Button>

                <Button
                  onClick={testWithAddress}
                  disabled={isLoading}
                  className="w-full justify-start"
                  variant="outline"
                >
                  Test Coverage Check (Address)
                </Button>

                <Button
                  onClick={testGeoValidation}
                  disabled={isLoading}
                  className="w-full justify-start"
                  variant="outline"
                >
                  Test Geographic Validation
                </Button>

                <Button
                  onClick={testMonitoringStats}
                  disabled={isLoading}
                  className="w-full justify-start"
                  variant="outline"
                >
                  Test Monitoring Stats
                </Button>

                <Button
                  onClick={runFullTestSuite}
                  disabled={isLoading}
                  className="w-full justify-start"
                  variant="secondary"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Run Full Test Suite
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="automated" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Automated Test Suite</CardTitle>
              <CardDescription>
                Comprehensive testing with multiple scenarios and edge cases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Automated test suite will be implemented in a future update. This will include:
                  <ul className="mt-2 ml-4 list-disc list-inside space-y-1">
                    <li>Multiple coordinate validation scenarios</li>
                    <li>Edge case testing (invalid coordinates, network errors)</li>
                    <li>Performance benchmarking</li>
                    <li>Load testing with multiple concurrent requests</li>
                    <li>Service availability monitoring</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Test Results</CardTitle>
              <CardDescription>
                Latest API test results and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {testResults.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No test results yet. Run some tests to see results here.
                </div>
              ) : (
                <div className="space-y-4">
                  {testResults.map((result) => (
                    <div
                      key={result.id}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(result.status)}
                          <span className="font-medium">{result.endpoint}</span>
                          <Badge variant="outline">{result.method}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(result.status)}
                          <span className="text-sm text-muted-foreground">
                            {formatResponseTime(result.responseTime)}
                          </span>
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        {new Date(result.timestamp).toLocaleString()}
                      </div>

                      {result.error && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{result.error}</AlertDescription>
                        </Alert>
                      )}

                      {result.data && (
                        <details className="text-sm">
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                            View Response Data
                          </summary>
                          <Textarea
                            value={JSON.stringify(result.data, null, 2)}
                            readOnly
                            className="mt-2 font-mono text-xs"
                            rows={8}
                          />
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}