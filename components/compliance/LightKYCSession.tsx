'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ExternalLink, CheckCircle, Loader2, Shield, FileText, Home } from 'lucide-react';

interface LightKYCSessionProps {
  sessionId: string;
  verificationUrl: string;
  flowType: 'sme_light' | 'consumer_light' | 'full_kyc';
  isLoading?: boolean;
  onComplete?: () => void;
}

interface ProgressStep {
  id: string;
  label: string;
  icon: React.ReactNode;
  completed: boolean;
}

export function LightKYCSession({
  sessionId,
  verificationUrl,
  flowType,
  isLoading = false,
  onComplete,
}: LightKYCSessionProps) {
  const [progress, setProgress] = useState<ProgressStep[]>([
    {
      id: 'id_verification',
      label: 'ID Verification',
      icon: <Shield className="w-5 h-5" />,
      completed: false,
    },
    {
      id: 'document_upload',
      label: flowType === 'consumer_light' ? 'Proof of Address' : 'Company Documents',
      icon: <FileText className="w-5 h-5" />,
      completed: false,
    },
    {
      id: 'address_confirmation',
      label: 'Address Confirmation',
      icon: <Home className="w-5 h-5" />,
      completed: false,
    },
  ]);

  const [verificationStarted, setVerificationStarted] = useState(false);
  const [verificationComplete, setVerificationComplete] = useState(false);

  // Listen for messages from Didit iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify origin (in production, check against Didit's domain)
      if (event.data?.type === 'didit-verification') {
        const { step, status } = event.data;

        if (status === 'completed') {
          setProgress((prev) =>
            prev.map((s) => (s.id === step ? { ...s, completed: true } : s))
          );
        }

        if (step === 'verification_complete') {
          setVerificationComplete(true);
          if (onComplete) {
            onComplete();
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onComplete]);

  const handleStartVerification = () => {
    setVerificationStarted(true);
    // Open verification URL in new window
    window.open(verificationUrl, '_blank', 'width=800,height=900');
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-circleTel-orange" />
            <p className="text-sm text-circleTel-secondaryNeutral">
              Preparing verification session...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (verificationComplete) {
    return (
      <Card className="w-full border-green-200 bg-green-50">
        <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
          <CheckCircle className="w-16 h-16 text-green-600" />
          <div className="text-center">
            <h3 className="text-xl font-bold text-green-800 mb-2">
              Verification Complete!
            </h3>
            <p className="text-sm text-green-700">
              Your KYC verification has been submitted successfully.
              <br />
              We'll process your application and notify you shortly.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-circleTel-darkNeutral">
          Complete Verification
        </CardTitle>
        <CardDescription>
          {flowType === 'sme_light'
            ? 'Quick 3-minute verification for business customers'
            : flowType === 'consumer_light'
            ? 'Quick 2-minute verification for individual customers'
            : 'Complete verification process for high-value contracts'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress Steps */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-circleTel-darkNeutral">
            Verification Steps
          </h4>

          <div className="space-y-2">
            {progress.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border transition-all',
                  step.completed
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200'
                )}
              >
                <div
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-full',
                    step.completed
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-300 text-gray-600'
                  )}
                >
                  {step.completed ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    step.icon
                  )}
                </div>

                <div className="flex-1">
                  <p
                    className={cn(
                      'text-sm font-medium',
                      step.completed ? 'text-green-800' : 'text-gray-700'
                    )}
                  >
                    {step.label}
                  </p>
                </div>

                {step.completed && (
                  <span className="text-xs font-semibold text-green-600">
                    Complete
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Verification Button */}
        <div className="flex flex-col gap-3">
          <Button
            onClick={handleStartVerification}
            disabled={verificationStarted}
            className="w-full bg-circleTel-orange hover:bg-circleTel-orange/90 text-white h-12 text-base font-semibold"
          >
            {verificationStarted ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Verification in Progress
              </>
            ) : (
              <>
                <ExternalLink className="w-5 h-5 mr-2" />
                Start Verification
              </>
            )}
          </Button>

          {verificationStarted && (
            <p className="text-xs text-center text-circleTel-secondaryNeutral">
              Complete the verification in the new window that opened.
              <br />
              This page will update automatically when you're done.
            </p>
          )}
        </div>

        {/* Security Notice */}
        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-blue-800">
            <p className="font-semibold mb-1">Secure Verification</p>
            <p>
              Verification is powered by Didit, a FICA-compliant identity
              verification provider. Your data is encrypted and handled
              securely.
            </p>
          </div>
        </div>

        {/* Session Info */}
        <div className="pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-circleTel-secondaryNeutral">
            <span>Session ID:</span>
            <span className="font-mono">{sessionId.slice(0, 12)}...</span>
          </div>
          <div className="flex items-center justify-between text-xs text-circleTel-secondaryNeutral mt-1">
            <span>Verification Type:</span>
            <span className="font-semibold">
              {flowType === 'sme_light'
                ? 'SME Light KYC'
                : flowType === 'consumer_light'
                ? 'Consumer Light KYC'
                : 'Full KYC'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
