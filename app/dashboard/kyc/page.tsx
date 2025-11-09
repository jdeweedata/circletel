'use client'

/**
 * Customer KYC Dashboard
 * Simplified unified KYC document upload
 */

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { KYCUploadForm } from '@/components/dashboard/KYCUploadForm'
import { AlertCircle, CheckCircle2, Clock, FileText, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Order {
  id: string
  order_number: string
  status: string
  package_name: string
  customer_id: string
}

interface ComplianceDocument {
  id: string
  category: string
  document_type: string
  file_name: string
  file_url: string
  status: string
  uploaded_at: string
  rejection_reason?: string
}

export default function KYCPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<Order | null>(null)
  const [documents, setDocuments] = useState<ComplianceDocument[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadOrderAndDocuments()
  }, [])

  async function loadOrderAndDocuments() {
    try {
      const supabase = createClient()

      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        router.push('/login')
        return
      }

      // Get user's most recent order that needs KYC
      const { data: orderData, error: orderError } = await supabase
        .from('consumer_orders')
        .select('*')
        .eq('customer_id', user.id)
        .in('status', ['kyc_pending', 'kyc_submitted', 'kyc_rejected'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (orderError || !orderData) {
        setError('No orders found that require KYC documents.')
        setLoading(false)
        return
      }

      setOrder(orderData)

      // Load compliance documents
      await loadDocuments(orderData.id)

      setLoading(false)
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Failed to load order information. Please try again.')
      setLoading(false)
    }
  }

  async function loadDocuments(orderId: string) {
    try {
      const response = await fetch(`/api/compliance/upload?orderId=${orderId}`)
      if (!response.ok) throw new Error('Failed to load documents')

      const data = await response.json()
      setDocuments(data.documents || [])
    } catch (err) {
      console.error('Error loading documents:', err)
    }
  }

  function handleUploadComplete() {
    // Reload documents after successful upload
    if (order) {
      loadDocuments(order.id)
    }
  }

  function handleUploadError(errorMessage: string) {
    setError(errorMessage)
  }

  // Count documents by type
  const idDocuments = documents.filter(d => d.document_type === 'id_document')
  const addressDocuments = documents.filter(d => d.document_type === 'proof_of_address')
  const hasIdDocument = idDocuments.length > 0
  const hasAddressDocument = addressDocuments.length > 0
  const allDocsUploaded = hasIdDocument && hasAddressDocument

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-circleTel-orange mx-auto mb-4"></div>
          <p className="text-gray-600">Loading KYC information...</p>
        </div>
      </div>
    )
  }

  if (error && !order) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">{error}</AlertDescription>
          </Alert>
          <div className="mt-6">
            <Button onClick={() => router.push('/dashboard')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            onClick={() => router.push('/dashboard')}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <h1 className="text-3xl font-bold text-gray-900">KYC Verification</h1>
          <p className="text-gray-600 mt-2">
            Upload required documents to verify your identity
          </p>
        </div>

        {/* Order Info */}
        {order && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Order Information</CardTitle>
              <CardDescription>Order {order.order_number}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Package</p>
                  <p className="font-medium">{order.package_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-medium capitalize">
                    {order.status.replace(/_/g, ' ')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">KYC Status</p>
                  {allDocsUploaded ? (
                    <p className="font-medium text-green-600 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Complete
                    </p>
                  ) : (
                    <p className="font-medium text-yellow-600 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Pending
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Requirements Checklist */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Required Documents</CardTitle>
            <CardDescription>Please upload the following 2 documents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* ID Document */}
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                {hasIdDocument ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                ) : (
                  <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className="font-medium">1. Proof of Identity</p>
                  <p className="text-sm text-gray-600">
                    South African ID, Passport, or Driver's License
                  </p>
                </div>
                {hasIdDocument && (
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                    {idDocuments[0].status}
                  </span>
                )}
              </div>

              {/* Address Document */}
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                {hasAddressDocument ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                ) : (
                  <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className="font-medium">2. Proof of Address</p>
                  <p className="text-sm text-gray-600">
                    Utility bill, bank statement, or lease (less than 3 months old)
                  </p>
                </div>
                {hasAddressDocument && (
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                    {addressDocuments[0].status}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {/* Upload Form */}
        {order && (
          <KYCUploadForm
            orderId={order.id}
            customerId={order.customer_id}
            onUploadComplete={handleUploadComplete}
            onError={handleUploadError}
          />
        )}

        {/* Uploaded Documents */}
        {documents.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Uploaded Documents</CardTitle>
              <CardDescription>
                {documents.length} document{documents.length !== 1 ? 's' : ''} uploaded
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {documents.map(doc => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-sm">{doc.file_name}</p>
                        <p className="text-xs text-gray-500 capitalize">
                          {doc.document_type === 'id_document' ? 'Proof of Identity' : 'Proof of Address'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          doc.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : doc.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                      </span>
                      {doc.rejection_reason && (
                        <p className="text-xs text-red-600 max-w-xs">
                          {doc.rejection_reason}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Help Text */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>What happens next?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600">
            <p>
              <strong>1. Upload Documents:</strong> Upload your ID document and proof of address using the form above.
            </p>
            <p>
              <strong>2. Review:</strong> Our compliance team will review your documents within 1-2 business days.
            </p>
            <p>
              <strong>3. Approval:</strong> Once approved, you'll be prompted to add a payment method.
            </p>
            <p>
              <strong>4. Installation:</strong> After payment method registration, we'll schedule your installation.
            </p>
            <p>
              <strong>5. Activation:</strong> Your service will be activated after successful installation.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
