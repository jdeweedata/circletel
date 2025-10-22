/**
 * KYC Document Upload API Route
 * Handles file uploads for KYC verification
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/integrations/supabase/server';
import { uploadKycDocument } from '@/lib/storage/supabase-upload';
import type { KycDocumentType } from '@/lib/types/customer-journey';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const orderId = formData.get('orderId') as string;
    const documentType = formData.get('documentType') as KycDocumentType;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    if (!documentType) {
      return NextResponse.json(
        { error: 'Document type is required' },
        { status: 400 }
      );
    }

    // Verify order exists
    const { data: order, error: orderError } = await supabase
      .from('consumer_orders')
      .select('id, customer_type')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Upload file to Supabase Storage
    const uploadResult = await uploadKycDocument(file, orderId, documentType);

    if (!uploadResult.success) {
      return NextResponse.json(
        { error: uploadResult.error || 'Upload failed' },
        { status: 500 }
      );
    }

    // Create KYC document record in database
    const { data: kycDocument, error: dbError } = await supabase
      .from('kyc_documents')
      .insert({
        order_id: orderId,
        document_type: documentType,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        storage_path: uploadResult.path,
        storage_url: uploadResult.url,
        verification_status: 'pending',
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to create document record' },
        { status: 500 }
      );
    }

    // Update order status to kyc_pending if not already
    if (order) {
      const { error: updateError } = await supabase
        .from('consumer_orders')
        .update({ status: 'kyc_pending' })
        .eq('id', orderId)
        .in('status', ['pending', 'payment_received']);

      if (updateError) {
        console.error('Failed to update order status:', updateError);
      }
    }

    return NextResponse.json({
      success: true,
      documentId: kycDocument.id,
      url: uploadResult.url,
      message: 'Document uploaded successfully',
    });
  } catch (error: any) {
    console.error('KYC upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Get all KYC documents for this order
    const { data: documents, error } = await supabase
      .from('kyc_documents')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch documents' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      documents: documents || [],
    });
  } catch (error: any) {
    console.error('KYC fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
