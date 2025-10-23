/**
 * KYC Document Upload API Route
 * Handles file uploads for KYC verification
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { uploadKycDocument } from '@/lib/storage/supabase-upload';
import type { KycDocumentType } from '@/lib/types/customer-journey';

export async function POST(request: NextRequest) {
  try {
    // Use service role key to bypass RLS for public API
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

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

    // Verify order exists and get customer info (allow 'pending' for pre-order uploads)
    let order = null;
    if (orderId !== 'pending') {
      const { data, error: orderError } = await supabase
        .from('consumer_orders')
        .select('id, first_name, last_name, email, phone')
        .eq('id', orderId)
        .single();

      if (orderError || !data) {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }
      order = data;
    }

    // Upload file to Supabase Storage (pass service role client)
    const uploadResult = await uploadKycDocument(file, orderId, documentType, supabase);

    if (!uploadResult.success) {
      return NextResponse.json(
        { error: uploadResult.error || 'Upload failed' },
        { status: 500 }
      );
    }

    // Get customer info from order
    const customerName = order ? `${order.first_name || ''} ${order.last_name || ''}`.trim() : 'Pending Customer';
    const customerEmail = order?.email || '';
    const customerPhone = order?.phone || '';
    const customerType = 'consumer'; // Consumer orders are always consumer type

    // Create KYC document record in database (using existing schema from 20251019000003)
    const { data: kycDocument, error: dbError } = await supabase
      .from('kyc_documents')
      .insert({
        consumer_order_id: orderId, // Using existing column name
        customer_type: customerType,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        document_type: documentType,
        document_title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension for title
        file_name: file.name,
        file_path: uploadResult.path, // Using existing column name
        file_size: file.size,
        file_type: file.type,
        verification_status: 'pending',
        is_sensitive: true,
        encrypted: false,
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
    // Use service role key to bypass RLS for public API
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
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
      .eq('consumer_order_id', orderId)
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
