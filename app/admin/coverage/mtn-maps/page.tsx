'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Map,
  Building2,
  Users,
  Loader2,
  ExternalLink,
  RefreshCw,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface MapViewerProps {
  url: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

function MapViewer({ url, title, description, icon }: MapViewerProps) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(url, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in New Tab
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsLoading(true)}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative w-full" style={{ height: '600px' }}>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg border">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Loading MTN coverage map...</p>
              </div>
            </div>
          )}
          <iframe
            src={url}
            className="w-full h-full rounded-lg border"
            onLoad={() => setIsLoading(false)}
            title={title}
            sandbox="allow-scripts allow-same-origin allow-popups"
          />
        </div>
      </CardContent>
    </Card>
  );
}

interface CoverageTestResult {
  coordinates: { lat: number; lng: number };
  mapType: 'consumer' | 'business';
  services: Array<{
    type: string;
    available: boolean;
    signal: string;
    technology?: string;
  }>;
  metadata: {
    capturedAt: string;
    mapVersion: string;
  };
}

export default function MTNMapsPage() {
  const [testLat, setTestLat] = useState('-25.9000');
  const [testLng, setTestLng] = useState('28.1800');
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<{
    consumer?: CoverageTestResult;
    business?: CoverageTestResult;
  }>({});

  const CONSUMER_MAP_URL = 'https://mtnsi.mtn.co.za/coverage/dev/v3/map3.html';
  const BUSINESS_MAP_URL =
    'https://mtnsi.mtn.co.za/coverage/dev/v3/map3.html?mc=busr-407a787d7e9949dbb2d8fc9a3d073976';

  const handleTestCoverage = async (mapType: 'consumer' | 'business') => {
    const lat = parseFloat(testLat);
    const lng = parseFloat(testLng);

    if (isNaN(lat) || isNaN(lng)) {
      toast.error('Invalid coordinates');
      return;
    }

    setIsTesting(true);
    try {
      const response = await fetch('/api/coverage/mtn/map-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coordinates: { lat, lng },
          mapType,
        }),
      });

      if (!response.ok) {
        throw new Error('Coverage check failed');
      }

      const data = await response.json();

      setTestResults((prev) => ({
        ...prev,
        [mapType]: data.data,
      }));

      toast.success(`${mapType} coverage check completed`);
    } catch (error) {
      console.error('Coverage test error:', error);
      toast.error('Failed to check coverage');
    } finally {
      setIsTesting(false);
    }
  };

  const renderTestResults = (result?: CoverageTestResult, type?: string) => {
    if (!result) {
      return (
        <div className="text-center py-8 text-gray-500">
          <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No test results yet. Run a coverage check to see results.</p>
        </div>
      );
    }

    const availableServices = result.services.filter((s) => s.available);
    const hasAnyCoverage = availableServices.length > 0;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">
              Coverage at {result.coordinates.lat.toFixed(4)}, {result.coordinates.lng.toFixed(4)}
            </h3>
            <p className="text-sm text-gray-600">
              Captured: {new Date(result.metadata.capturedAt).toLocaleString()}
            </p>
          </div>
          <Badge variant={hasAnyCoverage ? 'default' : 'secondary'} className="h-7">
            {hasAnyCoverage ? (
              <>
                <CheckCircle className="h-4 w-4 mr-1" />
                Coverage Available
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 mr-1" />
                No Coverage
              </>
            )}
          </Badge>
        </div>

        <div className="grid gap-3">
          {result.services.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <p>No service data captured from map</p>
            </div>
          ) : (
            result.services.map((service, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  service.available
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{service.type.toUpperCase()}</span>
                      {service.technology && (
                        <Badge variant="outline" className="text-xs">
                          {service.technology}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Signal: <span className="font-medium">{service.signal}</span>
                    </p>
                  </div>
                  {service.available ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : (
                    <XCircle className="h-6 w-6 text-gray-400" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">MTN Coverage Maps</h1>
        <p className="text-gray-600 mt-2">
          View and interact with MTN&apos;s consumer and business coverage maps
        </p>
      </div>

      {/* Coverage Testing Tool */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5 text-orange-500" />
            Coverage Testing Tool
          </CardTitle>
          <CardDescription>
            Test coverage at specific coordinates using both consumer and business maps
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="testLat">Latitude</Label>
              <Input
                id="testLat"
                type="number"
                step="0.0001"
                value={testLat}
                onChange={(e) => setTestLat(e.target.value)}
                placeholder="-25.9000"
              />
            </div>
            <div>
              <Label htmlFor="testLng">Longitude</Label>
              <Input
                id="testLng"
                type="number"
                step="0.0001"
                value={testLng}
                onChange={(e) => setTestLng(e.target.value)}
                placeholder="28.1800"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => handleTestCoverage('consumer')}
              disabled={isTesting}
              className="flex-1"
            >
              {isTesting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Users className="h-4 w-4 mr-2" />
              )}
              Test Consumer Map
            </Button>
            <Button
              onClick={() => handleTestCoverage('business')}
              disabled={isTesting}
              className="flex-1"
              variant="outline"
            >
              {isTesting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Building2 className="h-4 w-4 mr-2" />
              )}
              Test Business Map
            </Button>
          </div>

          {/* Test Results */}
          {(testResults.consumer || testResults.business) && (
            <Tabs defaultValue="consumer" className="mt-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="consumer">Consumer Results</TabsTrigger>
                <TabsTrigger value="business">Business Results</TabsTrigger>
              </TabsList>
              <TabsContent value="consumer" className="mt-4">
                {renderTestResults(testResults.consumer, 'consumer')}
              </TabsContent>
              <TabsContent value="business" className="mt-4">
                {renderTestResults(testResults.business, 'business')}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Map Viewers */}
      <Tabs defaultValue="consumer" className="space-y-4">
        <TabsList>
          <TabsTrigger value="consumer" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Consumer Map
          </TabsTrigger>
          <TabsTrigger value="business" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Business Map
          </TabsTrigger>
        </TabsList>

        <TabsContent value="consumer">
          <MapViewer
            url={CONSUMER_MAP_URL}
            title="MTN Consumer Coverage Map"
            description="Coverage for residential and personal use services"
            icon={<Users className="h-5 w-5 text-orange-500" />}
          />
        </TabsContent>

        <TabsContent value="business">
          <MapViewer
            url={BUSINESS_MAP_URL}
            title="MTN Business Coverage Map"
            description="Coverage for enterprise and business services"
            icon={<Building2 className="h-5 w-5 text-orange-500" />}
          />
        </TabsContent>
      </Tabs>

      {/* Map Information */}
      <Card>
        <CardHeader>
          <CardTitle>Coverage Map Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Consumer Map Features:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              <li>5G coverage areas</li>
              <li>LTE and LTE Advanced coverage</li>
              <li>3G coverage (2100MHz and 900MHz)</li>
              <li>2G fallback coverage</li>
              <li>Fixed LTE service areas</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Business Map Features:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              <li>Business wireless coverage</li>
              <li>Enterprise LTE services</li>
              <li>Business fibre availability</li>
              <li>Dedicated business network areas</li>
            </ul>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-gray-600">
              <strong>Note:</strong> These maps are provided by MTN and show real-time coverage
              data. Use the testing tool above to programmatically check coverage at specific
              coordinates.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
