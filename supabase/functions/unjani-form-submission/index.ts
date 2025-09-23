import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface UnjaniFormData {
  // Clinic Information
  clinicName: string;
  province: string;
  clinicCode?: string;
  auditDate: string;

  // Current Service Provider Information
  currentProvider: string;
  connectionType: string;
  currentSpeed?: number;
  monthlyFee: number;

  // Contract Details
  contractType: string;
  contractStatus: string;
  contractStart: string;
  contractEnd?: string;

  // Migration Planning
  migrationPriority?: string;
  priorityReason?: string;
  preferredMigrationDate?: string;
  additionalNotes?: string;

  // Contact Information
  contactName: string;
  contactPosition: string;
  contactPhone: string;
  contactEmail: string;
  alternativeContact?: string;
  alternativePhone?: string;
  bestContactTime?: string;
  siteAccessNotes?: string;

  // Metadata
  submittedAt: string;

  // Notification preferences (optional)
  _notificationPreferences?: {
    notifyTeam: boolean;
    notifyClient: boolean;
    customEmails: string[];
  };
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const formData: UnjaniFormData = await req.json();

    // Validate required fields
    const requiredFields = [
      'clinicName', 'province', 'auditDate', 'currentProvider',
      'connectionType', 'monthlyFee', 'contractType', 'contractStatus',
      'contractStart', 'contactName', 'contactPosition', 'contactPhone', 'contactEmail'
    ];

    for (const field of requiredFields) {
      if (!formData[field as keyof UnjaniFormData]) {
        return new Response(
          JSON.stringify({ error: `Missing required field: ${field}` }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Prepare data for insertion
    const insertData = {
      clinic_name: formData.clinicName,
      province: formData.province,
      clinic_code: formData.clinicCode || null,
      audit_date: formData.auditDate,
      current_provider: formData.currentProvider,
      connection_type: formData.connectionType,
      current_speed: formData.currentSpeed || null,
      monthly_fee: formData.monthlyFee,
      contract_type: formData.contractType,
      contract_status: formData.contractStatus,
      contract_start: formData.contractStart,
      contract_end: formData.contractEnd || null,
      migration_priority: formData.migrationPriority || null,
      priority_reason: formData.priorityReason || null,
      preferred_migration_date: formData.preferredMigrationDate || null,
      additional_notes: formData.additionalNotes || null,
      contact_name: formData.contactName,
      contact_position: formData.contactPosition,
      contact_phone: formData.contactPhone,
      contact_email: formData.contactEmail,
      alternative_contact: formData.alternativeContact || null,
      alternative_phone: formData.alternativePhone || null,
      best_contact_time: formData.bestContactTime || null,
      site_access_notes: formData.siteAccessNotes || null,
      submitted_at: formData.submittedAt
    };

    // Insert the form data
    const { data, error } = await supabase
      .from('unjani_contract_audits')
      .insert(insertData)
      .select('id, clinic_name, submitted_at')
      .single();

    if (error) {
      console.error('Database insertion error:', error);
      return new Response(
        JSON.stringify({
          error: 'Failed to save form data',
          details: error.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Send email notifications based on preferences
    const notificationPrefs = formData._notificationPreferences || {
      notifyTeam: true,
      notifyClient: true,
      customEmails: []
    };

    // Only send emails if at least one notification type is enabled
    const shouldSendEmails = notificationPrefs.notifyTeam ||
                            notificationPrefs.notifyClient ||
                            (notificationPrefs.customEmails && notificationPrefs.customEmails.length > 0);

    if (shouldSendEmails) {
      try {
        const emailNotificationData = {
          clinicName: formData.clinicName,
          province: formData.province,
          contactName: formData.contactName,
          contactEmail: formData.contactEmail,
          migrationPriority: formData.migrationPriority || 'medium',
          contractStatus: formData.contractStatus,
          auditDate: formData.auditDate,
          submissionId: data.id,
          notifyTeam: notificationPrefs.notifyTeam,
          notifyClient: notificationPrefs.notifyClient && !!formData.contactEmail,
          customRecipients: notificationPrefs.customEmails || []
        };

        // Call the email notification function
        const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-audit-notification`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(emailNotificationData)
        });

        if (!emailResponse.ok) {
          console.error('Failed to send email notifications:', await emailResponse.text());
          // Don't fail the main request if email fails
        } else {
          console.log('Email notifications sent successfully');
        }
      } catch (emailError) {
        console.error('Email notification error:', emailError);
        // Don't fail the main request if email fails
      }
    } else {
      console.log('Email notifications disabled by user preferences');
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Audit submitted successfully for ${formData.clinicName}`,
        data: {
          id: data.id,
          clinicName: data.clinic_name,
          submittedAt: data.submitted_at
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});