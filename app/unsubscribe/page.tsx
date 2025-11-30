'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Mail, 
  MailX, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Bell,
  Megaphone,
  Newspaper,
  Package,
  Users,
  ShieldCheck,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface Preferences {
  email: string | null;
  promotional_emails: boolean;
  newsletter_emails: boolean;
  product_updates: boolean;
  partner_offers: boolean;
  unsubscribed_all: boolean;
  exists: boolean;
}

// ============================================================================
// UNSUBSCRIBE CONTENT COMPONENT
// ============================================================================

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email');
  const tokenParam = searchParams.get('token');

  const [email, setEmail] = useState(emailParam || '');
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [unsubscribeReason, setUnsubscribeReason] = useState('');
  const [showReasonInput, setShowReasonInput] = useState(false);

  // Load preferences if email or token provided
  useEffect(() => {
    if (emailParam || tokenParam) {
      fetchPreferences(emailParam, tokenParam);
    }
  }, [emailParam, tokenParam]);

  const fetchPreferences = async (emailValue?: string | null, token?: string | null) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (token) params.set('token', token);
      else if (emailValue) params.set('email', emailValue);

      const response = await fetch(`/api/unsubscribe?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch preferences');
      }

      setPreferences(data.data);
      if (data.data.email) {
        setEmail(data.data.email);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    await fetchPreferences(email);
  };

  const handlePreferenceChange = (key: keyof Preferences, value: boolean) => {
    if (!preferences) return;
    setPreferences({ ...preferences, [key]: value });
    setSuccess(null);
  };

  const handleUnsubscribeAll = () => {
    if (!preferences) return;
    setPreferences({
      ...preferences,
      unsubscribed_all: true,
      promotional_emails: false,
      newsletter_emails: false,
      product_updates: false,
      partner_offers: false,
    });
    setShowReasonInput(true);
    setSuccess(null);
  };

  const handleResubscribe = () => {
    if (!preferences) return;
    setPreferences({
      ...preferences,
      unsubscribed_all: false,
      promotional_emails: true,
      newsletter_emails: true,
      product_updates: true,
      partner_offers: false,
    });
    setShowReasonInput(false);
    setUnsubscribeReason('');
    setSuccess(null);
  };

  const handleSave = async () => {
    if (!preferences || !email) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload: Record<string, unknown> = {
        email,
        promotional_emails: preferences.promotional_emails,
        newsletter_emails: preferences.newsletter_emails,
        product_updates: preferences.product_updates,
        partner_offers: preferences.partner_offers,
        unsubscribe_all: preferences.unsubscribed_all,
      };
      
      // Only include token if it exists
      if (tokenParam) {
        payload.token = tokenParam;
      }
      
      // Only include reason if provided
      if (unsubscribeReason) {
        payload.unsubscribe_reason = unsubscribeReason;
      }

      const response = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save preferences');
      }

      setSuccess(data.message);
      setPreferences({
        ...preferences,
        ...data.data,
        exists: true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-circleTel-orange/10 mb-4">
                <Mail className="h-8 w-8 text-circleTel-orange" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-circleTel-darkNeutral mb-2">
                Email Preferences
              </h1>
              <p className="text-circleTel-secondaryNeutral">
                Manage your marketing email subscriptions
              </p>
            </div>

            {/* Important Notice */}
            <Alert className="mb-6 border-blue-200 bg-blue-50">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-800">Important Notice</AlertTitle>
              <AlertDescription className="text-blue-700">
                These settings only affect marketing emails. You will continue to receive 
                essential communications such as invoices, service notifications, and 
                account alerts regardless of your preferences here.
              </AlertDescription>
            </Alert>

            {/* Email Lookup Form */}
            {!preferences && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Find Your Preferences</CardTitle>
                  <CardDescription>
                    Enter your email address to view and manage your email preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLookup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-circleTel-orange hover:bg-circleTel-orange/90"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Looking up...
                        </>
                      ) : (
                        'Find My Preferences'
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Error Message */}
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Success Message */}
            {success && (
              <Alert className="mb-6 border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Success</AlertTitle>
                <AlertDescription className="text-green-700">{success}</AlertDescription>
              </Alert>
            )}

            {/* Preferences Form */}
            {preferences && (
              <>
                {/* Current Email */}
                <Card className="mb-6">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-circleTel-secondaryNeutral">Managing preferences for:</p>
                        <p className="font-medium text-circleTel-darkNeutral">{email}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPreferences(null);
                          setEmail('');
                          setSuccess(null);
                          setError(null);
                        }}
                      >
                        Change Email
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Unsubscribed All Banner */}
                {preferences.unsubscribed_all && (
                  <Alert className="mb-6 border-amber-200 bg-amber-50">
                    <MailX className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="text-amber-800">You're Unsubscribed</AlertTitle>
                    <AlertDescription className="text-amber-700">
                      You have unsubscribed from all marketing emails. 
                      <Button
                        variant="link"
                        className="text-amber-800 underline p-0 h-auto ml-1"
                        onClick={handleResubscribe}
                      >
                        Click here to resubscribe
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Preference Categories */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5 text-circleTel-orange" />
                      Marketing Email Categories
                    </CardTitle>
                    <CardDescription>
                      Choose which types of marketing emails you'd like to receive
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Promotional Emails */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <Megaphone className="h-5 w-5 text-circleTel-secondaryNeutral mt-0.5" />
                        <div>
                          <Label htmlFor="promotional" className="font-medium">
                            Promotions & Special Offers
                          </Label>
                          <p className="text-sm text-circleTel-secondaryNeutral">
                            Exclusive deals, discounts, and limited-time offers
                          </p>
                        </div>
                      </div>
                      <Switch
                        id="promotional"
                        checked={preferences.promotional_emails}
                        onCheckedChange={(checked) => handlePreferenceChange('promotional_emails', checked)}
                        disabled={preferences.unsubscribed_all}
                      />
                    </div>

                    <Separator />

                    {/* Newsletter */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <Newspaper className="h-5 w-5 text-circleTel-secondaryNeutral mt-0.5" />
                        <div>
                          <Label htmlFor="newsletter" className="font-medium">
                            Newsletter
                          </Label>
                          <p className="text-sm text-circleTel-secondaryNeutral">
                            Company news, industry insights, and helpful tips
                          </p>
                        </div>
                      </div>
                      <Switch
                        id="newsletter"
                        checked={preferences.newsletter_emails}
                        onCheckedChange={(checked) => handlePreferenceChange('newsletter_emails', checked)}
                        disabled={preferences.unsubscribed_all}
                      />
                    </div>

                    <Separator />

                    {/* Product Updates */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <Package className="h-5 w-5 text-circleTel-secondaryNeutral mt-0.5" />
                        <div>
                          <Label htmlFor="product_updates" className="font-medium">
                            Product Updates
                          </Label>
                          <p className="text-sm text-circleTel-secondaryNeutral">
                            New services, features, and product announcements
                          </p>
                        </div>
                      </div>
                      <Switch
                        id="product_updates"
                        checked={preferences.product_updates}
                        onCheckedChange={(checked) => handlePreferenceChange('product_updates', checked)}
                        disabled={preferences.unsubscribed_all}
                      />
                    </div>

                    <Separator />

                    {/* Partner Offers */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <Users className="h-5 w-5 text-circleTel-secondaryNeutral mt-0.5" />
                        <div>
                          <Label htmlFor="partner_offers" className="font-medium">
                            Partner Offers
                          </Label>
                          <p className="text-sm text-circleTel-secondaryNeutral">
                            Carefully selected offers from our trusted partners
                          </p>
                        </div>
                      </div>
                      <Switch
                        id="partner_offers"
                        checked={preferences.partner_offers}
                        onCheckedChange={(checked) => handlePreferenceChange('partner_offers', checked)}
                        disabled={preferences.unsubscribed_all}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Unsubscribe All Option */}
                {!preferences.unsubscribed_all && (
                  <Card className="mb-6 border-red-100">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-medium text-circleTel-darkNeutral flex items-center gap-2">
                            <MailX className="h-5 w-5 text-red-500" />
                            Unsubscribe from All Marketing
                          </h3>
                          <p className="text-sm text-circleTel-secondaryNeutral mt-1">
                            Stop receiving all marketing emails. You'll still get important 
                            service notifications and invoices.
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={handleUnsubscribeAll}
                        >
                          Unsubscribe All
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Reason Input */}
                {showReasonInput && (
                  <Card className="mb-6">
                    <CardContent className="pt-6">
                      <Label htmlFor="reason" className="mb-2 block">
                        Help us improve (optional)
                      </Label>
                      <Textarea
                        id="reason"
                        placeholder="Let us know why you're unsubscribing..."
                        value={unsubscribeReason}
                        onChange={(e) => setUnsubscribeReason(e.target.value)}
                        className="mb-2"
                        rows={3}
                      />
                      <p className="text-xs text-circleTel-secondaryNeutral">
                        Your feedback helps us send better emails
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Save Button */}
                <Button
                  className="w-full bg-circleTel-orange hover:bg-circleTel-orange/90"
                  size="lg"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Preferences'
                  )}
                </Button>

                {/* Additional Info */}
                <p className="text-center text-sm text-circleTel-secondaryNeutral mt-4">
                  Changes may take up to 24 hours to take effect.
                </p>
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT WITH SUSPENSE
// ============================================================================

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1 py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-circleTel-orange" />
              <p className="mt-4 text-circleTel-secondaryNeutral">Loading...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  );
}
