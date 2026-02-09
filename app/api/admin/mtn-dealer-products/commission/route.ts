import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateCommission, MTN_COMMISSION_TIERS } from '@/lib/types/mtn-dealer-products';
import { apiLogger } from '@/lib/logging/logger';

// GET /api/admin/mtn-dealer-products/commission - Get commission tiers and calculate
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // If deal_id is provided, calculate for specific deal
    const deal_id = searchParams.get('deal_id');
    const price = searchParams.get('price') ? parseFloat(searchParams.get('price')!) : null;
    const contract_term = searchParams.get('contract_term') ? parseInt(searchParams.get('contract_term')!) : 24;
    const quantity = searchParams.get('quantity') ? parseInt(searchParams.get('quantity')!) : 1;

    if (deal_id) {
      const supabase = await createClient();
      const { data: product, error } = await supabase
        .from('mtn_dealer_products')
        .select('*')
        .eq('deal_id', deal_id)
        .single();

      if (error || !product) {
        return NextResponse.json(
          { success: false, error: 'Product not found' },
          { status: 404 }
        );
      }

      const commission = calculateCommission(
        product.mtn_price_incl_vat,
        product.contract_term,
        quantity,
        product.circletel_commission_share
      );

      return NextResponse.json({
        success: true,
        data: {
          product: {
            deal_id: product.deal_id,
            price_plan: product.price_plan,
            device_name: product.device_name,
            mtn_price_incl_vat: product.mtn_price_incl_vat,
            contract_term: product.contract_term,
          },
          commission,
        },
      });
    }

    // If price is provided, calculate for that price
    if (price !== null) {
      const commission = calculateCommission(price, contract_term, quantity);

      return NextResponse.json({
        success: true,
        data: {
          price,
          contract_term,
          quantity,
          commission,
        },
      });
    }

    // Return commission tiers
    return NextResponse.json({
      success: true,
      data: {
        tiers: MTN_COMMISSION_TIERS,
        circletel_share: 30,
        contract_terms: [12, 24, 36],
        notes: [
          'Commission rates are based on the Arlan Communications contract (September 2025)',
          'CircleTel receives 30% of all MTN commissions from Arlan',
          'Commissions are calculated on the total contract value (monthly × term)',
          'Renewal commissions continue indefinitely on customer renewals/upgrades',
        ],
      },
    });
  } catch (error) {
    apiLogger.error('[MTN Commission API] Error', { error });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/mtn-dealer-products/commission - Bulk calculate commissions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deals } = body as {
      deals: Array<{
        deal_id?: string;
        price?: number;
        contract_term?: number;
        quantity?: number;
      }>;
    };

    if (!deals || !Array.isArray(deals)) {
      return NextResponse.json(
        { success: false, error: 'Invalid deals data' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const results = [];
    let totalCommission = 0;
    let totalContractValue = 0;

    for (const deal of deals) {
      let price = deal.price;
      let contractTerm = deal.contract_term || 24;
      let quantity = deal.quantity || 1;
      let productInfo = null;

      // If deal_id provided, fetch product details
      if (deal.deal_id) {
        const { data: product } = await supabase
          .from('mtn_dealer_products')
          .select('deal_id, price_plan, device_name, mtn_price_incl_vat, contract_term, circletel_commission_share')
          .eq('deal_id', deal.deal_id)
          .single();

        if (product) {
          price = product.mtn_price_incl_vat;
          contractTerm = product.contract_term;
          productInfo = {
            deal_id: product.deal_id,
            price_plan: product.price_plan,
            device_name: product.device_name,
          };
        }
      }

      if (price !== undefined && price !== null) {
        const commission = calculateCommission(price, contractTerm, quantity);
        totalCommission += commission.total_circletel_commission;
        totalContractValue += commission.total_contract_value * quantity;

        results.push({
          ...productInfo,
          price,
          contract_term: contractTerm,
          quantity,
          commission,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        results,
        summary: {
          total_deals: results.length,
          total_contract_value: totalContractValue,
          total_circletel_commission: totalCommission,
          total_circletel_commission_incl_vat: totalCommission * 1.15,
        },
      },
    });
  } catch (error) {
    apiLogger.error('[MTN Commission API] Error', { error });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
