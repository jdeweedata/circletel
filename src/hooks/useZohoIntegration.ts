import { useState, useCallback } from 'react';
import {
  ZohoService,
  ZohoResponse,
  SupportTicketData,
  OrderData,
  LeadData,
  CoverageCheckData
} from '@/services/zohoIntegration';
import { toast } from 'sonner';

interface UseZohoState {
  loading: boolean;
  error: string | null;
  lastResponse: ZohoResponse | null;
}

export const useZohoIntegration = () => {
  const [state, setState] = useState<UseZohoState>({
    loading: false,
    error: null,
    lastResponse: null
  });

  const resetState = useCallback(() => {
    setState({
      loading: false,
      error: null,
      lastResponse: null
    });
  }, []);

  const executeZohoAction = useCallback(async <T = Record<string, unknown>>(
    action: () => Promise<ZohoResponse<T>>,
    successMessage?: string,
    errorMessage?: string
  ): Promise<ZohoResponse<T> | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await action();

      setState({
        loading: false,
        error: response.success ? null : response.error || 'Unknown error',
        lastResponse: response
      });

      if (response.success && successMessage) {
        toast.success(successMessage);
      } else if (!response.success) {
        const error = response.error || errorMessage || 'Operation failed';
        toast.error(error);
      }

      return response;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Network error';
      setState({
        loading: false,
        error: errorMsg,
        lastResponse: null
      });
      toast.error(errorMessage || errorMsg);
      return null;
    }
  }, []);

  // Support Ticket Operations
  const createSupportTicket = useCallback(async (
    ticketData: SupportTicketData,
    showToast: boolean = true
  ): Promise<ZohoResponse | null> => {
    return executeZohoAction(
      () => ZohoService.createSupportTicket(ticketData),
      showToast ? 'Support ticket created successfully!' : undefined,
      'Failed to create support ticket'
    );
  }, [executeZohoAction]);

  const updateTicketStatus = useCallback(async (
    ticketId: string,
    status: string,
    comment?: string
  ): Promise<ZohoResponse | null> => {
    return executeZohoAction(
      () => ZohoService.updateTicketStatus({ ticketId, status, comment }),
      'Ticket updated successfully!',
      'Failed to update ticket'
    );
  }, [executeZohoAction]);

  // Order Processing
  const processOrder = useCallback(async (
    orderData: OrderData,
    showToast: boolean = true
  ): Promise<ZohoResponse | null> => {
    return executeZohoAction(
      () => ZohoService.processOrder(orderData),
      showToast ? 'Order processed successfully! You will receive confirmation shortly.' : undefined,
      'Failed to process order'
    );
  }, [executeZohoAction]);

  // Lead Management
  const createLead = useCallback(async (
    leadData: LeadData,
    showToast: boolean = false
  ): Promise<ZohoResponse | null> => {
    return executeZohoAction(
      () => ZohoService.createLead(leadData),
      showToast ? 'Lead created successfully!' : undefined,
      'Failed to create lead'
    );
  }, [executeZohoAction]);

  const convertLead = useCallback(async (
    leadId: string,
    dealData?: Record<string, unknown>
  ): Promise<ZohoResponse | null> => {
    return executeZohoAction(
      () => ZohoService.convertLead(leadId, dealData),
      'Lead converted to customer!',
      'Failed to convert lead'
    );
  }, [executeZohoAction]);

  // Coverage Check Integration
  const handleCoverageCheck = useCallback(async (
    coverageData: CoverageCheckData
  ): Promise<ZohoResponse | null> => {
    return executeZohoAction(
      () => ZohoService.handleCoverageCheck(coverageData),
      undefined, // No toast for coverage checks
      'Failed to process coverage check'
    );
  }, [executeZohoAction]);

  // Service-specific helpers
  const createFibreActivationTicket = useCallback(async (customerData: {
    email: string;
    phone: string;
    address: string;
    serviceType: 'SkyFibre' | 'HomeFibreConnect' | 'BizFibreConnect';
    bundleType: string;
  }): Promise<ZohoResponse | null> => {
    return executeZohoAction(
      () => ZohoService.createFibreActivationTicket(customerData),
      'Activation request submitted! Our team will contact you within 24 hours.',
      'Failed to submit activation request'
    );
  }, [executeZohoAction]);

  const createITServicesOnboardingTicket = useCallback(async (customerData: {
    email: string;
    company: string;
    services: string[];
    userCount: number;
  }): Promise<ZohoResponse | null> => {
    return executeZohoAction(
      () => ZohoService.createITServicesOnboardingTicket(customerData),
      'IT Services onboarding initiated! We will begin your assessment shortly.',
      'Failed to initiate IT services onboarding'
    );
  }, [executeZohoAction]);

  const createSMMEQuoteRequest = useCallback(async (customerData: {
    email: string;
    company: string;
    phone: string;
    requirements: string;
    estimatedUsers: number;
  }): Promise<ZohoResponse | null> => {
    return executeZohoAction(
      () => ZohoService.createSMMEQuoteRequest(customerData),
      'Quote request submitted! Our team will contact you within 1 business day.',
      'Failed to submit quote request'
    );
  }, [executeZohoAction]);

  return {
    // State
    loading: state.loading,
    error: state.error,
    lastResponse: state.lastResponse,

    // Actions
    createSupportTicket,
    updateTicketStatus,
    processOrder,
    createLead,
    convertLead,
    handleCoverageCheck,
    createFibreActivationTicket,
    createITServicesOnboardingTicket,
    createSMMEQuoteRequest,
    resetState
  };
};

