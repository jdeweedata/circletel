import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import zohoMCPClient from '@/lib/zoho-mcp-client';
import {
  ZohoMCPRequest,
  ZohoMCPResponse,
  ZohoLead,
  ZohoContact,
  ZohoDeal,
  ZohoEmail,
  ZohoEvent,
  ZohoTicket,
  ZohoProject,
  ZohoTask,
} from '@/lib/types/zoho';

export function useZohoMCP() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeAction = useCallback(async <T = any>(
    request: ZohoMCPRequest
  ): Promise<ZohoMCPResponse<T>> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await zohoMCPClient.execute<T>(request);

      if (!response.success) {
        setError(response.error || 'Action failed');
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    executeAction,
    isLoading,
    error,
    clearError: () => setError(null),
  };
}

// Connection test hook
export function useZohoConnection() {
  return useQuery({
    queryKey: ['zoho-connection'],
    queryFn: () => zohoMCPClient.testConnection(),
    retry: 3,
    retryDelay: 1000,
  });
}

// CRM Hooks
export function useZohoCRM() {
  const queryClient = useQueryClient();
  const { executeAction, isLoading, error } = useZohoMCP();

  const createLead = useMutation({
    mutationFn: (lead: ZohoLead) =>
      executeAction<ZohoLead>({
        action: 'create_lead',
        app: 'crm',
        parameters: lead,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zoho-leads'] });
    },
  });

  const convertLead = useMutation({
    mutationFn: ({ leadId, options }: { leadId: string; options?: any }) =>
      executeAction({
        action: 'convert_lead',
        app: 'crm',
        parameters: { leadId, ...options },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zoho-leads'] });
      queryClient.invalidateQueries({ queryKey: ['zoho-contacts'] });
      queryClient.invalidateQueries({ queryKey: ['zoho-deals'] });
    },
  });

  const createContact = useMutation({
    mutationFn: (contact: ZohoContact) =>
      executeAction<ZohoContact>({
        action: 'create_contact',
        app: 'crm',
        parameters: contact,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zoho-contacts'] });
    },
  });

  const createDeal = useMutation({
    mutationFn: (deal: ZohoDeal) =>
      executeAction<ZohoDeal>({
        action: 'create_deal',
        app: 'crm',
        parameters: deal,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zoho-deals'] });
    },
  });

  const getRecords = useCallback((module: string, options?: any) => {
    return executeAction({
      action: 'get_records',
      app: 'crm',
      parameters: { module, ...options },
    });
  }, [executeAction]);

  return {
    createLead,
    convertLead,
    createContact,
    createDeal,
    getRecords,
    isLoading,
    error,
  };
}

// Mail Hook
export function useZohoMail() {
  const { executeAction, isLoading, error } = useZohoMCP();

  const sendEmail = useMutation({
    mutationFn: (email: ZohoEmail) =>
      executeAction({
        action: 'send_email',
        app: 'mail',
        parameters: email,
      }),
  });

  return {
    sendEmail,
    isLoading,
    error,
  };
}

// Calendar Hook
export function useZohoCalendar() {
  const queryClient = useQueryClient();
  const { executeAction, isLoading, error } = useZohoMCP();

  const createEvent = useMutation({
    mutationFn: (event: ZohoEvent) =>
      executeAction<ZohoEvent>({
        action: 'create_event',
        app: 'calendar',
        parameters: event,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zoho-events'] });
    },
  });

  return {
    createEvent,
    isLoading,
    error,
  };
}

// Desk Hook
export function useZohoDesk() {
  const queryClient = useQueryClient();
  const { executeAction, isLoading, error } = useZohoMCP();

  const createTicket = useMutation({
    mutationFn: (ticket: ZohoTicket) =>
      executeAction<ZohoTicket>({
        action: 'create_ticket',
        app: 'desk',
        parameters: ticket,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zoho-tickets'] });
    },
  });

  return {
    createTicket,
    isLoading,
    error,
  };
}

// Projects Hook
export function useZohoProjects() {
  const queryClient = useQueryClient();
  const { executeAction, isLoading, error } = useZohoMCP();

  const createProject = useMutation({
    mutationFn: (project: ZohoProject) =>
      executeAction<ZohoProject>({
        action: 'create_project',
        app: 'projects',
        parameters: project,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zoho-projects'] });
    },
  });

  const createTask = useMutation({
    mutationFn: (task: ZohoTask) =>
      executeAction<ZohoTask>({
        action: 'create_task',
        app: 'projects',
        parameters: task,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zoho-tasks'] });
    },
  });

  return {
    createProject,
    createTask,
    isLoading,
    error,
  };
}