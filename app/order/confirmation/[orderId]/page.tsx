import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { CheckCircle, Clock, AlertCircle, Package, MapPin, User, Calendar } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

interface Props {
  params: Promise<{ orderId: string }>;
}

export default async function OrderConfirmationPage({ params }: Props) {
  const { orderId } = await params;

  if (!orderId || orderId === 'pending') {
    redirect('/');
  }

  const supabase = await createClient();

  // Fetch order details
  const { data: order, error } = await supabase
    .from('consumer_orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (error || !order) {
    redirect('/');
  }

  // Fetch KYC documents
  const { data: kycDocuments } = await supabase
    .from('kyc_documents')
    .select('*')
    .eq('order_id', orderId);

  const kycStatus = order.kyc_verification_status || 'pending';
  const hasKycDocuments = kycDocuments && kycDocuments.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Success Header */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-8 text-center">
            <CheckCircle className="h-16 w-16 text-white mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">
              Order Submitted Successfully!
            </h1>
            <p className="text-green-50 text-lg">
              Thank you for choosing CircleTel
            </p>
          </div>

          <div className="px-6 py-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Order Number</p>
                <p className="text-xl font-mono font-semibold text-gray-900">
                  {orderId.substring(0, 8).toUpperCase()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Order Date</p>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(order.created_at).toLocaleDateString('en-ZA', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* KYC Status Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-bold text-gray-900">Verification Status</h2>
          </div>
          <div className="px-6 py-6">
            <div className="flex items-start gap-4">
              {kycStatus === 'approved' ? (
                <>
                  <CheckCircle className="h-8 w-8 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      Verification Approved
                    </h3>
                    <p className="text-gray-600">
                      Your documents have been verified. We'll contact you shortly to schedule installation.
                    </p>
                  </div>
                </>
              ) : kycStatus === 'under_review' ? (
                <>
                  <Clock className="h-8 w-8 text-orange-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      Under Review
                    </h3>
                    <p className="text-gray-600">
                      Our team is currently reviewing your documents. This typically takes 1-2 business days.
                    </p>
                  </div>
                </>
              ) : kycStatus === 'rejected' ? (
                <>
                  <AlertCircle className="h-8 w-8 text-red-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      Additional Information Required
                    </h3>
                    <p className="text-gray-600 mb-2">
                      {order.kyc_rejection_reason || 'We need additional information to process your order.'}
                    </p>
                    <a
                      href="/order/verification"
                      className="inline-flex items-center text-circleTel-orange hover:text-orange-600 font-medium"
                    >
                      Resubmit Documents →
                    </a>
                  </div>
                </>
              ) : (
                <>
                  <Clock className="h-8 w-8 text-blue-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      Pending Verification
                    </h3>
                    <p className="text-gray-600 mb-2">
                      {hasKycDocuments
                        ? 'Your documents have been received and are pending review.'
                        : 'Please upload your verification documents to proceed with your order.'}
                    </p>
                    {!hasKycDocuments && (
                      <a
                        href="/order/verification"
                        className="inline-flex items-center text-circleTel-orange hover:text-orange-600 font-medium"
                      >
                        Upload Documents →
                      </a>
                    )}
                  </div>
                </>
              )}
            </div>

            {kycDocuments && kycDocuments.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Uploaded Documents</h4>
                <div className="grid gap-2">
                  {kycDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">
                          {doc.document_type === 'id_document' && 'ID Document'}
                          {doc.document_type === 'proof_of_address' && 'Proof of Address'}
                          {doc.document_type === 'bank_statement' && 'Bank Statement'}
                          {doc.document_type === 'company_registration' && 'Company Registration'}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Order Summary Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-bold text-gray-900">Order Summary</h2>
          </div>
          <div className="px-6 py-6 space-y-6">
            {/* Customer Information */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <User className="h-5 w-5 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900">Customer Details</h3>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium text-gray-900">
                    {order.first_name} {order.last_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium text-gray-900">{order.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phone:</span>
                  <span className="font-medium text-gray-900">{order.phone}</span>
                </div>
                {order.id_number && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">ID Number:</span>
                    <span className="font-medium text-gray-900">{order.id_number}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Package Information */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Package className="h-5 w-5 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900">Package Details</h3>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Package:</span>
                  <span className="font-medium text-gray-900">{order.package_name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Monthly Cost:</span>
                  <span className="font-medium text-gray-900">
                    R{order.monthly_price ? Number(order.monthly_price).toFixed(2) : '0.00'}
                  </span>
                </div>
                {order.once_off_price && Number(order.once_off_price) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Once-off Cost:</span>
                    <span className="font-medium text-gray-900">
                      R{Number(order.once_off_price).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Installation Address */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-5 w-5 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900">Installation Address</h3>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-900 font-medium">{order.installation_address || order.address || 'To be confirmed'}</p>
                {order.location_type && (
                  <p className="text-sm text-gray-600 mt-1">
                    Location Type: {order.location_type === 'residential' ? 'Residential' : order.location_type === 'business' ? 'Business' : 'Estate/Complex'}
                  </p>
                )}
              </div>
            </div>

            {/* Installation Dates */}
            {(order.preferred_installation_date || order.alternative_installation_date) && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900">Installation Schedule</h3>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  {order.preferred_installation_date && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Preferred Date:</span>
                      <span className="font-medium text-gray-900">
                        {new Date(order.preferred_installation_date).toLocaleDateString('en-ZA')}
                      </span>
                    </div>
                  )}
                  {order.alternative_installation_date && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Alternative Date:</span>
                      <span className="font-medium text-gray-900">
                        {new Date(order.alternative_installation_date).toLocaleDateString('en-ZA')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Next Steps Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-bold text-gray-900">What Happens Next?</h2>
          </div>
          <div className="px-6 py-6">
            <ol className="space-y-4">
              <li className="flex gap-4">
                <div className="flex-shrink-0 h-8 w-8 bg-circleTel-orange text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Document Verification</h3>
                  <p className="text-gray-600 text-sm">
                    Our team will review your documents within 1-2 business days.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex-shrink-0 h-8 w-8 bg-circleTel-orange text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Installation Scheduling</h3>
                  <p className="text-gray-600 text-sm">
                    Once approved, we'll contact you to confirm your installation date.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex-shrink-0 h-8 w-8 bg-circleTel-orange text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Professional Installation</h3>
                  <p className="text-gray-600 text-sm">
                    Our technicians will install your service and ensure everything is working perfectly.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex-shrink-0 h-8 w-8 bg-circleTel-orange text-white rounded-full flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Enjoy Your Service</h3>
                  <p className="text-gray-600 text-sm">
                    Start enjoying fast, reliable internet from CircleTel!
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4 justify-center">
          <a
            href="/"
            className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Return to Home
          </a>
          <a
            href="/packages"
            className="px-6 py-3 bg-gradient-to-r from-circleTel-orange to-orange-600 text-white rounded-lg hover:shadow-lg transition-shadow font-medium"
          >
            Browse More Packages
          </a>
        </div>
      </div>
    </div>
  );
}
