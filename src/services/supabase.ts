import { UnjaniAuditFormData } from '@/components/forms/clients/unjani/types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://agyjovdugmtopasyvlng.supabase.co';

export interface FormSubmissionResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    clinicName: string;
    submittedAt: string;
  };
  error?: string;
  details?: string;
}

export async function submitUnjaniForm(formData: UnjaniAuditFormData & {
  notificationPreferences?: {
    notifyTeam: boolean;
    notifyClient: boolean;
    customEmails: string[];
  };
}, additionalData: {
  migrationPriority?: string;
  priorityReason?: string;
  submittedAt: string;
}): Promise<FormSubmissionResponse> {
  try {
    // Extract notification preferences before submitting
    const { notificationPreferences, ...auditData } = formData;

    const submissionData = {
      ...auditData,
      ...additionalData,
      // Include notification preferences for the Edge Function
      _notificationPreferences: notificationPreferences
    };

    // Try to submit to Edge Function first
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/unjani-form-submission`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(submissionData)
      });

      if (response.ok) {
        const result = await response.json();
        return result;
      }
    } catch (edgeFunctionError) {
      console.log('Edge Function not available, using fallback storage:', edgeFunctionError);
    }

    // Fallback: Store in localStorage with a unique key for later retrieval
    const submissionId = `unjani_submission_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    const submissionRecord = {
      id: submissionId,
      data: submissionData,
      submittedAt: additionalData.submittedAt,
      status: 'pending_database_deployment'
    };

    // Store in localStorage for backup
    const existingSubmissions = JSON.parse(localStorage.getItem('circletel_form_submissions') || '[]');
    existingSubmissions.push(submissionRecord);
    localStorage.setItem('circletel_form_submissions', JSON.stringify(existingSubmissions));

    // Log to console for debugging
    console.log('Form submission stored locally (pending database deployment):', submissionRecord);

    return {
      success: true,
      message: `Audit submitted successfully for ${formData.clinicName} (stored locally pending database deployment)`,
      data: {
        id: submissionId,
        clinicName: formData.clinicName,
        submittedAt: additionalData.submittedAt
      }
    };

  } catch (error) {
    console.error('Supabase submission error:', error);
    return {
      success: false,
      message: 'Failed to submit form data',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}