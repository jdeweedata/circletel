'use client';

/**
 * Admin compliance document review queue.
 * Cross-customer list of FICA/RICA documents uploaded via the self-service customer portal.
 */

import { CustomerComplianceDocuments } from '@/components/admin/compliance/CustomerComplianceDocuments';

export default function ComplianceDocumentReviewPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compliance Document Reviews</h1>
          <p className="text-gray-600 mt-1">
            FICA/RICA documents uploaded by customers through the self-service portal. Review, then
            approve or reject.
          </p>
        </div>
        <CustomerComplianceDocuments defaultStatus="pending" showCustomer title="Documents" />
      </div>
    </div>
  );
}
