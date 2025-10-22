'use client';

/**
 * Admin Payment Settings Page
 * Allows Super Admins to configure Netcash payment gateway settings
 * Task 3.3: Netcash Webhook Integration
 */

import { useState, useEffect } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionGate } from '@/components/rbac/PermissionGate';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertCircle,
  CheckCircle2,
  Settings,
  Key,
  Shield,
  RefreshCw,
  Save,
  Eye,
  EyeOff,
  ExternalLink,
  TestTube,
} from 'lucide-react';
import { toast } from 'sonner';

// ==================================================================
// TYPES
// ==================================================================

interface PaymentConfiguration {
  id: string;
  environment: 'test' | 'production';
  provider: string;
  service_key: string;
  pci_vault_key?: string;
  merchant_id?: string;
  webhook_secret: string;
  accept_url?: string;
  decline_url?: string;
  notify_url?: string;
  redirect_url?: string;
  return_url?: string;
  cancel_url?: string;
  payment_submit_url: string;
  api_url: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// ==================================================================
// MAIN COMPONENT
// ==================================================================

export default function PaymentSettingsPage() {
  const { user } = useAdminAuth();
  const { hasPermission } = usePermissions();
  const supabase = createClient();

  // State
  const [activeEnvironment, setActiveEnvironment] = useState<'test' | 'production'>('test');
  const [testConfig, setTestConfig] = useState<PaymentConfiguration | null>(null);
  const [prodConfig, setProdConfig] = useState<PaymentConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);
  const [formData, setFormData] = useState<Partial<PaymentConfiguration>>({
    service_key: '',
    pci_vault_key: '',
    merchant_id: '',
    webhook_secret: '',
    payment_submit_url: '',
    api_url: '',
    is_active: false,
  });

  // ==================================================================
  // DATA FETCHING
  // ==================================================================

  useEffect(() => {
    fetchConfigurations();
  }, []);

  useEffect(() => {
    // Update form data when active environment changes
    const config = activeEnvironment === 'test' ? testConfig : prodConfig;
    if (config) {
      setFormData({
        service_key: config.service_key,
        pci_vault_key: config.pci_vault_key || '',
        merchant_id: config.merchant_id || '',
        webhook_secret: config.webhook_secret,
        payment_submit_url: config.payment_submit_url,
        api_url: config.api_url,
        is_active: config.is_active,
      });
    } else {
      // Set defaults for new configuration
      setFormData({
        service_key: '',
        pci_vault_key: '',
        merchant_id: '',
        webhook_secret: '',
        payment_submit_url: activeEnvironment === 'test'
          ? 'https://sandbox.netcash.co.za/paynow/process'
          : 'https://paynow.netcash.co.za/site/paynow.aspx',
        api_url: 'https://api.netcash.co.za',
        is_active: false,
      });
    }
  }, [activeEnvironment, testConfig, prodConfig]);

  const fetchConfigurations = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('payment_configuration')
        .select('*')
        .eq('provider', 'netcash')
        .in('environment', ['test', 'production']);

      if (error) throw error;

      // Separate test and production configs
      const test = data?.find(c => c.environment === 'test');
      const prod = data?.find(c => c.environment === 'production');

