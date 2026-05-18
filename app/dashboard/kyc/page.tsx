'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCustomerAuth } from '@/components/providers/CustomerAuthProvider';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ModernStatCard } from '@/components/dashboard/ModernStatCard';
import {
  PiCheckCircleBold,
  PiClockBold,
  PiIdentificationCardBold,
  PiShieldCheckBold,
  PiScanBold,
  PiUserCircleBold,
  PiWarningCircleBold,
  PiArrowClockwiseBold,
  PiTimerBold,
  PiListChecksBold,
  PiXCircleBold,
} from 'react-icons/pi';

interface KYCSession {
  id: string;
  didit_session_id: string;
  verification_url: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'abandoned';
  verification_result: 'approved' | 'declined' | 'pending_review' | null;
  risk_score: number | null;
  created_at: string;
  completed_at: string | null;
}

interface KYCData {
  status: string;
  session: KYCSession | null;
}

function getStatusBadge(status: string): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string } {
  switch (status) {
    case 'approved':
      return { label: 'Verified', variant: 'default', color: 'bg-green-100 text-green-800' };
    case 'declined':
      return { label: 'Declined', variant: 'destructive', color: 'bg-red-100 text-red-800' };
    case 'pending_review':
      return { label: 'Under Review', variant: 'secondary', color: 'bg-yellow-100 text-yellow-800' };
    case 'in_progress':
      return { label: 'In Progress', variant: 'secondary', color: 'bg-blue-100 text-blue-800' };
    case 'not_started':
      return { label: 'Not Started', variant: 'outline', color: 'bg-gray-100 text-gray-800' };
    default:
      return { label: 'Unknown', variant: 'outline', color: 'bg-gray-100 text-gray-800' };
  }
}

