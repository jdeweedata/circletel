'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  FileText,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Upload,
  Info
} from 'lucide-react';
import { useOrderContext } from '@/components/order/context/OrderContext';
import { OrderBreadcrumb } from '@/components/order/OrderBreadcrumb';
import { KycDocumentUpload } from '@/components/order/KycDocumentUpload';
import { toast } from 'sonner';
import { hasRequiredKycDocuments, getKycStatusDisplay } from '@/lib/order/types';

export default function KycVerificationPage() {
  const router = useRouter();
  const { state, actions } = useOrderContext();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set current stage to 4 when this page loads
  useEffect(() => {
    if (state.currentStage !== 4) {
      actions.setCurrentStage(4);
    }
  }, [state.currentStage, actions]);

  // Extract KYC data
  const kycData = state.orderData.kyc || {};
  const accountData = state.orderData.account || {};

  // Check if required documents are uploaded
  const hasRequiredDocs = hasRequiredKycDocuments(kycData);
  const canSubmit = hasRequiredDocs && kycData.verificationStatus !== 'under_review';

  const handleDocumentUpload = (documentType: string) => {
    // Update KYC data in context
    const updates: Record<string, boolean> = {};
    updates[`${documentType}Uploaded`] = true;

    actions.updateOrderData({
      kyc: {
        ...kycData,
        ...updates,
        documentsUploaded: true,
      }
    });

    toast.success('Document uploaded successfully');
  };

  const handleSubmitForReview = async () => {
    if (!canSubmit) {
      toast.error('Please upload all required documents first');
      return;
    }

    setIsSubmitting(true);

    try {
      // Update KYC status to under_review
      actions.updateOrderData({
        kyc: {
          ...kycData,
          verificationStatus: 'under_review',
          submittedAt: new Date(),
        }
      });

      actions.markStepComplete(4);
      toast.success('Documents submitted for review');

      // Navigate to payment page
      router.push('/order/payment');
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Failed to submit documents');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.push('/order/account');
  };

  const handleSkip = () => {
    toast.warning('KYC verification is required before payment', {
      description: 'You can skip for now, but you\'ll need to complete this before proceeding to payment.'
    });

    // Allow skip but mark as pending
    actions.updateOrderData({
      kyc: {
        ...kycData,
        verificationStatus: 'pending',
      }
    });

    router.push('/order/payment');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Breadcrumb Navigation */}
      <OrderBreadcrumb />

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-6 sm:py-8 md:py-10 lg:py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-circleTel-darkNeutral flex items-center justify-center gap-2">
            <Shield className="w-8 h-8 text-circleTel-orange" />
            KYC Verification
          </h1>
          <p className="mt-2 text-lg text-circleTel-secondaryNeutral">
            Upload your documents for FICA/RICA compliance
          </p>
        </div>

        {/* Status Alert */}
        {kycData.verificationStatus && (
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Verification Status:</strong>{' '}
              <Badge variant={kycData.verificationStatus === 'approved' ? 'default' : 'secondary'}>
                {getKycStatusDisplay(kycData.verificationStatus)}
              </Badge>
              {kycData.verificationStatus === 'under_review' && (
                <p className="mt-2 text-sm">
                  Your documents are being reviewed. This typically takes 24-48 hours.
                </p>
              )}
              {kycData.verificationStatus === 'rejected' && kycData.rejectionReason && (
                <p className="mt-2 text-sm text-red-600">
                  <strong>Reason:</strong> {kycData.rejectionReason}
                </p>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Why KYC is Required */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-circleTel-orange" />
                  Why is KYC verification required?
                </CardTitle>
                <CardDescription>
                  South African telecommunications regulations (FICA/RICA)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">FICA Compliance</p>
                    <p className="text-sm text-gray-600">
                      Financial Intelligence Centre Act requires identity verification to prevent money laundering
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">RICA Registration</p>
                    <p className="text-sm text-gray-600">
                      Regulation of Interception of Communications Act requires subscriber registration
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Secure & Private</p>
                    <p className="text-sm text-gray-600">
                      Your documents are encrypted and stored securely. Only authorized personnel can access them.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Document Upload Component */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-circleTel-orange" />
                  Upload Your Documents
                </CardTitle>
                <CardDescription>
                  Please upload clear, legible copies of the following documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <KycDocumentUpload
                  orderId={state.orderData.payment?.orderId || 'pending'}
                  onUploadComplete={() => handleDocumentUpload('id_document')}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Document Checklist */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Document Checklist</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  {kycData.idDocumentUploaded ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-gray-400" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-sm">ID Document</p>
                    <p className="text-xs text-gray-500">Required</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {kycData.proofOfAddressUploaded ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-gray-400" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-sm">Proof of Address</p>
                    <p className="text-xs text-gray-500">Required (last 3 months)</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {kycData.bankStatementUploaded ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-gray-400" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-sm">Bank Statement</p>
                    <p className="text-xs text-gray-500">Optional</p>
                  </div>
                </div>

                {accountData.accountType === 'business' && (
                  <div className="flex items-center gap-3">
                    {kycData.companyRegistrationUploaded ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-gray-400" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-sm">Company Registration</p>
                      <p className="text-xs text-gray-500">Required for business</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Help Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-gray-600">
                  Having trouble uploading documents?
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>Ensure files are under 5MB</li>
                  <li>Accepted: PDF, JPG, PNG</li>
                  <li>Documents must be clear and legible</li>
                </ul>
                <Button variant="outline" size="sm" className="w-full mt-3">
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="mt-8 flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={handleSkip}
              disabled={kycData.verificationStatus === 'under_review'}
            >
              Skip for Now
            </Button>

            <Button
              onClick={handleSubmitForReview}
              disabled={!canSubmit || isSubmitting}
              className="bg-circleTel-orange hover:bg-circleTel-orange/90 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>Submitting...</>
              ) : (
                <>
                  Submit for Review
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
