import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DealRecommender, CustomerProfile } from '@/lib/products/deal-recommender';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    
    const profile: CustomerProfile = {
      budget: body.budget,
      preferredContractTerm: body.preferredContractTerm,
      dataUsage: body.dataUsage,
      devicePreference: body.devicePreference,
      existingServices: body.existingServices
    };
    
    const limit = body.limit || 5;
    
    // Fetch all active deals
    const { data: deals, error } = await supabase
      .from('mtn_business_deals')
      .select('*')
      .eq('active', true);
    
    if (error) {
      console.error('Error fetching deals:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch deals' },
        { status: 500 }
      );
    }
    
    // Get recommendations
    const recommendations = DealRecommender.recommendDeals(deals || [], profile, limit);
    
    return NextResponse.json({
      success: true,
      recommendations,
      profile
    });
    
  } catch (error) {
    console.error('Error in recommend API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