      setTestConfig(test || null);
      setProdConfig(prod || null);
    } catch (error) {
      console.error('Failed to fetch configurations:', error);
      toast.error('Failed to load payment configurations');
    } finally {
      setLoading(false);
    }
  };

  // ==================================================================
  // FORM HANDLERS
  // ==================================================================

  const handleSave = async () => {
    try {
      setSaving(true);

      // Validate required fields
      if (!formData.service_key || !formData.webhook_secret || !formData.payment_submit_url || !formData.api_url) {
        toast.error('Please fill in all required fields');
        return;
      }

      const config = activeEnvironment === 'test' ? testConfig : prodConfig;

      if (config) {
        // Update existing configuration
        const { error } = await supabase
          .from('payment_configuration')
          .update({
            service_key: formData.service_key,
            pci_vault_key: formData.pci_vault_key || null,
            merchant_id: formData.merchant_id || null,
            webhook_secret: formData.webhook_secret,
            payment_submit_url: formData.payment_submit_url,
            api_url: formData.api_url,
            is_active: formData.is_active,
            updated_by: user?.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', config.id);

        if (error) throw error;

        toast.success(`${activeEnvironment === 'test' ? 'Test' : 'Production'} configuration updated successfully`);
      } else {
        // Create new configuration
        const { error } = await supabase
          .from('payment_configuration')
          .insert({
            environment: activeEnvironment,
            provider: 'netcash',
            service_key: formData.service_key!,
            pci_vault_key: formData.pci_vault_key || null,
            merchant_id: formData.merchant_id || null,
            webhook_secret: formData.webhook_secret!,
            payment_submit_url: formData.payment_submit_url!,
            api_url: formData.api_url!,
            is_active: formData.is_active || false,
            created_by: user?.id,
          });

        if (error) throw error;

        toast.success(`${activeEnvironment === 'test' ? 'Test' : 'Production'} configuration created successfully`);
      }

      // Refresh configurations
      await fetchConfigurations();
    } catch (error) {
      console.error('Failed to save configuration:', error);
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);

      // Test webhook endpoint health
      const response = await fetch('/api/payment/netcash/webhook', {
        method: 'GET',
      });

      const data = await response.json();

      if (data.status === 'healthy') {
        toast.success(`Webhook endpoint is healthy (${data.environment} environment)`);
      } else {
        toast.error(`Webhook endpoint is unhealthy: ${data.error}`);
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      toast.error('Connection test failed');
    } finally {
      setTesting(false);
    }
  };

  const generateWebhookSecret = () => {
    // Generate a random 32-character hex string
    const secret = Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');

    setFormData({ ...formData, webhook_secret: secret });
    toast.success('Webhook secret generated');
  };

  // ==================================================================
  // RENDER
  // ==================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-6 h-6 animate-spin text-circleTel-orange" />
      </div>
    );
  }

  const currentConfig = activeEnvironment === 'test' ? testConfig : prodConfig;

  return (
    <PermissionGate
      permissions={[PERMISSIONS.SYSTEM.SUPER_ADMIN]}
      fallback={
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You must be a Super Admin to access payment settings.
          </AlertDescription>
        </Alert>
      }
    >
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="w-8 h-8 text-circleTel-orange" />
            Payment Gateway Settings
          </h1>
          <p className="text-gray-600 mt-2">
            Configure Netcash payment gateway settings for test and production environments
          </p>
        </div>

        {/* Environment Tabs */}
        <Tabs value={activeEnvironment} onValueChange={(v) => setActiveEnvironment(v as 'test' | 'production')}>
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="test" className="flex items-center gap-2">
              <TestTube className="w-4 h-4" />
              Test Environment
              {testConfig?.is_active && (
                <Badge variant="default" className="ml-2">Active</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="production" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Production
              {prodConfig?.is_active && (
                <Badge variant="destructive" className="ml-2">Live</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Alert for active environment */}
          {currentConfig?.is_active && (
            <Alert className="mt-4">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle>Active Configuration</AlertTitle>
              <AlertDescription>
                This configuration is currently active and being used for {activeEnvironment} transactions.
              </AlertDescription>
            </Alert>
          )}

          <TabsContent value={activeEnvironment} className="space-y-6">
            {/* Configuration Form */}
            <Card>
              <CardHeader>
                <CardTitle>Netcash Configuration</CardTitle>
                <CardDescription>
                  Enter your Netcash API credentials and settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Service Key */}
                <div className="space-y-2">
                  <Label htmlFor="service_key">
                    Service Key <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="service_key"
                      type={showSecrets ? 'text' : 'password'}
                      value={formData.service_key || ''}
                      onChange={(e) => setFormData({ ...formData, service_key: e.target.value })}
                      placeholder="7928c6de-219f-4b75-9408-ea0e8c8753b"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0"
                      onClick={() => setShowSecrets(!showSecrets)}
                    >
                      {showSecrets ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                {/* PCI Vault Key */}
                <div className="space-y-2">
                  <Label htmlFor="pci_vault_key">PCI Vault Key</Label>
                  <Input
                    id="pci_vault_key"
                    type={showSecrets ? 'text' : 'password'}
                    value={formData.pci_vault_key || ''}
                    onChange={(e) => setFormData({ ...formData, pci_vault_key: e.target.value })}
                    placeholder="3143ee79-0c96-4909-968e-5a716fd19a65"
                  />
                </div>

                {/* Merchant ID */}
                <div className="space-y-2">
                  <Label htmlFor="merchant_id">Merchant ID</Label>
                  <Input
                    id="merchant_id"
                    type="text"
                    value={formData.merchant_id || ''}
                    onChange={(e) => setFormData({ ...formData, merchant_id: e.target.value })}
                    placeholder="52340889417"
                  />
                </div>

                <Separator />

                {/* Webhook Secret */}
                <div className="space-y-2">
                  <Label htmlFor="webhook_secret">
                    Webhook Secret <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="webhook_secret"
                      type={showSecrets ? 'text' : 'password'}
                      value={formData.webhook_secret || ''}
                      onChange={(e) => setFormData({ ...formData, webhook_secret: e.target.value })}
                      placeholder="Generate or enter webhook secret"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateWebhookSecret}
                    >
                      <Key className="w-4 h-4 mr-2" />
                      Generate
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500">
                    Used to verify webhook authenticity via HMAC-SHA256 signature
                  </p>
                </div>

                <Separator />

                {/* Payment Submit URL */}
                <div className="space-y-2">
                  <Label htmlFor="payment_submit_url">
                    Payment Submit URL <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="payment_submit_url"
                    type="url"
                    value={formData.payment_submit_url || ''}
                    onChange={(e) => setFormData({ ...formData, payment_submit_url: e.target.value })}
                    placeholder="https://sandbox.netcash.co.za/paynow/process"
                  />
                </div>

                {/* API URL */}
                <div className="space-y-2">
                  <Label htmlFor="api_url">
                    API URL <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="api_url"
                    type="url"
                    value={formData.api_url || ''}
                    onChange={(e) => setFormData({ ...formData, api_url: e.target.value })}
                    placeholder="https://api.netcash.co.za"
                  />
                </div>

                <Separator />

                {/* Active Status */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label htmlFor="is_active" className="text-base">
                      Active Configuration
                    </Label>
                    <p className="text-sm text-gray-500">
                      Enable this configuration to use it for {activeEnvironment} transactions
                    </p>
                  </div>
                  <Select
                    value={formData.is_active ? 'true' : 'false'}
                    onValueChange={(v) => setFormData({ ...formData, is_active: v === 'true' })}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Enabled</SelectItem>
                      <SelectItem value="false">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleSave}
                    disabled={saving || !formData.service_key || !formData.webhook_secret}
                    className="flex-1"
                  >
                    {saving ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Configuration
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={testing}
                  >
                    {testing ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <TestTube className="w-4 h-4 mr-2" />
                        Test Connection
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Webhook Information */}
            <Card>
              <CardHeader>
                <CardTitle>Webhook Endpoint</CardTitle>
                <CardDescription>
                  Configure this URL in your Netcash dashboard
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg font-mono text-sm">
                  <code className="flex-1">
                    {typeof window !== 'undefined'
                      ? `${window.location.origin}/api/payment/netcash/webhook`
                      : '/api/payment/netcash/webhook'}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const url = typeof window !== 'undefined'
                        ? `${window.location.origin}/api/payment/netcash/webhook`
                        : '/api/payment/netcash/webhook';
                      navigator.clipboard.writeText(url);
                      toast.success('Webhook URL copied to clipboard');
                    }}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Important</AlertTitle>
                  <AlertDescription>
                    Ensure you configure this webhook URL in your Netcash dashboard under
                    Account Settings → API Configuration → Webhook URLs
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Configuration History */}
            {currentConfig && (
              <Card>
                <CardHeader>
                  <CardTitle>Configuration Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Configuration ID:</dt>
                      <dd className="font-mono text-xs">{currentConfig.id}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Created:</dt>
                      <dd>{new Date(currentConfig.created_at!).toLocaleString()}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Last Updated:</dt>
                      <dd>{new Date(currentConfig.updated_at!).toLocaleString()}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PermissionGate>
  );
}
