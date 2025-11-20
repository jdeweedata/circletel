'use client';

/**
 * Didit Verification Links Component
 * Displays links to Didit console for ID and address verification
 */

import { ExternalLink, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface DiditVerificationLinksProps {
  sessionId: string;
  diditSessionId: string;
  extractedData?: {
    didit_console_links?: string[];
    notes?: string;
    verification_date?: string;
    verified_by?: string;
    manual_verification?: boolean;
  };
  verificationResult?: 'approved' | 'declined' | 'pending_review' | null;
  status?: string;
}

export default function DiditVerificationLinks({
  sessionId,
  diditSessionId,
  extractedData,
  verificationResult,
  status,
}: DiditVerificationLinksProps) {
  const consoleLinks = extractedData?.didit_console_links || [];

  // Extract organization and session IDs from the console links
  const getVerificationLinks = () => {
    // Default Didit organization ID (from your example URLs)
    const orgId = 'd3882834-3005-41b4-8738-9dac04c17f8c';

    return {
      idVerification: `https://business.didit.me/console/${orgId}/${diditSessionId}/manual-checks/id-verification`,
      addressVerification: `https://business.didit.me/console/${orgId}/${diditSessionId}/manual-checks/proof-of-address`,
      sessionOverview: `https://business.didit.me/console/${orgId}/${diditSessionId}`,
    };
  };

  const links = consoleLinks.length > 0
    ? {
        idVerification: consoleLinks.find((link) => link.includes('id-verification')) || getVerificationLinks().idVerification,
        addressVerification: consoleLinks.find((link) => link.includes('proof-of-address')) || getVerificationLinks().addressVerification,
        sessionOverview: getVerificationLinks().sessionOverview,
      }
    : getVerificationLinks();

  // Get status badge based on verification result
  const getStatusBadge = () => {
    if (verificationResult === 'approved') {
      return (
        <Badge variant="default" className="bg-green-500">
          <CheckCircle className="w-3 h-3 mr-1" />
          Approved
        </Badge>
      );
    } else if (verificationResult === 'declined') {
      return (
        <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" />
          Declined
        </Badge>
      );
    } else if (verificationResult === 'pending_review') {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3 mr-1" />
          Pending Review
        </Badge>
      );
    }
    return null;
  };

  return (
    <Card className="border-2 border-blue-100 bg-blue-50/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <ExternalLink className="w-5 h-5 text-blue-600" />
            Didit KYC Verification
          </CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Session Info */}
        <div className="text-sm text-gray-600">
          <p>
            <span className="font-semibold">Session ID:</span>{' '}
            <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">
              {diditSessionId}
            </code>
          </p>
          {extractedData?.manual_verification && (
            <p className="mt-1 text-xs text-blue-600">
              Manual verification completed in Didit console
            </p>
          )}
        </div>

        {/* Verification Links */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-700">
            Didit Console Links:
          </p>

          <div className="grid grid-cols-1 gap-2">
            {/* ID Verification Link */}
            <Button
              variant="outline"
              className="justify-start h-auto py-3 px-4 hover:bg-blue-50 hover:border-blue-300"
              asChild
            >
              <a
                href={links.idVerification}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-sm">ID Verification</p>
                  <p className="text-xs text-gray-500">
                    View ID document check results
                  </p>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </a>
            </Button>

            {/* Address Verification Link */}
            <Button
              variant="outline"
              className="justify-start h-auto py-3 px-4 hover:bg-blue-50 hover:border-blue-300"
              asChild
            >
              <a
                href={links.addressVerification}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-sm">Address Verification</p>
                  <p className="text-xs text-gray-500">
                    View proof of address check results
                  </p>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </a>
            </Button>

            {/* Session Overview Link */}
            <Button
              variant="outline"
              className="justify-start h-auto py-3 px-4 hover:bg-blue-50 hover:border-blue-300"
              asChild
            >
              <a
                href={links.sessionOverview}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <ExternalLink className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-sm">Full Session Details</p>
                  <p className="text-xs text-gray-500">
                    View complete Didit console session
                  </p>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </a>
            </Button>
          </div>
        </div>

        {/* Notes */}
        {extractedData?.notes && (
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <p className="text-xs font-semibold text-gray-600 mb-1">Notes:</p>
            <p className="text-sm text-gray-700">{extractedData.notes}</p>
          </div>
        )}

        {/* Verification Details */}
        {extractedData?.verification_date && (
          <div className="text-xs text-gray-500 pt-2 border-t">
            <p>
              Verified: {new Date(extractedData.verification_date).toLocaleString('en-ZA')}
            </p>
            {extractedData.verified_by && (
              <p className="mt-1">Verified by: {extractedData.verified_by}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
