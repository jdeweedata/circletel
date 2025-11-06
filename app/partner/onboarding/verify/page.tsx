'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Shield,
  Building2,
  FileCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  BusinessType,
  DocumentCategory,
  ComplianceDocument,
  getAllDocuments,
  calculateComplianceProgress,
  getMissingRequiredDocuments,
  isComplianceComplete,
} from '@/lib/partners/compliance-requirements';

interface UploadedDocument {
  id: string;
  category: DocumentCategory;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  verificationStatus: 'pending' | 'approved' | 'rejected';
}

export default function PartnerComplianceVerificationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [businessType, setBusinessType] = useState<BusinessType | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [complianceProgress, setComplianceProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<DocumentCategory>>(new Set());

  // Fetch partner data and uploaded documents
  useEffect(() => {
    async function fetchPartnerData() {
      try {
        // Get partner registration details
        const response = await fetch('/api/partners/onboarding');
        const result = await response.json();

        if (!result.success || !result.data) {
          toast.error('Partner registration not found. Please complete registration first.');
          router.push('/partners/onboarding');
          return;
        }

        setBusinessType(result.data.business_type as BusinessType);

        // Fetch uploaded documents
        const docsResponse = await fetch('/api/partners/compliance/documents');
        const docsResult = await docsResponse.json();

        if (docsResult.success && docsResult.data) {
          setUploadedDocuments(docsResult.data);

          // Calculate progress
          const uploadedCategories = docsResult.data.map((doc: UploadedDocument) => doc.category);
          const progress = calculateComplianceProgress(result.data.business_type, uploadedCategories);
          setComplianceProgress(progress);
        }
      } catch (error) {
        console.error('Error fetching partner data:', error);
        toast.error('Failed to load compliance status');
      } finally {
        setIsLoading(false);
      }
    }

    fetchPartnerData();
  }, [router]);

  const toggleCategory = (category: DocumentCategory) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const handleFileUpload = async (category: DocumentCategory, file: File, docInfo: ComplianceDocument) => {
    // Validate file size
    if (file.size > docInfo.maxSizeMB * 1024 * 1024) {
      toast.error(`File size exceeds ${docInfo.maxSizeMB}MB limit`);
      return;
    }

    // Validate file type
    const fileExtension = file.name.split('.').pop()?.toUpperCase();
    if (!fileExtension || !docInfo.acceptedFormats.includes(fileExtension)) {
      toast.error(`File type not accepted. Accepted formats: ${docInfo.acceptedFormats.join(', ')}`);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    formData.append('documentType', docInfo.title);

    try {
      const response = await fetch('/api/partners/compliance/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        toast.error(result.error || 'Failed to upload document');
        return;
      }

      toast.success(`${docInfo.title} uploaded successfully`);

      // Refresh uploaded documents
      const docsResponse = await fetch('/api/partners/compliance/documents');
      const docsResult = await docsResponse.json();

      if (docsResult.success && docsResult.data) {
        setUploadedDocuments(docsResult.data);

        // Update progress
        if (businessType) {
          const uploadedCategories = docsResult.data.map((doc: UploadedDocument) => doc.category);
          const progress = calculateComplianceProgress(businessType, uploadedCategories);
          setComplianceProgress(progress);
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document');
    }
  };

  const handleSubmitForReview = async () => {
    if (!businessType) return;

    const uploadedCategories = uploadedDocuments.map(doc => doc.category);
    const isComplete = isComplianceComplete(businessType, uploadedCategories);

    if (!isComplete) {
      const missing = getMissingRequiredDocuments(businessType, uploadedCategories);
      toast.error(`Please upload all required documents. Missing: ${missing.length} document(s)`);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/partners/compliance/submit', {
        method: 'POST',
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        toast.error(result.error || 'Failed to submit for review');
        return;
      }

      toast.success('Documents submitted for review! You will be notified once approved.');
      router.push('/partners/dashboard');
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to submit documents');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-circleTel-orange animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading compliance requirements...</p>
        </div>
      </div>
    );
  }

  if (!businessType) {
    return null;
  }

  const documents = getAllDocuments(businessType);
  const requiredDocs = documents.filter(doc => doc.required);
  const optionalDocs = documents.filter(doc => !doc.required);
  const uploadedCategories = uploadedDocuments.map(doc => doc.category);
  const missingRequired = getMissingRequiredDocuments(businessType, uploadedCategories);
  const isComplete = isComplianceComplete(businessType, uploadedCategories);

  const getDocumentStatus = (category: DocumentCategory): 'uploaded' | 'missing' | 'rejected' => {
    const doc = uploadedDocuments.find(d => d.category === category);
    if (!doc) return 'missing';
    if (doc.verificationStatus === 'rejected') return 'rejected';
    return 'uploaded';
  };

  const renderDocumentCard = (docInfo: ComplianceDocument) => {
    const status = getDocumentStatus(docInfo.category);
    const uploadedDoc = uploadedDocuments.find(d => d.category === docInfo.category);
    const isExpanded = expandedCategories.has(docInfo.category);

    return (
      <Card key={docInfo.category} className={`${
        status === 'uploaded' ? 'border-green-200 bg-green-50' :
        status === 'rejected' ? 'border-red-200 bg-red-50' :
        docInfo.required ? 'border-orange-200' : 'border-gray-200'
      }`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-base">{docInfo.title}</CardTitle>
                {docInfo.required && (
                  <Badge variant="destructive" className="text-xs">Required</Badge>
                )}
                {status === 'uploaded' && (
                  <Badge variant="default" className="text-xs bg-green-600">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Uploaded
                  </Badge>
                )}
                {status === 'rejected' && (
                  <Badge variant="destructive" className="text-xs">
                    <XCircle className="w-3 h-3 mr-1" />
                    Rejected
                  </Badge>
                )}
              </div>
              <CardDescription className="text-sm">{docInfo.description}</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleCategory(docInfo.category)}
              className="ml-2"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="pt-0">
            {/* Document Details */}
            <div className="space-y-3 mb-4">
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1">Examples:</p>
                <ul className="text-xs text-gray-600 list-disc list-inside space-y-1">
                  {docInfo.examples.map((example, idx) => (
                    <li key={idx}>{example}</li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="font-semibold text-gray-700">Accepted Formats:</span>
                  <p className="text-gray-600">{docInfo.acceptedFormats.join(', ')}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Max Size:</span>
                  <p className="text-gray-600">{docInfo.maxSizeMB}MB</p>
                </div>
              </div>

              {docInfo.notes && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">{docInfo.notes}</AlertDescription>
                </Alert>
              )}
            </div>

            {/* Upload Section */}
            {status === 'uploaded' && uploadedDoc ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-900">{uploadedDoc.fileName}</p>
                      <p className="text-xs text-green-700">
                        {(uploadedDoc.fileSize / 1024 / 1024).toFixed(2)}MB •
                        Uploaded {new Date(uploadedDoc.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {uploadedDoc.verificationStatus}
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-circleTel-orange transition-colors">
                <label className="cursor-pointer block">
                  <input
                    type="file"
                    className="hidden"
                    accept={docInfo.acceptedFormats.map(f => `.${f.toLowerCase()}`).join(',')}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileUpload(docInfo.category, file, docInfo);
                      }
                    }}
                  />
                  <div className="flex flex-col items-center text-center">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm font-medium text-gray-700">
                      Click to upload {docInfo.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {docInfo.acceptedFormats.join(', ')} (max {docInfo.maxSizeMB}MB)
                    </p>
                  </div>
                </label>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="w-8 h-8 text-circleTel-orange" />
            <h1 className="text-3xl font-bold text-circleTel-darkNeutral">
              FICA/CIPC Compliance Verification
            </h1>
          </div>
          <p className="text-lg text-circleTel-secondaryNeutral">
            Upload required documents for South African business compliance
          </p>
        </div>

        {/* Progress Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-circleTel-orange" />
              Compliance Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">Overall Progress</span>
                  <span className="font-bold text-circleTel-orange">{complianceProgress}%</span>
                </div>
                <Progress value={complianceProgress} className="h-3" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{requiredDocs.length}</p>
                  <p className="text-xs text-blue-700">Required Documents</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{uploadedDocuments.length}</p>
                  <p className="text-xs text-green-700">Uploaded Documents</p>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">{missingRequired.length}</p>
                  <p className="text-xs text-orange-700">Missing Required</p>
                </div>
              </div>

              {isComplete && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    All required documents uploaded! You can now submit for review.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Required Documents */}
        {requiredDocs.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-circleTel-darkNeutral mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-circleTel-orange" />
              Required Documents
            </h2>
            <div className="space-y-3">
              {requiredDocs.map(renderDocumentCard)}
            </div>
          </div>
        )}

        {/* Optional Documents */}
        {optionalDocs.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-circleTel-darkNeutral mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-400" />
              Optional Documents (Recommended)
            </h2>
            <div className="space-y-3">
              {optionalDocs.map(renderDocumentCard)}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between gap-4 sticky bottom-0 bg-white p-4 rounded-lg shadow-lg border">
          <Button
            variant="outline"
            onClick={() => router.push('/partners/onboarding')}
            disabled={isSubmitting}
          >
            Back to Registration
          </Button>
          <Button
            onClick={handleSubmitForReview}
            disabled={!isComplete || isSubmitting}
            className="bg-circleTel-orange hover:bg-[#E67510] text-white min-w-[200px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <FileCheck className="w-4 h-4 mr-2" />
                Submit for Review
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