export default function KYCPage() {
  const { session } = useCustomerAuth();
  const searchParams = useSearchParams();
  const [data, setData] = useState<KYCData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('verification');
  const [creating, setCreating] = useState(false);

  const fetchKYCStatus = useCallback(async () => {
    if (!session?.access_token) {
      setError('Please log in to view KYC status');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/dashboard/kyc/status', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch KYC status: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.error || 'Failed to load KYC status');
      }
    } catch (err) {
      console.error('KYC status error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load KYC status');
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    fetchKYCStatus();
  }, [fetchKYCStatus]);

  useEffect(() => {
    const status = searchParams.get('status');
    if (status === 'completed') {
      toast.success('Verification submitted! We are reviewing your documents.');
      fetchKYCStatus();
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', '/dashboard/kyc');
      }
    }
  }, [searchParams, fetchKYCStatus]);

  const startVerification = async () => {
    if (!session?.access_token) return;

    setCreating(true);
    try {
      const response = await fetch('/api/dashboard/kyc/create-session', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success && result.data?.verificationUrl) {
        window.location.href = result.data.verificationUrl;
      } else {
        toast.error(result.error || 'Failed to start verification');
      }
    } catch (err) {
      console.error('Start verification error:', err);
      toast.error('Failed to start verification. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="mb-2">
          <h1 className="text-2xl font-semibold text-gray-900">Identity Verification</h1>
          <p className="text-sm text-gray-500 mt-1">Verify your identity to unlock all account features</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="mb-2">
          <h1 className="text-2xl font-semibold text-gray-900">Identity Verification</h1>
          <p className="text-sm text-gray-500 mt-1">Verify your identity to unlock all account features</p>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <PiWarningCircleBold className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-800 font-medium">{error}</p>
            <Button
              onClick={() => { setLoading(true); setError(null); fetchKYCStatus(); }}
              className="mt-4 bg-circleTel-orange hover:bg-circleTel-orange-dark text-white"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const kycStatus = data?.status || 'not_started';
  const kycSession = data?.session;
  const isVerified = kycStatus === 'approved';
  const statusBadge = getStatusBadge(kycStatus);

  return (
    <div className="space-y-8">
      <div className="mb-2">
        <h1 className="text-2xl font-semibold text-gray-900">Identity Verification</h1>
        <p className="text-sm text-gray-500 mt-1">
          Verify your identity to unlock all account features
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ModernStatCard
          title="Verification Status"
          value={statusBadge.label}
          subtitle={isVerified ? 'Identity confirmed' : 'Action required'}
          description={isVerified ? 'Your account is fully verified' : 'Complete verification to access all features'}
          icon={isVerified ? <PiCheckCircleBold className="h-5 w-5" /> : <PiWarningCircleBold className="h-5 w-5" />}
        />

        <ModernStatCard
          title="Documents Verified"
          value={isVerified ? '1' : '0'}
          subtitle={isVerified ? 'ID document verified' : 'No documents verified'}
          description="South African ID or passport"
          icon={<PiIdentificationCardBold className="h-5 w-5" />}
        />

        <ModernStatCard
          title="Identity Check"
          value={isVerified ? 'Passed' : 'Pending'}
          subtitle={isVerified ? 'Face match confirmed' : 'Liveness check required'}
          description="Biometric face verification"
          icon={<PiScanBold className="h-5 w-5" />}
        />

        <ModernStatCard
          title="Risk Score"
          value={kycSession?.risk_score != null ? `${kycSession.risk_score}%` : 'N/A'}
          subtitle={
            kycSession?.risk_score != null
              ? kycSession.risk_score <= 30 ? 'Low risk' : kycSession.risk_score <= 70 ? 'Medium risk' : 'High risk'
              : 'Not assessed'
          }
          description="Automated risk assessment"
          icon={<PiShieldCheckBold className="h-5 w-5" />}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex h-auto p-1.5 bg-gray-100 border border-gray-200 rounded-xl gap-1">
          <TabsTrigger
            value="verification"
            className="gap-2.5 px-5 py-3 text-sm font-semibold rounded-lg transition-all duration-200
              data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-900 data-[state=inactive]:hover:bg-gray-50
              data-[state=active]:bg-white data-[state=active]:text-circleTel-orange data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-gray-200"
          >
            <PiShieldCheckBold className="h-5 w-5" />
            <span className="hidden sm:inline">Verification</span>
          </TabsTrigger>
          <TabsTrigger
            value="documents"
            className="gap-2.5 px-5 py-3 text-sm font-semibold rounded-lg transition-all duration-200
              data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-900 data-[state=inactive]:hover:bg-gray-50
              data-[state=active]:bg-white data-[state=active]:text-circleTel-orange data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-gray-200"
          >
            <PiIdentificationCardBold className="h-5 w-5" />
            <span className="hidden sm:inline">Documents</span>
          </TabsTrigger>
          <TabsTrigger
            value="timeline"
            className="gap-2.5 px-5 py-3 text-sm font-semibold rounded-lg transition-all duration-200
              data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-900 data-[state=inactive]:hover:bg-gray-50
              data-[state=active]:bg-white data-[state=active]:text-circleTel-orange data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-gray-200"
          >
            <PiListChecksBold className="h-5 w-5" />
            <span className="hidden sm:inline">Timeline</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="verification" className="mt-6">
          <div className="border border-gray-200 bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Identity Verification</h2>
            </div>
            <div className="p-6">
              {kycStatus === 'not_started' && (
                <div className="text-center py-8">
                  <PiUserCircleBold className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Verify Your Identity</h3>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">
                    Complete a quick identity verification to unlock all account features.
                    You will need your South African ID document and a device with a camera.
                  </p>
                  <div className="flex flex-wrap justify-center gap-3 mb-6">
                    <Badge variant="outline" className="gap-1.5 py-1.5 px-3">
                      <PiIdentificationCardBold className="h-4 w-4" /> ID Document Scan
                    </Badge>
                    <Badge variant="outline" className="gap-1.5 py-1.5 px-3">
                      <PiScanBold className="h-4 w-4" /> Face Verification
                    </Badge>
                    <Badge variant="outline" className="gap-1.5 py-1.5 px-3">
                      <PiShieldCheckBold className="h-4 w-4" /> Risk Analysis
                    </Badge>
                  </div>
                  <Button
                    onClick={startVerification}
                    disabled={creating}
                    className="bg-circleTel-orange hover:bg-circleTel-orange-dark text-white px-8 py-3 text-base"
                  >
                    {creating ? (
                      <>
                        <PiArrowClockwiseBold className="h-5 w-5 animate-spin mr-2" />
                        Starting Verification...
                      </>
                    ) : (
                      'Start Verification'
                    )}
                  </Button>
                  <p className="text-xs text-gray-400 mt-3">Takes about 2 minutes. Powered by Didit.</p>
                </div>
              )}

              {kycStatus === 'in_progress' && (
                <div className="text-center py-8">
                  <PiTimerBold className="h-16 w-16 text-blue-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Verification In Progress</h3>
                  <p className="text-gray-500 mb-6">
                    Your verification is being processed. This usually takes a few minutes.
                  </p>
                  <Button
                    onClick={() => { setLoading(true); fetchKYCStatus(); }}
                    variant="outline"
                    className="gap-2"
                  >
                    <PiArrowClockwiseBold className="h-4 w-4" />
                    Check Status
                  </Button>
                </div>
              )}

              {kycStatus === 'pending' && kycSession?.verification_url && (
                <div className="text-center py-8">
                  <PiClockBold className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Verification Pending</h3>
                  <p className="text-gray-500 mb-6">
                    You have a pending verification session. Click below to continue.
                  </p>
                  <Button
                    onClick={() => { window.location.href = kycSession.verification_url; }}
                    className="bg-circleTel-orange hover:bg-circleTel-orange-dark text-white px-8"
                  >
                    Continue Verification
                  </Button>
                </div>
              )}

              {kycStatus === 'approved' && (
                <div className="text-center py-8">
                  <PiCheckCircleBold className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-green-800 mb-2">Identity Verified</h3>
                  <p className="text-gray-500 mb-2">
                    Your identity has been successfully verified. All account features are now available.
                  </p>
                  {kycSession?.completed_at && (
                    <p className="text-xs text-gray-400">
                      Verified on {new Date(kycSession.completed_at).toLocaleDateString('en-ZA', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </p>
                  )}
                </div>
              )}

              {kycStatus === 'declined' && (
                <div className="text-center py-8">
                  <PiXCircleBold className="h-16 w-16 text-red-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-red-800 mb-2">Verification Declined</h3>
                  <p className="text-gray-500 mb-6">
                    Your verification was not successful. You can try again with a valid ID document.
                  </p>
                  <Button
                    onClick={startVerification}
                    disabled={creating}
                    className="bg-circleTel-orange hover:bg-circleTel-orange-dark text-white px-8"
                  >
                    {creating ? 'Starting...' : 'Try Again'}
                  </Button>
                </div>
              )}

              {kycStatus === 'pending_review' && (
                <div className="text-center py-8">
                  <PiClockBold className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-yellow-800 mb-2">Under Review</h3>
                  <p className="text-gray-500">
                    Your verification is being manually reviewed. We will notify you once the review is complete.
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <div className="border border-gray-200 bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Verified Documents</h2>
            </div>
            <div className="p-6">
              {isVerified ? (
                <div className="space-y-3">
                  <div className="p-4 border rounded-lg hover:bg-gray-50 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <PiIdentificationCardBold className="h-5 w-5 text-circleTel-orange" />
                        <div>
                          <p className="font-medium text-gray-900">Identity Document</p>
                          <p className="text-sm text-gray-500">South African Smart ID / Passport</p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Verified</Badge>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg hover:bg-gray-50 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <PiScanBold className="h-5 w-5 text-circleTel-orange" />
                        <div>
                          <p className="font-medium text-gray-900">Biometric Verification</p>
                          <p className="text-sm text-gray-500">Face match with passive liveness</p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Passed</Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <PiIdentificationCardBold className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No verified documents yet. Complete verification to see your documents here.</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="mt-6">
          <div className="border border-gray-200 bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Verification Timeline</h2>
            </div>
            <div className="p-6">
              {kycSession ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <PiCheckCircleBold className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Session Created</p>
                      <p className="text-sm text-gray-500">
                        {new Date(kycSession.created_at).toLocaleDateString('en-ZA', {
                          day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  {kycSession.status !== 'not_started' && (
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <PiScanBold className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Verification Started</p>
                        <p className="text-sm text-gray-500">User began identity verification process</p>
                      </div>
                    </div>
                  )}

                  {kycSession.completed_at && (
                    <div className="flex items-start gap-4">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        kycSession.verification_result === 'approved' ? 'bg-green-100' :
                        kycSession.verification_result === 'declined' ? 'bg-red-100' : 'bg-yellow-100'
                      }`}>
                        {kycSession.verification_result === 'approved' ? (
                          <PiCheckCircleBold className="h-4 w-4 text-green-600" />
                        ) : kycSession.verification_result === 'declined' ? (
                          <PiXCircleBold className="h-4 w-4 text-red-600" />
                        ) : (
                          <PiClockBold className="h-4 w-4 text-yellow-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          Verification {kycSession.verification_result === 'approved' ? 'Approved' :
                            kycSession.verification_result === 'declined' ? 'Declined' : 'Under Review'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(kycSession.completed_at).toLocaleDateString('en-ZA', {
                            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <PiListChecksBold className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No verification activity yet. Start verification to see your timeline.</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
