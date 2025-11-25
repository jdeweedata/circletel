import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { EmailNotificationService } from '@/lib/notifications/notification-service';

// Partner registration schema (matches frontend validation)
const partnerRegistrationSchema = z.object({
  // Business Information
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  registrationNumber: z.string().optional(),
  vatNumber: z.string().optional(),
  businessType: z.enum(['sole_proprietor', 'company', 'partnership'], {
    required_error: 'Please select a business type',
  }),

  // Contact Information
  contactPerson: z.string().min(2, 'Contact person name is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Please enter a valid phone number').regex(/^[0-9+\s()-]+$/, 'Please enter a valid phone number'),
  alternativePhone: z.string().optional(),

  // Address
  streetAddress: z.string().min(5, 'Street address is required'),
  suburb: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  province: z.string().min(2, 'Province is required'),
  postalCode: z.string().min(4, 'Postal code is required'),

  // Banking Details
  bankName: z.string().min(2, 'Bank name is required'),
  accountHolder: z.string().min(2, 'Account holder name is required'),
  accountNumber: z.string().min(5, 'Account number is required'),
  accountType: z.enum(['cheque', 'savings'], {
    required_error: 'Please select an account type',
  }),
  branchCode: z.string().min(6, 'Branch code must be at least 6 digits'),
});

type PartnerRegistrationData = z.infer<typeof partnerRegistrationSchema>;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required. Please log in to register as a partner.' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = partnerRegistrationSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    const data: PartnerRegistrationData = validationResult.data;

    // Check if partner already exists for this user
    const { data: existingPartner, error: checkError } = await supabase
      .from('partners')
      .select('id, status')
      .eq('user_id', user.id)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error checking existing partner:', checkError);
      return NextResponse.json(
        { success: false, error: 'Failed to check existing registration' },
        { status: 500 }
      );
    }

    if (existingPartner) {
      return NextResponse.json(
        {
          success: false,
          error: `You already have a partner registration with status: ${existingPartner.status}`,
          existingPartnerId: existingPartner.id
        },
        { status: 409 }
      );
    }

    // Check if email is already registered by another partner
    const { data: emailCheck, error: emailError } = await supabase
      .from('partners')
      .select('id')
      .eq('email', data.email)
      .maybeSingle();

    if (emailError && emailError.code !== 'PGRST116') {
      console.error('Error checking email:', emailError);
      return NextResponse.json(
        { success: false, error: 'Failed to validate email' },
        { status: 500 }
      );
    }

    if (emailCheck) {
      return NextResponse.json(
        { success: false, error: 'This email address is already registered with another partner account' },
        { status: 409 }
      );
    }

    // Create partner record
    const { data: newPartner, error: insertError } = await supabase
      .from('partners')
      .insert({
        user_id: user.id,
        business_name: data.businessName,
        business_type: data.businessType,
        registration_number: data.registrationNumber || null,
        vat_number: data.vatNumber || null,
        contact_person: data.contactPerson,
        email: data.email,
        phone: data.phone,
        alternative_phone: data.alternativePhone || null,
        street_address: data.streetAddress,
        suburb: data.suburb || null,
        city: data.city,
        province: data.province,
        postal_code: data.postalCode,
        bank_name: data.bankName,
        account_holder: data.accountHolder,
        account_number: data.accountNumber, // Note: Should be encrypted in production
        account_type: data.accountType,
        branch_code: data.branchCode,
        status: 'pending', // Default status
        commission_rate: 0, // Default commission rate (0%)
        tier: 'bronze', // Default tier
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating partner:', insertError);
      return NextResponse.json(
        { success: false, error: 'Failed to create partner registration. Please try again.' },
        { status: 500 }
      );
    }

    // Send welcome email to partner
    try {
      await EmailNotificationService.sendPartnerWelcome({
        email: data.email,
        contact_person: data.contactPerson,
        business_name: data.businessName,
        business_type: data.businessType,
      });
    } catch (emailError) {
      console.error('Failed to send partner welcome email:', emailError);
      // Don't fail the registration if email fails
    }

    // Send notification to admin for approval
    try {
      await EmailNotificationService.sendAdminPartnerRegistrationAlert({
        partner_id: newPartner.id,
        business_name: data.businessName,
        business_type: data.businessType,
        registration_number: data.registrationNumber,
        contact_person: data.contactPerson,
        email: data.email,
        phone: data.phone,
        street_address: data.streetAddress,
        city: data.city,
        province: data.province,
        postal_code: data.postalCode,
      });
    } catch (emailError) {
      console.error('Failed to send admin notification:', emailError);
      // Don't fail the registration if email fails
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Partner registration submitted successfully',
        data: {
          partnerId: newPartner.id,
          status: newPartner.status,
        },
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Partner registration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve current user's partner registration status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get partner record
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (partnerError && partnerError.code !== 'PGRST116') {
      console.error('Error fetching partner:', partnerError);
      return NextResponse.json(
        { success: false, error: 'Failed to retrieve partner information' },
        { status: 500 }
      );
    }

    if (!partner) {
      return NextResponse.json(
        { success: true, data: null, message: 'No partner registration found' },
        { status: 200 }
      );
    }

    // Mask sensitive banking information
    const maskedPartner = {
      ...partner,
      account_number: partner.account_number
        ? `****${partner.account_number.slice(-4)}`
        : null,
    };

    return NextResponse.json(
      { success: true, data: maskedPartner },
      { status: 200 }
    );

  } catch (error) {
    console.error('Partner fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}
