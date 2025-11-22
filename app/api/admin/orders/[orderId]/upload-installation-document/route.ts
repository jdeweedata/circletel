import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * POST /api/admin/orders/[orderId]/upload-installation-document
 * Uploads an installation document for an existing order (post-completion)
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await context.params;

  if (!orderId) {
    return NextResponse.json(
      { success: false, error: 'Order ID is required' },
      { status: 400 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('document') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Document is required' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid file type. Only PDF, JPEG, PNG, and Word documents are allowed.'
        },
        { status: 400 }
      );
    }

    // Validate file size (20MB)
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File size must be less than 20MB' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get order details
    const { data: order, error: fetchError } = await supabase
      .from('consumer_orders')
      .select('order_number, status')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Upload document to storage
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const fileName = `${order.order_number}_${timestamp}.${fileExt}`;
    const filePath = `${orderId}/${fileName}`;

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from('installation-documents')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading document:', uploadError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to upload document',
          details: uploadError.message
        },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('installation-documents')
      .getPublicUrl(filePath);

    // Update order with document info
    const { data: updatedOrder, error: updateError } = await supabase
      .from('consumer_orders')
      .update({
        installation_document_url: filePath,
        installation_document_name: file.name,
        installation_document_uploaded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update order record',
          details: updateError.message
        },
        { status: 500 }
      );
    }

    // Log history
    await supabase
      .from('order_status_history')
      .insert({
        entity_type: 'consumer_order',
        entity_id: orderId,
        old_status: order.status,
        new_status: order.status, // Status doesn't change
        change_reason: 'Installation document uploaded manually',
        changed_by: null,
        automated: false,
        customer_notified: false,
        status_changed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });

    return NextResponse.json({
      success: true,
      data: updatedOrder,
      message: 'Document uploaded successfully',
      documentUrl: urlData.publicUrl,
    });

  } catch (error: any) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
