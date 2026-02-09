import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AdminNotificationService } from '@/lib/notifications/admin-notifications';
import { apiLogger } from '@/lib/logging';

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

    // Validate file type if provided
    if (file) {
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

      if (file.size > 20 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: 'File size must be less than 20MB' },
          { status: 400 }
        );
      }
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
      apiLogger.error('Error fetching order:', fetchError);
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

    let filePath = null;
    let publicUrl = null;

    // Upload document to storage
    if (file) {
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const fileName = `${order.order_number}_${timestamp}.${fileExt}`;
      filePath = `${orderId}/${fileName}`;

      const fileBuffer = Buffer.from(await file.arrayBuffer());

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('installation-documents')
        .upload(filePath, fileBuffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        apiLogger.error('Error uploading document:', uploadError);
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
      
      publicUrl = urlData.publicUrl;
    }

    // Update order status to installation_completed
    const updateData: any = {
      status: 'installation_completed',
      installation_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (filePath && file) {
      updateData.installation_document_url = filePath;
      updateData.installation_document_name = file.name;
      updateData.installation_document_uploaded_at = new Date().toISOString();
    }

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
      apiLogger.error('Error updating order:', updateError);
      // Try to delete the uploaded file
      if (filePath) {
        await supabase.storage
          .from('installation-documents')
          .remove([filePath]);
      }

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
        change_reason: notes || (file ? 'Installation completed with documentation' : 'Installation completed (pending documentation)'),
        changed_by: null, // TODO: Get from auth session
        automated: false,
        customer_notified: false,
        status_changed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });

    if (historyError) {
      apiLogger.error('Error logging status history:', historyError);
      // Don't fail the request if history logging fails
    }

    // Send notification to Service Delivery Manager for quality verification
    // Non-blocking: Don't fail the request if notification fails
    try {
      const completionDate = new Date().toLocaleString('en-ZA', {
        timeZone: 'Africa/Johannesburg',
        dateStyle: 'medium',
        timeStyle: 'short',
      });

      await AdminNotificationService.notifyInstallationCompleted({
        order_number: order.order_number,
        order_id: orderId,
        customer_name: `${order.first_name} ${order.last_name}`,
        customer_phone: order.phone || 'Not provided',
        installation_address: order.installation_address || 'Not specified',
        package_name: order.package_name || 'Unknown package',
        technician_name: order.assigned_technician || 'Not assigned',
        completion_date: completionDate,
        document_uploaded: !!filePath,
        document_url: publicUrl || undefined,
        document_name: file?.name,
        notes: notes || undefined,
      });
    } catch (notificationError) {
      // Log but don't fail the request
      apiLogger.error('[CompleteInstallation] Failed to send SDM notification:', notificationError);
    }

    return NextResponse.json({
      success: true,
      data: updatedOrder,
      message: 'Installation completed successfully',
      documentUrl: publicUrl,
    });
  } catch (error: any) {
    apiLogger.error('Error completing installation:', error);
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
