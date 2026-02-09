/**
 * FICA/RICA Compliance Document Upload API
 * Handles document upload with metadata storage
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { FICADocumentType, RICADocumentType } from '@/lib/types/fica-rica'
import { apiLogger } from '@/lib/logging'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface UploadRequestBody {
  orderId: string
  customerId: string
  category: 'fica' | 'rica'
  documentType: FICADocumentType | RICADocumentType
  fileName: string
  fileSize: number
  filePath: string
  fileUrl: string
  mimeType: string
  metadata?: Record<string, any>
}

/**
 * POST /api/compliance/upload
 * Save document metadata after file upload to storage
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      )
    }

    // Parse request body
    const body: UploadRequestBody = await request.json()

    // Validate required fields
    if (!body.orderId || !body.customerId || !body.category || !body.documentType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify user owns the order
    const { data: order, error: orderError } = await supabase
      .from('consumer_orders')
      .select('id, customer_id')
      .eq('id', body.orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Verify customer ID matches
    if (order.customer_id !== body.customerId) {
      return NextResponse.json(
        { error: 'Order does not belong to customer' },
        { status: 403 }
      )
    }

    // Insert document record
    const { data: document, error: insertError } = await supabase
      .from('compliance_documents')
      .insert({
        order_id: body.orderId,
        customer_id: body.customerId,
        category: body.category,
        document_type: body.documentType,
        file_name: body.fileName,
        file_size: body.fileSize,
        file_path: body.filePath,
        file_url: body.fileUrl,
        mime_type: body.mimeType,
        metadata: body.metadata || {},
        status: 'pending',
      })
      .select()
      .single()

    if (insertError) {
      apiLogger.error('Database insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to save document metadata', details: insertError.message },
        { status: 500 }
      )
    }

    // Update order status to kyc_submitted if this is the first document
    const { data: existingDocs } = await supabase
      .from('compliance_documents')
      .select('id')
      .eq('order_id', body.orderId)

    if (existingDocs && existingDocs.length === 1) {
      // First document uploaded - update order status
      await supabase
        .from('consumer_orders')
        .update({ status: 'kyc_submitted' })
        .eq('id', body.orderId)
    }

    return NextResponse.json({
      success: true,
      document,
      message: 'Document uploaded successfully',
    })
  } catch (error) {
    apiLogger.error('Upload API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/compliance/upload?orderId=xxx
 * Get all compliance documents for an order
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json(
        { error: 'Missing orderId parameter' },
        { status: 400 }
      )
    }

    // Verify user owns the order
    const { data: order, error: orderError } = await supabase
      .from('consumer_orders')
      .select('id, customer_id')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Get all documents for this order
    const { data: documents, error: docsError } = await supabase
      .from('compliance_documents')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })

    if (docsError) {
      apiLogger.error('Database query error:', docsError)
      return NextResponse.json(
        { error: 'Failed to fetch documents' },
        { status: 500 }
      )
    }

    // Get compliance status
    const { data: complianceStatus } = await supabase
      .rpc('get_order_compliance_status', { p_order_id: orderId })
      .single()

    return NextResponse.json({
      success: true,
      documents: documents || [],
      complianceStatus: complianceStatus || {
        fica_complete: false,
        rica_complete: false,
        overall_complete: false,
        pending_count: 0,
        rejected_count: 0,
      },
    })
  } catch (error) {
    apiLogger.error('Get documents API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/compliance/upload?documentId=xxx
 * Delete a pending compliance document
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('documentId')

    if (!documentId) {
      return NextResponse.json(
        { error: 'Missing documentId parameter' },
        { status: 400 }
      )
    }

    // Get document to verify ownership and get file path
    const { data: document, error: docError } = await supabase
      .from('compliance_documents')
      .select('*')
      .eq('id', documentId)
      .single()

    if (docError || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Only allow deletion of pending documents
    if (document.status !== 'pending') {
      return NextResponse.json(
        { error: 'Cannot delete approved or rejected documents' },
        { status: 403 }
      )
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('kyc-documents')
      .remove([document.file_path])

    if (storageError) {
      apiLogger.error('Storage delete error:', storageError)
      // Continue anyway - database record is more important
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('compliance_documents')
      .delete()
      .eq('id', documentId)

    if (deleteError) {
      apiLogger.error('Database delete error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete document' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
    })
  } catch (error) {
    apiLogger.error('Delete API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
