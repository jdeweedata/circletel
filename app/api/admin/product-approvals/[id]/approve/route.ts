import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/integrations/supabase/server';

/**
 * POST /api/admin/product-approvals/[id]/approve
 * Approve a product and add it to the service_packages table
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { approval_notes, map_to_existing_package } = body;

    // 1. Get the approval queue item
    const { data: approval, error: fetchError } = await supabase
      .from('product_approval_queue')
      .select('*, import:product_imports(*)')
      .eq('id', id)
      .single();

    if (fetchError || !approval) {
      return NextResponse.json({ success: false, error: 'Approval not found' }, { status: 404 });
    }

    if (approval.status !== 'pending' && approval.status !== 'needs_review') {
      return NextResponse.json({ success: false, error: 'Product already processed' }, { status: 400 });
    }

    let servicePackageId = map_to_existing_package;

    // 2. If not mapping to existing package, create new service_package
    if (!map_to_existing_package) {
      const productData = approval.product_data;

      const { data: newPackage, error: packageError } = await supabase
        .from('service_packages')
        .insert({
          name: productData.name,
          speed: productData.speed,
          price: productData.regularPrice,
          promo_price: productData.promoPrice || null,
          installation_fee: productData.installationFee,
          router_model: productData.router?.model,
          router_included: productData.router?.included || false,
          router_rental_fee: productData.router?.rentalFee || null,
          category: approval.import?.product_category || 'BizFibre Connect',
          is_active: true,
          metadata: {
            costBreakdown: productData.costBreakdown,
            importedFrom: approval.import?.source_file,
            importDate: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (packageError) {
        console.error('Error creating service package:', packageError);
        return NextResponse.json({ success: false, error: packageError.message }, { status: 500 });
      }

      servicePackageId = newPackage.id;
    }

    // 3. Update approval queue item
    const { error: updateError } = await supabase
      .from('product_approval_queue')
      .update({
        status: 'approved',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        approval_notes,
        service_package_id: servicePackageId
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating approval:', updateError);
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    // 4. Log activity
    await supabase
      .from('product_approval_activity_log')
      .insert({
        import_id: approval.import_id,
        approval_queue_id: id,
        user_id: user.id,
        action: 'approved',
        details: {
          approval_notes,
          service_package_id: servicePackageId
        }
      });

    // 5. Create notification for the importer
    if (approval.import?.imported_by) {
      await supabase
        .from('notifications')
        .insert({
          user_id: approval.import.imported_by,
          title: 'Product Approved',
          message: `Your product "${approval.product_name}" has been approved and added to the catalog.`,
          type: 'success',
          category: 'product_approval',
          related_entity_type: 'product_approval',
          related_entity_id: id,
          action_url: `/admin/products/packages/${servicePackageId}`,
          action_label: 'View Product'
        });
    }

    return NextResponse.json({
      success: true,
      service_package_id: servicePackageId
    });

  } catch (error: any) {
    console.error('Error in POST /api/admin/product-approvals/[id]/approve:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
