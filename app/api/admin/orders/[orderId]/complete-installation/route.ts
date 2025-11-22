import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * POST /api/admin/orders/[orderId]/complete-installation
 * Marks installation as completed with document upload
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
    const notes = formData.get('notes') as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Installation document is required' },
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
      .select('*, first_name, last_name, order_number, status')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      console.error('Error fetching order:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Validate current status
    if (order.status !== 'installation_in_progress') {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot complete installation from status: ${order.status}. Order must be in "installation_in_progress" status.`
        },
        { status: 400 }
      );
    }

    // Upload document to storage
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const fileName = `${order.order_number}_${timestamp}.${fileExt}`;
    const filePath = `${orderId}/${fileName}`;

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const { data: uploadData, error: uploadError } = await supabase.storage
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
          error: 'Failed to upload installation document',
          details: uploadError.message
        },
        { status: 500 }
      );
    }

    // Get public URL for the document
    const { data: urlData } = supabase.storage
      .from('installation-documents')
      .getPublicUrl(filePath);

    // Update order status to installation_completed
    const updateData: any = {
      status: 'installation_completed',
      installation_completed_at: new Date().toISOString(),
      installation_document_url: filePath,
      installation_document_name: file.name,
      installation_document_uploaded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (notes) {
      updateData.technician_notes = notes;
    }

    const { data: updatedOrder, error: updateError } = await supabase
      .from('consumer_orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating order:', updateError);
      // Try to delete the uploaded file
      await supabase.storage
        .from('installation-documents')
        .remove([filePath]);

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update order status',
          details: updateError.message
        },
        { status: 500 }
      );
    }

    // Log status change
    const { error: historyError } = await supabase
      .from('order_status_history')
      .insert({
        entity_type: 'consumer_order',
        entity_id: orderId,
        old_status: order.status,
        new_status: 'installation_completed',
        change_reason: notes || 'Installation completed with documentation',
        changed_by: null, // TODO: Get from auth session
        automated: false,
        customer_notified: false,
        status_changed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });

    if (historyError) {
      console.error('Error logging status history:', historyError);
      // Don't fail the request if history logging fails
    }

    return NextResponse.json({
      success: true,
      data: updatedOrder,
      message: 'Installation completed successfully',
      documentUrl: urlData.publicUrl,
    });
  } catch (error: any) {
    console.error('Error completing installation:', error);
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
