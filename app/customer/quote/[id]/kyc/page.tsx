'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LightKYCSession } from '@/components/compliance/LightKYCSession';
import { KYCStatusBadge } from '@/components/compliance/KYCStatusBadge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

interface KYCPageProps {
  params: Promise<{ id: string }>;
}

interface KYCSession {
  sessionId: string;
  verificationUrl: string;
  flowType: 'sme_light' | 'consumer_light' | 'full_kyc';
  status: 'not_started' | 'in_progress' | 'completed' | 'abandoned' | 'declined';
  verificationResult?: 'approved' | 'declined' | 'pending_review';
  riskTier?: 'low' | 'medium' | 'high';
  completedAt?: string;
}

export default function KYCPage({ params }: KYCPageProps) {
  const router = useRouter();
  const [quoteId, setQuoteId] = useState<string | null>(null);
  const [kycSession, setKycSession] = useState<KYCSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // Unwrap params
  useEffect(() => {
    params.then((p) => setQuoteId(p.id));
  }, [params]);

  // Fetch KYC status
  const fetchKYCStatus = async (id: string) => {
    try {
      const response = await fetch(`/api/compliance/${id}/status`);
      const data = await response.json();

      if (data.success && data.data) {
        setKycSession(data.data);

        // If KYC approved, redirect to contract page
        if (
          data.data.status === 'completed' &&
          data.data.verificationResult === 'approved'
        ) {
          router.push(`/customer/quote/${id}/contract`);
        }
      } else {
        // No KYC session exists yet, create one
        if (data.data?.status === 'not_started') {
          await createKYCSession(id);
        }
      }
    } catch (err) {
      console.error('Error fetching KYC status:', err);
      setError('Failed to fetch KYC status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Create KYC session
  const createKYCSession = async (id: string) => {
    setIsCreatingSession(true);
    setError(null);

    try {
      const response = await fetch('/api/compliance/create-kyc-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteId: id, type: 'sme' }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        setKycSession({
          sessionId: data.data.sessionId,
          verificationUrl: data.data.verificationUrl,
          flowType: data.data.flowType,
          status: 'not_started',
        });
      } else {
        setError(data.error || 'Failed to create KYC session');
      }
    } catch (err) {
      console.error('Error creating KYC session:', err);
      setError('Failed to create KYC session. Please try again.');
    } finally {
      setIsCreatingSession(false);
    }
  };

  // Retry declined KYC
  const retryKYC = async () => {
    if (!quoteId) return;

    setIsCreatingSession(true);
    setError(null);

    try {
      const response = await fetch('/api/compliance/retry-kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteId }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        setKycSession({
          sessionId: data.data.sessionId,
          verificationUrl: data.data.verificationUrl,
          flowType: data.data.flowType,
          status: 'not_started',
        });
      } else {
        setError(data.error || 'Failed to retry KYC verification');
      }
    } catch (err) {
      console.error('Error retrying KYC:', err);
      setError('Failed to retry KYC verification. Please try again.');
    } finally {
      setIsCreatingSession(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (quoteId) {
      fetchKYCStatus(quoteId);
    }
  }, [quoteId]);

  // Poll for status updates every 5 seconds when verification in progress
  useEffect(() => {
    if (!quoteId || !kycSession) return;

    if (kycSession.status === 'in_progress' || kycSession.status === 'not_started') {
      const interval = setInterval(() => {
        fetchKYCStatus(quoteId);
      }, 5000);

      setPollingInterval(interval);

      return () => {
        clearInterval(interval);
      };
    } else {
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
    }
  }, [quoteId, kycSession?.status]);

  // Loading state
  if (isLoading || !quoteId) {
    return (
      <div className="min-h-screen bg-circleTel-lightNeutral flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-circleTel-orange" />
              <p className="text-sm text-circleTel-secondaryNeutral">
                Loading KYC verification...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error && !kycSession) {
    return (
      <div className="min-h-screen bg-circleTel-lightNeutral flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-8">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>

            <Button
              onClick={() => quoteId && fetchKYCStatus(quoteId)}
              variant="outline"
              className="w-full mt-4"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Declined or abandoned state
  if (
    kycSession?.status === 'declined' ||
    kycSession?.status === 'abandoned' ||
    (kycSession?.status === 'completed' &&
      kycSession?.verificationResult === 'declined')
  ) {
    return (
      <div className="min-h-screen bg-circleTel-lightNeutral py-8 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-circleTel-darkNeutral mb-2">
              KYC Verification
            </h1>
            <p className="text-circleTel-secondaryNeutral">
              Quote #{quoteId}
            </p>
          </div>

          {/* Status Badge */}
          <div className="flex justify-center">
            <KYCStatusBadge
              status={kycSession.status}
              verificationResult={kycSession.verificationResult}
            />
          </div>

          {/* Retry Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-circleTel-darkNeutral">
                Verification Unsuccessful
              </CardTitle>
              <CardDescription>
                Your KYC verification was not completed successfully. You can
                retry the verification process below.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={retryKYC}
                disabled={isCreatingSession}
                className="w-full bg-circleTel-orange hover:bg-circleTel-orange/90 text-white h-12"
              >
                {isCreatingSession ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating new session...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry Verification
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main KYC session view
  return (
    <div className="min-h-screen bg-circleTel-lightNeutral py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-circleTel-darkNeutral mb-2">
            KYC Verification
          </h1>
          <p className="text-circleTel-secondaryNeutral">
            Quote #{quoteId}
          </p>
        </div>

        {/* Layout: Responsive grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content - KYC Session */}
          <div className="lg:col-span-2">
            {kycSession ? (
              <LightKYCSession
                sessionId={kycSession.sessionId}
                verificationUrl={kycSession.verificationUrl}
                flowType={kycSession.flowType}
                isLoading={isCreatingSession}
                onComplete={() => {
                  // Poll for updated status
                  if (quoteId) {
                    fetchKYCStatus(quoteId);
                  }
                }}
              />
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-circleTel-orange mx-auto mb-3" />
                  <p className="text-sm text-circleTel-secondaryNeutral">
                    Preparing verification session...
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Status and info */}
          <div className="space-y-6">
            {/* Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Verification Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {kycSession && (
                  <KYCStatusBadge
                    status={kycSession.status}
                    verificationResult={kycSession.verificationResult}
                    verifiedDate={kycSession.completedAt}
                    riskTier={kycSession.riskTier}
                  />
                )}
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">What to Expect</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-circleTel-secondaryNeutral">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-circleTel-orange text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                    1
                  </div>
                  <p>Click "Start Verification" to open the secure verification window</p>
                </div>

                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-circleTel-orange text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                    2
                  </div>
                  <p>Upload your ID and required documents</p>
                </div>

                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-circleTel-orange text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                    3
                  </div>
                  <p>Complete the quick verification process (2-3 minutes)</p>
                </div>

                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-circleTel-orange text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                    4
                  </div>
                  <p>Receive instant approval and proceed to contract signing</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
