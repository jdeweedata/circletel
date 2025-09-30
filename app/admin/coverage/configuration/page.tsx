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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Plus, Trash2, Settings, Shield, Database, Globe, Image } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface NetworkProvider {
  id: string;
  name: string;
  displayName: string;
  enabled: boolean;
  type: 'api' | 'static';
  logo?: string;
  apiConfig?: {
    baseUrl: string;
    authMethod: 'none' | 'api_key' | 'oauth';
    apiKey?: string;
    rateLimitRpm: number;
    timeoutMs: number;
  };
  staticConfig?: {
    kmlFile?: string;
    kmzFile?: string;
    coverageAreas: string[];
  };
  serviceTypes: string[];
  priority: number;
}

interface CoverageFile {
  id: string;
  filename: string;
  type: 'kml' | 'kmz';
  providerId: string;
  uploadDate: string;
  fileSize: number;
  coverageAreas: string[];
}

export default function CoverageConfigurationPage() {
  const [providers, setProviders] = useState<NetworkProvider[]>([
    {
      id: 'mtn',
      name: 'mtn',
      displayName: 'MTN South Africa',
      enabled: true,
      type: 'api',
      logo: '/providers/mtn-logo.png',
      apiConfig: {
        baseUrl: 'https://mtnsi.mtn.co.za',
        authMethod: 'none',
        rateLimitRpm: 60,
        timeoutMs: 30000,
      },
      serviceTypes: ['5g', 'lte', '3g_900', '3g_2100', '2g', 'fibre', 'fixed_lte'],
      priority: 1,
    },
    {
      id: 'vodacom',
      name: 'vodacom',
      displayName: 'Vodacom',
      enabled: false,
      type: 'static',
      logo: '/providers/vodacom-logo.png',
      staticConfig: {
        kmlFile: 'vodacom-coverage.kml',
        coverageAreas: ['Gauteng', 'Western Cape', 'KwaZulu-Natal'],
      },
      serviceTypes: ['5g', 'lte', '3g', 'fibre'],
      priority: 2,
    },
  ]);

  const [coverageFiles, setCoverageFiles] = useState<CoverageFile[]>([
    {
      id: '1',
      filename: 'vodacom-coverage.kml',
      type: 'kml',
      providerId: 'vodacom',
      uploadDate: '2024-01-15T10:30:00Z',
      fileSize: 2456789,
      coverageAreas: ['Gauteng', 'Western Cape', 'KwaZulu-Natal'],
    },
  ]);

  const [newProvider, setNewProvider] = useState<Partial<NetworkProvider>>({
    type: 'api',
    enabled: true,
    priority: providers.length + 1,
    serviceTypes: [],
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  const addProvider = () => {
    if (!newProvider.name || !newProvider.displayName) return;

    const provider: NetworkProvider = {
      id: newProvider.name.toLowerCase().replace(/\s+/g, '_'),
      name: newProvider.name,
      displayName: newProvider.displayName,
      enabled: newProvider.enabled || false,
      type: newProvider.type || 'api',
      serviceTypes: newProvider.serviceTypes || [],
      priority: newProvider.priority || providers.length + 1,
      ...(newProvider.type === 'api' && {
        apiConfig: {
          baseUrl: '',
          authMethod: 'none',
          rateLimitRpm: 60,
          timeoutMs: 30000,
        },
      }),
      ...(newProvider.type === 'static' && {
        staticConfig: {
          coverageAreas: [],
        },
      }),
    };

    setProviders([...providers, provider]);
    setNewProvider({
      type: 'api',
      enabled: true,
      priority: providers.length + 2,
      serviceTypes: [],
    });
  };

  const updateProvider = (id: string, updates: Partial<NetworkProvider>) => {
    setProviders(providers.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProvider = (id: string) => {
    setProviders(providers.filter(p => p.id !== id));
    setCoverageFiles(coverageFiles.filter(f => f.providerId !== id));
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    setUploadingFile(true);

    // Simulate file upload
    await new Promise(resolve => setTimeout(resolve, 2000));

    const newFile: CoverageFile = {
      id: Math.random().toString(36).substr(2, 9),
      filename: selectedFile.name,
      type: selectedFile.name.endsWith('.kmz') ? 'kmz' : 'kml',
      providerId: 'custom',
      uploadDate: new Date().toISOString(),
      fileSize: selectedFile.size,
      coverageAreas: [],
    };

    setCoverageFiles([...coverageFiles, newFile]);
    setSelectedFile(null);
    setUploadingFile(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Coverage Configuration</h1>
        <p className="text-muted-foreground">
          Manage network providers, API configurations, and coverage maps
        </p>
      </div>

      <Tabs defaultValue="providers" className="space-y-6">
        <TabsList>
          <TabsTrigger value="providers">Network Providers</TabsTrigger>
          <TabsTrigger value="coverage-maps">Coverage Maps</TabsTrigger>
          <TabsTrigger value="api-settings">API Settings</TabsTrigger>
          <TabsTrigger value="system">System Config</TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add Network Provider
                </CardTitle>
                <CardDescription>
                  Add new telecommunications provider for coverage checking
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="provider-name">Provider Name</Label>
                    <Input
                      id="provider-name"
                      placeholder="e.g., Cell C"
                      value={newProvider.name || ''}
                      onChange={(e) => setNewProvider(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="display-name">Display Name</Label>
                    <Input
                      id="display-name"
                      placeholder="e.g., Cell C South Africa"
                      value={newProvider.displayName || ''}
                      onChange={(e) => setNewProvider(prev => ({ ...prev, displayName: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="provider-type">Provider Type</Label>
                    <Select
                      value={newProvider.type}
                      onValueChange={(value: 'api' | 'static') =>
                        setNewProvider(prev => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="api">API Integration</SelectItem>
                        <SelectItem value="static">Static Coverage Maps</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Input
                      id="priority"
                      type="number"
                      value={newProvider.priority || 1}
                      onChange={(e) => setNewProvider(prev => ({
                        ...prev,
                        priority: parseInt(e.target.value) || 1
                      }))}
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <Switch
                      id="enabled"
                      checked={newProvider.enabled}
                      onCheckedChange={(checked) =>
                        setNewProvider(prev => ({ ...prev, enabled: checked }))
                      }
                    />
                    <Label htmlFor="enabled">Enabled</Label>
                  </div>
                </div>

                <Button onClick={addProvider} className="w-full">
                  Add Provider
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configured Providers</CardTitle>
                <CardDescription>
                  Manage existing network providers and their configurations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {providers.map((provider) => (
                    <div
                      key={provider.id}
                      className="border rounded-lg p-4 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {provider.logo && (
                            <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                              <Image className="h-4 w-4" />
                            </div>
                          )}
                          <div>
                            <h4 className="font-medium">{provider.displayName}</h4>
                            <p className="text-sm text-muted-foreground">
                              {provider.type === 'api' ? 'API Integration' : 'Static Maps'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={provider.enabled ? 'default' : 'secondary'}>
                            {provider.enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateProvider(provider.id, { enabled: !provider.enabled })}
                          >
                            {provider.enabled ? 'Disable' : 'Enable'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteProvider(provider.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <Label className="text-xs text-muted-foreground">Priority</Label>
                          <div>{provider.priority}</div>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Service Types</Label>
                          <div>{provider.serviceTypes.length} types</div>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Configuration</Label>
                          <div>
                            {provider.type === 'api' ? (
                              provider.apiConfig?.baseUrl ? 'Configured' : 'Incomplete'
                            ) : (
                              provider.staticConfig?.kmlFile ? 'Maps loaded' : 'No maps'
                            )}
                          </div>
                        </div>
                      </div>

                      {provider.type === 'api' && provider.apiConfig && (
                        <div className="space-y-2 pt-2 border-t">
                          <Label className="text-sm font-medium">API Configuration</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              placeholder="Base URL"
                              value={provider.apiConfig.baseUrl}
                              onChange={(e) => updateProvider(provider.id, {
                                apiConfig: { ...provider.apiConfig!, baseUrl: e.target.value }
                              })}
                            />
                            <Input
                              placeholder="Rate limit (req/min)"
                              type="number"
                              value={provider.apiConfig.rateLimitRpm}
                              onChange={(e) => updateProvider(provider.id, {
                                apiConfig: {
                                  ...provider.apiConfig!,
                                  rateLimitRpm: parseInt(e.target.value) || 60
                                }
                              })}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="coverage-maps" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Coverage Maps
              </CardTitle>
              <CardDescription>
                Upload KML or KMZ files for static coverage fallback maps
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".kml,.kmz"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 mx-auto text-gray-400" />
                    <div className="text-sm text-gray-600">
                      {selectedFile ? selectedFile.name : 'Click to select KML/KMZ file'}
                    </div>
                  </div>
                </label>
              </div>

              {selectedFile && (
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">{selectedFile.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatFileSize(selectedFile.size)}
                    </div>
                  </div>
                  <Button
                    onClick={handleFileUpload}
                    disabled={uploadingFile}
                  >
                    {uploadingFile ? 'Uploading...' : 'Upload'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Uploaded Coverage Files</CardTitle>
              <CardDescription>
                Manage static coverage map files
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {coverageFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="space-y-1">
                      <div className="font-medium">{file.filename}</div>
                      <div className="text-sm text-muted-foreground">
                        {file.type.toUpperCase()} • {formatFileSize(file.fileSize)} •
                        Uploaded {new Date(file.uploadDate).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Coverage: {file.coverageAreas.join(', ')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{file.type.toUpperCase()}</Badge>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {coverageFiles.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No coverage files uploaded yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api-settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Global API Settings
              </CardTitle>
              <CardDescription>
                Configure global settings for coverage API integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Default Request Timeout (ms)</Label>
                    <Input type="number" defaultValue="30000" />
                  </div>
                  <div className="space-y-2">
                    <Label>Default Rate Limit (req/min)</Label>
                    <Input type="number" defaultValue="60" />
                  </div>
                  <div className="space-y-2">
                    <Label>Cache TTL (seconds)</Label>
                    <Input type="number" defaultValue="300" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Retry Attempts</Label>
                    <Input type="number" defaultValue="3" />
                  </div>
                  <div className="space-y-2">
                    <Label>Retry Delay (ms)</Label>
                    <Input type="number" defaultValue="1000" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="fallback-enabled" defaultChecked />
                    <Label htmlFor="fallback-enabled">Enable Static Fallback</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                System Configuration
              </CardTitle>
              <CardDescription>
                Global system settings and security configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Security Settings</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch id="cors-enabled" defaultChecked />
                      <Label htmlFor="cors-enabled">Enable CORS Protection</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="rate-limiting" defaultChecked />
                      <Label htmlFor="rate-limiting">Enable Rate Limiting</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="api-logging" defaultChecked />
                      <Label htmlFor="api-logging">Enable API Request Logging</Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Geographic Settings</h4>
                  <div className="space-y-2">
                    <Label>Default Country Code</Label>
                    <Select defaultValue="ZA">
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ZA">South Africa (ZA)</SelectItem>
                        <SelectItem value="US">United States (US)</SelectItem>
                        <SelectItem value="GB">United Kingdom (GB)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Coordinate Precision (decimal places)</Label>
                    <Input type="number" defaultValue="6" className="w-48" />
                  </div>
                </div>

                <Alert>
                  <Database className="h-4 w-4" />
                  <AlertDescription>
                    Configuration changes require application restart to take effect.
                    These settings are stored in environment variables and database configuration.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}