// Specialized hook for support tickets
export const useZohoSupport = () => {
  const {
    createSupportTicket,
    updateTicketStatus,
    loading,
    error
  } = useZohoIntegration();

  const submitGeneralSupport = useCallback(async (formData: {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
    serviceType?: string;
    urgency?: 'Low' | 'Medium' | 'High';
  }) => {
    const ticketData: SupportTicketData = {
      subject: formData.subject,
      description: `Customer: ${formData.name}\nEmail: ${formData.email}\nPhone: ${formData.phone || 'Not provided'}\n\nMessage:\n${formData.message}`,
      email: formData.email,
      phone: formData.phone,
      serviceType: formData.serviceType || 'general',
      priority: formData.urgency || 'Medium',
      category: 'General Support',
      source: 'Website Contact Form'
    };

    return createSupportTicket(ticketData);
  }, [createSupportTicket]);

  const submitTechnicalSupport = useCallback(async (formData: {
    name: string;
    email: string;
    phone?: string;
    accountNumber?: string;
    serviceType: string;
    issueType: string;
    description: string;
    urgency: 'Low' | 'Medium' | 'High' | 'Critical';
  }) => {
    const ticketData: SupportTicketData = {
      subject: `${formData.serviceType} - ${formData.issueType}`,
      description: `Customer: ${formData.name}\nEmail: ${formData.email}\nPhone: ${formData.phone || 'Not provided'}\nAccount: ${formData.accountNumber || 'Not provided'}\n\nIssue Type: ${formData.issueType}\nService: ${formData.serviceType}\n\nDescription:\n${formData.description}`,
      email: formData.email,
      phone: formData.phone,
      serviceType: formData.serviceType,
      priority: formData.urgency,
      category: 'Technical Support',
      source: 'Website Support Form'
    };

    return createSupportTicket(ticketData);
  }, [createSupportTicket]);

  const submitBillingSupport = useCallback(async (formData: {
    name: string;
    email: string;
    phone?: string;
    accountNumber: string;
    invoiceNumber?: string;
    issueType: string;
    description: string;
  }) => {
    const ticketData: SupportTicketData = {
      subject: `Billing - ${formData.issueType}`,
      description: `Customer: ${formData.name}\nEmail: ${formData.email}\nPhone: ${formData.phone || 'Not provided'}\nAccount: ${formData.accountNumber}\nInvoice: ${formData.invoiceNumber || 'Not provided'}\n\nIssue Type: ${formData.issueType}\n\nDescription:\n${formData.description}`,
      email: formData.email,
      phone: formData.phone,
      serviceType: 'billing',
      priority: 'Medium',
      category: 'Billing Support',
      source: 'Website Support Form'
    };

    return createSupportTicket(ticketData);
  }, [createSupportTicket]);

  return {
    loading,
    error,
    submitGeneralSupport,
    submitTechnicalSupport,
    submitBillingSupport,
    updateTicketStatus
  };
};

// Specialized hook for order processing
export const useZohoOrders = () => {
  const { processOrder, loading, error } = useZohoIntegration();

  const submitConnectivityOrder = useCallback(async (orderData: {
    customer: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      company?: string;
    };
    services: Array<{
      type: 'SkyFibre' | 'HomeFibreConnect' | 'BizFibreConnect';
      speed: string;
      price: number;
      features: string[];
    }>;
    installation: {
      address: string;
      preferredDate?: string;
      specialInstructions?: string;
    };
    bundleType: string;
    totalAmount: number;
  }) => {
    const formattedOrder: OrderData = {
      customer: orderData.customer,
      services: orderData.services.map(service => ({
        name: `${service.type} ${service.speed}`,
        description: `${service.type} ${service.speed} - Features: ${service.features.join(', ')}`,
        price: service.price,
        quantity: 1
      })),
      orderData: {
        orderId: `CT-${Date.now()}`,
        totalAmount: orderData.totalAmount,
        bundleType: orderData.bundleType,
        customerTier: orderData.customer.company ? 'SMME' : 'Standard'
      },
      billingInfo: {
        paymentTerms: 30
      }
    };

    return processOrder(formattedOrder);
  }, [processOrder]);

  const submitITServicesOrder = useCallback(async (orderData: {
    customer: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      company: string;
    };
    services: Array<{
      name: string;
      description: string;
      price: number;
      userCount?: number;
    }>;
    bundleType: string;
    totalAmount: number;
  }) => {
    const formattedOrder: OrderData = {
      customer: orderData.customer,
      services: orderData.services,
      orderData: {
        orderId: `CT-IT-${Date.now()}`,
        totalAmount: orderData.totalAmount,
        bundleType: orderData.bundleType,
        customerTier: 'SMME'
      },
      billingInfo: {
        paymentTerms: 30
      }
    };

    return processOrder(formattedOrder);
  }, [processOrder]);

  return {
    loading,
    error,
    submitConnectivityOrder,
    submitITServicesOrder
  };
};

export default useZohoIntegration;