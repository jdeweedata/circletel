'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Upload, Plus, Trash2, Settings, Shield, Database, Globe, Image,
  TestTube, CheckCircle, AlertCircle, Clock, Edit, Save, X
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { NetworkProvider, CoverageFile } from '@/lib/types/coverage-providers';

export default function ProvidersManagementPage() {
  const [providers, setProviders] = useState<NetworkProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [newProvider, setNewProvider] = useState<Partial<NetworkProvider>>({
    type: 'api',
    enabled: true,
    serviceTypes: [],
    priority: 1
  });
  const [uploadingLogo, setUploadingLogo] = useState<string | null>(null);
  const [uploadingCoverage, setUploadingCoverage] = useState<string | null>(null);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const response = await fetch('/api/admin/providers');
      const result = await response.json();

      if (result.success) {
        setProviders(result.data);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch providers',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Network error while fetching providers',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createProvider = async () => {
    if (!newProvider.name || !newProvider.displayName) {
      toast({
        title: 'Validation Error',
        description: 'Name and display name are required',
        variant: 'destructive'
      });
      return;
    }

    try {
      const response = await fetch('/api/admin/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProvider)
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Provider created successfully'
        });
        setNewProvider({
          type: 'api',
          enabled: true,
          serviceTypes: [],
          priority: providers.length + 1
        });
        fetchProviders();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to create provider',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Network error while creating provider',
        variant: 'destructive'
      });
    }
  };

  const updateProvider = async (id: string, updates: Partial<NetworkProvider>) => {
    try {
      const response = await fetch('/api/admin/providers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates })
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Provider updated successfully'
        });
        fetchProviders();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update provider',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Network error while updating provider',
        variant: 'destructive'
      });
    }
  };

  const deleteProvider = async (id: string) => {
    if (!confirm('Are you sure you want to delete this provider? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/providers?id=${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Provider deleted successfully'
        });
        fetchProviders();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to delete provider',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Network error while deleting provider',
        variant: 'destructive'
      });
    }
  };

  const testConnection = async (providerId: string) => {
    try {
      const response = await fetch(`/api/admin/providers/${providerId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test_connection' })
      });

      const result = await response.json();

      if (result.success) {
        const { status, message, responseTime } = result.data;
        toast({
          title: status === 'success' ? 'Connection Successful' : 'Connection Failed',
          description: `${message} (${responseTime}ms)`,
          variant: status === 'success' ? 'default' : 'destructive'
        });
      } else {
        toast({
          title: 'Test Failed',
          description: result.error || 'Failed to test connection',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Network error while testing connection',
        variant: 'destructive'
      });
    }
  };

  const uploadLogo = async (providerId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    setUploadingLogo(providerId);

    try {
      const response = await fetch(`/api/admin/providers/${providerId}/logo`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Logo uploaded successfully'
        });
        fetchProviders();
      } else {
        toast({
          title: 'Upload Failed',
          description: result.error || 'Failed to upload logo',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Network error while uploading logo',
        variant: 'destructive'
      });
    } finally {
      setUploadingLogo(null);
    }
  };

  const uploadCoverageFile = async (providerId: string, file: File, serviceTypes: string[]) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('serviceTypes', serviceTypes.join(','));

    setUploadingCoverage(providerId);

    try {
      const response = await fetch(`/api/admin/providers/${providerId}/coverage-files`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Coverage file uploaded successfully'
        });
        fetchProviders();
      } else {
        toast({
          title: 'Upload Failed',
          description: result.error || 'Failed to upload coverage file',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Network error while uploading coverage file',
        variant: 'destructive'
      });
    } finally {
      setUploadingCoverage(null);
    }
  };

  const serviceTypeOptions: ServiceType[] = [
    'fibre', 'fixed_lte', 'uncapped_wireless', 'licensed_wireless',
    '5g', 'lte', '3g_900', '3g_2100', '3g', '2g', 'satellite', 'microwave', 'dsl', 'cable'
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading providers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Network Providers</h1>
        <p className="text-muted-foreground">
          Manage telecommunications providers and their coverage integrations
        </p>
      </div>

      <Tabs defaultValue="providers" className="space-y-6">
        <TabsList>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="add-provider">Add Provider</TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-6">
          <div className="grid gap-6">
            {providers.map((provider) => (
              <Card key={provider.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {provider.logo ? (
                        <img
                          src={provider.logo}
                          alt={`${provider.displayName} logo`}
                          className="w-10 h-10 object-contain rounded"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                          <Image className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <CardTitle>{provider.displayName}</CardTitle>
                        <CardDescription>
                          {provider.type === 'api' ? 'API Integration' : 'Static Coverage Maps'} •
                          Priority {provider.priority}
                        </CardDescription>
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
                        onClick={() => setEditingProvider(
                          editingProvider === provider.id ? null : provider.id
                        )}
                      >
                        <Edit className="h-4 w-4" />
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
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <Label className="text-xs text-muted-foreground">Service Types</Label>
                      <div className="flex flex-wrap gap-1">
                        {provider.serviceTypes.slice(0, 3).map(type => (
                          <Badge key={type} variant="outline" className="text-xs">
                            {type.toUpperCase()}
                          </Badge>
                        ))}
                        {provider.serviceTypes.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{provider.serviceTypes.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Configuration</Label>
                      <div>
                        {provider.type === 'api' ? (
                          provider.apiConfig?.baseUrl ? 'API Configured' : 'Needs Setup'
                        ) : (
                          'Static Maps'
                        )}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Coverage Files</Label>
                      <div>
                        {provider.coverageFiles?.length || 0} files
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Actions</Label>
                      <div className="flex gap-1">
                        {provider.type === 'api' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => testConnection(provider.id)}
                          >
                            <TestTube className="h-3 w-3" />
                          </Button>
                        )}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Upload className="h-3 w-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Upload Files for {provider.displayName}</DialogTitle>
                              <DialogDescription>
                                Upload logo and coverage files for this provider
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Provider Logo</Label>
                                <Input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) uploadLogo(provider.id, file);
                                  }}
                                  disabled={uploadingLogo === provider.id}
                                />
                              </div>
                              <div>
                                <Label>Coverage File (KML/KMZ)</Label>
                                <Input
                                  type="file"
                                  accept=".kml,.kmz"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) uploadCoverageFile(provider.id, file, provider.serviceTypes);
                                  }}
                                  disabled={uploadingCoverage === provider.id}
                                />
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>

                  {editingProvider === provider.id && (
                    <div className="border-t pt-4 space-y-4">
                      <h4 className="font-medium">Edit Provider Configuration</h4>
                      {provider.type === 'api' && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Base URL</Label>
                            <Input
                              placeholder="https://api.provider.com"
                              defaultValue={provider.apiConfig?.baseUrl}
                              onBlur={(e) => updateProvider(provider.id, {
                                apiConfig: {
                                  ...provider.apiConfig,
                                  baseUrl: e.target.value
                                }
                              })}
                            />
                          </div>
                          <div>
                            <Label>Rate Limit (req/min)</Label>
                            <Input
                              type="number"
                              defaultValue={provider.apiConfig?.rateLimitRpm}
                              onBlur={(e) => updateProvider(provider.id, {
                                apiConfig: {
                                  ...provider.apiConfig,
                                  rateLimitRpm: parseInt(e.target.value) || 60
                                }
                              })}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {providers.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">No providers configured yet</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="add-provider" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add New Provider
              </CardTitle>
              <CardDescription>
                Configure a new telecommunications provider
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Provider Name *</Label>
                  <Input
                    placeholder="e.g., cell-c"
                    value={newProvider.name || ''}
                    onChange={(e) => setNewProvider(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Display Name *</Label>
                  <Input
                    placeholder="e.g., Cell C South Africa"
                    value={newProvider.displayName || ''}
                    onChange={(e) => setNewProvider(prev => ({ ...prev, displayName: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Provider Type *</Label>
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
                <div>
                  <Label>Priority</Label>
                  <Input
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
                    checked={newProvider.enabled}
                    onCheckedChange={(checked) =>
                      setNewProvider(prev => ({ ...prev, enabled: checked }))
                    }
                  />
                  <Label>Enabled</Label>
                </div>
              </div>

              <div>
                <Label>Service Types</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {serviceTypeOptions.map(type => (
                    <div key={type} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newProvider.serviceTypes?.includes(type)}
                        onChange={(e) => {
                          const current = newProvider.serviceTypes || [];
                          if (e.target.checked) {
                            setNewProvider(prev => ({
                              ...prev,
                              serviceTypes: [...current, type]
                            }));
                          } else {
                            setNewProvider(prev => ({
                              ...prev,
                              serviceTypes: current.filter(t => t !== type)
                            }));
                          }
                        }}
                      />
                      <Label className="text-sm">{type}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  placeholder="Provider description..."
                  value={newProvider.description || ''}
                  onChange={(e) => setNewProvider(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <Button onClick={createProvider} className="w-full">
                Create Provider
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}