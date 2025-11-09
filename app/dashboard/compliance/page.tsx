'use client'

/**
 * Customer Compliance Dashboard
 * FICA/RICA document upload for order activation
 */

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ComplianceUploadForm } from '@/components/dashboard/ComplianceUploadForm'
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

interface ComplianceStatus {
  fica_complete: boolean
  rica_complete: boolean
  overall_complete: boolean
  pending_count: number
  rejected_count: number
}

export default function CompliancePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<Order | null>(null)
  const [documents, setDocuments] = useState<ComplianceDocument[]>([])
  const [complianceStatus, setComplianceStatus] = useState<ComplianceStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'fica' | 'rica'>('fica')

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
        setError('No orders found that require compliance documents.')
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
      setComplianceStatus(data.complianceStatus || null)
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

  const ficaDocuments = documents.filter(d => d.category === 'fica')
  const ricaDocuments = documents.filter(d => d.category === 'rica')

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-circleTel-orange mx-auto mb-4"></div>
          <p className="text-gray-600">Loading compliance information...</p>
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
      <div className="max-w-6xl mx-auto">
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

          <h1 className="text-3xl font-bold text-gray-900">FICA/RICA Compliance</h1>
          <p className="text-gray-600 mt-2">
            Upload required documents to activate your service
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
                  <p className="text-sm text-gray-500">Compliance Status</p>
                  {complianceStatus?.overall_complete ? (
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

        {/* Compliance Status Summary */}
        {complianceStatus && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* FICA Status */}
            <Card className={complianceStatus.fica_complete ? 'border-green-200 bg-green-50' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {complianceStatus.fica_complete ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <Clock className="w-5 h-5 text-yellow-600" />
                  )}
                  FICA Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  {complianceStatus.fica_complete
                    ? 'All required FICA documents uploaded and approved'
                    : 'Upload proof of identity and proof of address'}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {ficaDocuments.length} document{ficaDocuments.length !== 1 ? 's' : ''} uploaded
                </p>
              </CardContent>
            </Card>

            {/* RICA Status */}
            <Card className={complianceStatus.rica_complete ? 'border-green-200 bg-green-50' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {complianceStatus.rica_complete ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <Clock className="w-5 h-5 text-yellow-600" />
                  )}
                  RICA Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  {complianceStatus.rica_complete
                    ? 'All required RICA documents uploaded and approved'
                    : 'Upload proof of identity and proof of residence'}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {ricaDocuments.length} document{ricaDocuments.length !== 1 ? 's' : ''} uploaded
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {/* Upload Forms */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'fica' | 'rica')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="fica">FICA Documents</TabsTrigger>
            <TabsTrigger value="rica">RICA Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="fica" className="mt-6">
            {order && (
              <ComplianceUploadForm
                orderId={order.id}
                customerId={order.customer_id}
                category="fica"
                onUploadComplete={handleUploadComplete}
                onError={handleUploadError}
              />
            )}

            {/* Uploaded FICA Documents */}
            {ficaDocuments.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Uploaded FICA Documents</CardTitle>
                  <CardDescription>
                    {ficaDocuments.length} document{ficaDocuments.length !== 1 ? 's' : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {ficaDocuments.map(doc => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="font-medium text-sm">{doc.file_name}</p>
                            <p className="text-xs text-gray-500 capitalize">
                              {doc.document_type.replace(/_/g, ' ')}
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
          </TabsContent>

          <TabsContent value="rica" className="mt-6">
            {order && (
              <ComplianceUploadForm
                orderId={order.id}
                customerId={order.customer_id}
                category="rica"
                onUploadComplete={handleUploadComplete}
                onError={handleUploadError}
              />
            )}

            {/* Uploaded RICA Documents */}
            {ricaDocuments.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Uploaded RICA Documents</CardTitle>
                  <CardDescription>
                    {ricaDocuments.length} document{ricaDocuments.length !== 1 ? 's' : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {ricaDocuments.map(doc => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="font-medium text-sm">{doc.file_name}</p>
                            <p className="text-xs text-gray-500 capitalize">
                              {doc.document_type.replace(/_/g, ' ')}
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
          </TabsContent>
        </Tabs>

        {/* Help Text */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>What happens next?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600">
            <p>
              <strong>1. Upload Documents:</strong> Upload all required FICA and RICA documents
              using the forms above.
            </p>
            <p>
              <strong>2. Review:</strong> Our compliance team will review your documents within 1-2
              business days.
            </p>
            <p>
              <strong>3. Approval:</strong> Once approved, you'll be prompted to add a payment
              method.
            </p>
            <p>
              <strong>4. Installation:</strong> After payment method registration, we'll schedule
              your installation.
            </p>
            <p>
              <strong>5. Activation:</strong> Your service will be activated after successful
              installation.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
