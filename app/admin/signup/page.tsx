'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Shield, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function AdminSignup() {
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    requested_role: 'viewer' as 'product_manager' | 'editor' | 'viewer',
    reason: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.functions.invoke('admin-signup', {
        body: formData,
      });

      if (error) {
        throw new Error('Failed to submit access request');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to submit access request');
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit access request');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Request Submitted!</CardTitle>
            <CardDescription>
              Your access request has been submitted successfully
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-green-50 border border-green-200 p-4">
              <p className="text-sm text-green-800">
                Your request will be reviewed by a super admin. You will be notified via email once your
                access has been approved. This typically takes 1-2 business days.
              </p>
            </div>
            <div className="text-center">
              <Link href="/admin/login">
                <Button variant="outline" className="w-full">
                  Return to Login
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-circleTel-orange/10">
            <Shield className="h-6 w-6 text-circleTel-orange" />
          </div>
          <CardTitle className="text-2xl font-bold">Request Admin Access</CardTitle>
          <CardDescription>
            Submit a request to access the CircleTel Admin Panel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@circletel.co.za"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">
                Use your work email address
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                type="text"
                placeholder="John Doe"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requested_role">Requested Role *</Label>
              <Select
                value={formData.requested_role}
                onValueChange={(value: 'product_manager' | 'editor' | 'viewer') =>
                  setFormData({ ...formData, requested_role: value })
                }
                disabled={isLoading}
              >
                <SelectTrigger id="requested_role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Viewer</span>
                      <span className="text-xs text-gray-500">Read-only access</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="editor">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Editor</span>
                      <span className="text-xs text-gray-500">Can create and edit content</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="product_manager">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Product Manager</span>
                      <span className="text-xs text-gray-500">Full management access</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Access (Optional)</Label>
              <Textarea
                id="reason"
                placeholder="Briefly explain why you need admin access..."
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                disabled={isLoading}
                rows={3}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting Request...
                </>
              ) : (
                'Submit Access Request'
              )}
            </Button>

            <div className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/admin/login" className="text-circleTel-orange hover:underline">
                Sign in
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
