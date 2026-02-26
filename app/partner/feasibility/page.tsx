'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ChatAssistant,
  FeasibilityForm,
  CoverageResults,
} from '@/components/partners/feasibility';
import {
  ArrowLeft,
  Loader2,
  History,
  CheckCircle,
  Plus,
} from 'lucide-react';
import {
  ChatMessage,
  FeasibilityFormState,
  ExtractedFeasibilityData,
  PartnerFeasibilitySite,
  FormSite,
  CreateFeasibilityRequest,
} from '@/lib/partners/feasibility-types';
import { toast } from 'sonner';

const INITIAL_FORM_STATE: FeasibilityFormState = {
  client_company_name: '',
  client_contact_name: '',
  client_email: '',
  client_phone: '',
  bandwidth_required: null,
  contention: null,
  sla_level: null,
  failover_required: false,
  contract_term: 24,
  sites: [{ id: crypto.randomUUID(), address: '' }],
};

type PageState = 'entry' | 'checking' | 'results';

export default function PartnerFeasibilityPage() {
  const router = useRouter();
  const [pageState, setPageState] = useState<PageState>('entry');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [formState, setFormState] = useState<FeasibilityFormState>(INITIAL_FORM_STATE);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [sites, setSites] = useState<PartnerFeasibilitySite[]>([]);

  // Send chat message
  const handleSendMessage = useCallback(
    async (message: string, extract = false) => {
      setIsChatLoading(true);
      const timestamp = new Date().toISOString();

      // Optimistically add user message
      const userMessage: ChatMessage = {
        role: 'user',
        content: message,
        timestamp,
      };
      setMessages((prev) => [...prev, userMessage]);

      try {
        const response = await fetch('/api/partners/feasibility/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message,
            request_id: requestId,
            extract,
          }),
        });

        const data = await response.json();

        if (!data.success) {
          toast.error(data.error || 'Failed to send message');
          return;
        }

        // Add assistant message
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: data.response,
          timestamp: new Date().toISOString(),
          extracted_data: data.extracted_data,
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // If we have extracted data, update the form
        if (data.extracted_data) {
          applyExtractedData(data.extracted_data);
        }
      } catch (error) {
        toast.error('Failed to communicate with assistant');
        console.error('Chat error:', error);
      } finally {
        setIsChatLoading(false);
      }
    },
    [requestId]
  );

  // Extract data from conversation
  const handleExtractData = useCallback(async (): Promise<ExtractedFeasibilityData | null> => {
    setIsChatLoading(true);

    try {
      // Send message with extract flag to trigger extraction
      const response = await fetch('/api/partners/feasibility/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Extract all the information from our conversation.',
          request_id: requestId,
          extract: true,
        }),
      });

      const data = await response.json();

      if (data.success && data.extracted_data) {
        applyExtractedData(data.extracted_data);
        toast.success('Data extracted and form updated');
        return data.extracted_data;
      }

      toast.error('Could not extract data');
      return null;
    } catch (error) {
      toast.error('Failed to extract data');
      console.error('Extraction error:', error);
      return null;
    } finally {
      setIsChatLoading(false);
    }
  }, [requestId]);

  // Apply extracted data to form
  const applyExtractedData = (data: Partial<ExtractedFeasibilityData>) => {
    setFormState((prev) => {
      const updated = { ...prev };

      // Client info
      if (data.client?.company) {
        updated.client_company_name = data.client.company;
      }
      if (data.client?.name) {
        updated.client_contact_name = data.client.name;
      }
      if (data.client?.email) {
        updated.client_email = data.client.email;
      }
      if (data.client?.phone) {
        updated.client_phone = data.client.phone;
      }

      // Requirements
      if (data.requirements?.bandwidth_mbps) {
        updated.bandwidth_required = data.requirements.bandwidth_mbps;
      }
      if (data.requirements?.contention) {
        updated.contention = data.requirements.contention;
      }
      if (data.requirements?.sla) {
        updated.sla_level = data.requirements.sla;
      }
      if (data.requirements?.failover_needed !== undefined) {
        updated.failover_required = data.requirements.failover_needed;
      }

      // Sites
      if (data.sites && data.sites.length > 0) {
        updated.sites = data.sites.map((s) => ({
          id: crypto.randomUUID(),
          address: s.address,
          latitude: s.latitude,
          longitude: s.longitude,
        }));
      }

      return updated;
    });
  };

  // Submit feasibility request
  const handleSubmit = async () => {
    // Validate
    if (!formState.client_company_name.trim()) {
      toast.error('Client company name is required');
      return;
    }

    const validSites = formState.sites.filter((s) => s.address.trim());
    if (validSites.length === 0) {
      toast.error('At least one site address is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const requestBody: CreateFeasibilityRequest = {
        client_company_name: formState.client_company_name.trim(),
        client_contact_name: formState.client_contact_name.trim() || undefined,
        client_email: formState.client_email.trim() || undefined,
        client_phone: formState.client_phone.trim() || undefined,
        bandwidth_required: formState.bandwidth_required || undefined,
        contention: formState.contention || undefined,
        sla_level: formState.sla_level || undefined,
        failover_required: formState.failover_required,
        contract_term: formState.contract_term,
        sites: validSites.map((s) => ({
          address: s.address.trim(),
          latitude: s.latitude,
          longitude: s.longitude,
        })),
      };

      const response = await fetch('/api/partners/feasibility/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!data.success) {
        toast.error(data.error || 'Failed to create request');
        return;
      }

      setRequestId(data.request_id);
      setSites(data.sites || []);
      setPageState('checking');
      toast.success('Coverage check started!');

      // Start polling for results
      pollForResults(data.request_id);
    } catch (error) {
      toast.error('Failed to submit request');
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Poll for coverage results
  const pollForResults = async (id: string) => {
    let attempts = 0;
    const maxAttempts = 60; // 2 minutes at 2-second intervals

    const poll = async () => {
      if (attempts >= maxAttempts) {
        toast.error('Coverage check timed out');
        setPageState('results');
        return;
      }

      try {
        const response = await fetch(`/api/partners/feasibility/${id}`);
        const data = await response.json();

        if (!data.success) {
          console.error('Poll error:', data.error);
          return;
        }

        setSites(data.request.sites || []);

        // Check if all sites are complete
        const allDone = (data.request.sites || []).every(
          (s: PartnerFeasibilitySite) =>
            s.coverage_status === 'complete' || s.coverage_status === 'failed'
        );

        if (allDone) {
          setPageState('results');
          toast.success('Coverage check complete!');
          return;
        }

        // Continue polling
        attempts++;
        setTimeout(poll, 2000);
      } catch (error) {
        console.error('Poll error:', error);
        attempts++;
        setTimeout(poll, 2000);
      }
    };

    poll();
  };

  // Reset form for new request
  const handleNewRequest = () => {
    setPageState('entry');
    setMessages([]);
    setFormState(INITIAL_FORM_STATE);
    setRequestId(null);
    setSites([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Feasibility Check
          </h1>
          <p className="text-gray-600 mt-1">
            Submit a coverage check for your client
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/partner/feasibility/history">
            <Button variant="outline">
              <History className="w-4 h-4 mr-2" />
              History
            </Button>
          </Link>
          {pageState !== 'entry' && (
            <Button variant="outline" onClick={handleNewRequest}>
              <Plus className="w-4 h-4 mr-2" />
              New Request
            </Button>
          )}
        </div>
      </div>

      {/* Entry State: Chat + Form */}
      {pageState === 'entry' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Chat Assistant - 2 columns */}
            <div className="lg:col-span-2 h-[600px]">
              <ChatAssistant
                messages={messages}
                onSendMessage={handleSendMessage}
                onExtractData={handleExtractData}
                isLoading={isChatLoading}
              />
            </div>

            {/* Form - 3 columns */}
            <div className="lg:col-span-3 h-[600px] overflow-auto">
              <FeasibilityForm
                formState={formState}
                onChange={setFormState}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              size="lg"
              className="bg-circleTel-orange hover:bg-circleTel-orange/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Check Coverage
                </>
              )}
            </Button>
          </div>
        </>
      )}

      {/* Checking State */}
      {pageState === 'checking' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-circleTel-orange" />
              Checking Coverage...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CoverageResults sites={sites} />
          </CardContent>
        </Card>
      )}

      {/* Results State */}
      {pageState === 'results' && (
        <CoverageResults
          sites={sites}
          onGenerateQuote={() => {
            toast.info('Quote generation coming soon!');
          }}
          canGenerateQuote={sites.some(
            (s) =>
              s.coverage_status === 'complete' &&
              (s.coverage_results || []).some((r) => r.is_feasible)
          )}
        />
      )}
    </div>
  );
}
