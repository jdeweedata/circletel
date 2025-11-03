/**
 * Compliance Queue Tests
 * Tests for admin KYC compliance queue functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminCompliancePage from '@/app/admin/compliance/page';
import { createClient } from '@/lib/supabase/client';

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null }))
        })),
        in: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null }))
        })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null }))
      }))
    }))
  }))
}));

// Mock useAdminAuth
vi.mock('@/hooks/useAdminAuth', () => ({
  useAdminAuth: () => ({
    user: { id: '123', email: 'admin@circletel.co.za', role: 'super_admin' },
    hasPermission: () => true
  })
}));

describe('Admin Compliance Queue', () => {
  const mockKYCSessions = [
    {
      id: 'kyc-1',
      quote_id: 'quote-1',
      didit_session_id: 'didit-123',
      status: 'completed',
      verification_result: 'pending_review',
      risk_tier: 'high',
      flow_type: 'sme_light',
      extracted_data: {
        id_number: '8501015800081',
        full_name: 'John Smith',
        company_registration: 'CK2023/123456/23',
        liveness_score: 92
      },
      created_at: '2025-11-01T10:00:00Z',
      completed_at: '2025-11-01T10:15:00Z',
      business_quotes: {
        quote_number: 'QT-2025-001',
        customer_name: 'John Smith',
        company_name: 'Acme Corp'
      }
    },
    {
      id: 'kyc-2',
      quote_id: 'quote-2',
      didit_session_id: 'didit-456',
      status: 'completed',
      verification_result: 'approved',
      risk_tier: 'low',
      flow_type: 'sme_light',
      extracted_data: {
        id_number: '9002025800082',
        full_name: 'Jane Doe',
        liveness_score: 98
      },
      created_at: '2025-11-01T09:00:00Z',
      completed_at: '2025-11-01T09:10:00Z',
      business_quotes: {
        quote_number: 'QT-2025-002',
        customer_name: 'Jane Doe',
        company_name: 'XYZ Ltd'
      }
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays pending KYC sessions in queue', async () => {
    const mockSupabase = createClient();
    vi.mocked(mockSupabase.from).mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({
            data: mockKYCSessions.filter(s => s.verification_result === 'pending_review'),
            error: null
          }))
        }))
      }))
    } as any);

    render(<AdminCompliancePage />);

    await waitFor(() => {
      expect(screen.getByText(/QT-2025-001/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Acme Corp/i)).toBeInTheDocument();
    expect(screen.getByText(/High/i)).toBeInTheDocument();
  });

  it('allows admin to filter by risk tier', async () => {
    const user = userEvent.setup();

    const mockSupabase = createClient();
    vi.mocked(mockSupabase.from).mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({
            data: mockKYCSessions,
            error: null
          }))
        }))
      }))
    } as any);

    render(<AdminCompliancePage />);

    await waitFor(() => {
      expect(screen.getByText(/Compliance Queue/i)).toBeInTheDocument();
    });

    // Click risk tier filter
    const filterButton = screen.getByRole('combobox', { name: /risk tier/i });
    await user.click(filterButton);

    // Select 'High' risk tier
    const highOption = screen.getByRole('option', { name: /high/i });
    await user.click(highOption);

    await waitFor(() => {
      // Should only show high-risk sessions
      expect(screen.getByText(/QT-2025-001/i)).toBeInTheDocument();
      expect(screen.queryByText(/QT-2025-002/i)).not.toBeInTheDocument();
    });
  });

  it('allows admin to approve high-risk KYC session', async () => {
    const user = userEvent.setup();
    const mockApprove = vi.fn(() => Promise.resolve({ ok: true }));
    global.fetch = mockApprove as any;

    const mockSupabase = createClient();
    vi.mocked(mockSupabase.from).mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({
            data: [mockKYCSessions[0]], // High-risk session
            error: null
          }))
        }))
      }))
    } as any);

    render(<AdminCompliancePage />);

    await waitFor(() => {
      expect(screen.getByText(/QT-2025-001/i)).toBeInTheDocument();
    });

    // Click on session row to open detail panel
    const sessionRow = screen.getByText(/QT-2025-001/i).closest('tr');
    await user.click(sessionRow!);

    await waitFor(() => {
      expect(screen.getByText(/KYC Details/i)).toBeInTheDocument();
    });

    // Click Approve button
    const approveButton = screen.getByRole('button', { name: /approve/i });
    await user.click(approveButton);

    await waitFor(() => {
      expect(mockApprove).toHaveBeenCalledWith(
        expect.stringContaining('/api/compliance/approve'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('kyc-1')
        })
      );
    });
  });

  it('allows admin to decline KYC session with reason', async () => {
    const user = userEvent.setup();
    const mockDecline = vi.fn(() => Promise.resolve({ ok: true }));
    global.fetch = mockDecline as any;

    const mockSupabase = createClient();
    vi.mocked(mockSupabase.from).mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({
            data: [mockKYCSessions[0]],
            error: null
          }))
        }))
      }))
    } as any);

    render(<AdminCompliancePage />);

    await waitFor(() => {
      expect(screen.getByText(/QT-2025-001/i)).toBeInTheDocument();
    });

    // Click on session row to open detail panel
    const sessionRow = screen.getByText(/QT-2025-001/i).closest('tr');
    await user.click(sessionRow!);

    await waitFor(() => {
      expect(screen.getByText(/KYC Details/i)).toBeInTheDocument();
    });

    // Click Decline button
    const declineButton = screen.getByRole('button', { name: /decline/i });
    await user.click(declineButton);

    // Should show reason dialog
    await waitFor(() => {
      expect(screen.getByLabelText(/decline reason/i)).toBeInTheDocument();
    });

    // Enter reason
    const reasonInput = screen.getByLabelText(/decline reason/i);
    await user.type(reasonInput, 'Document verification failed');

    // Confirm decline
    const confirmButton = screen.getByRole('button', { name: /confirm decline/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockDecline).toHaveBeenCalledWith(
        expect.stringContaining('/api/compliance/decline'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Document verification failed')
        })
      );
    });
  });

  it('displays KYC data and Didit verification details in detail panel', async () => {
    const user = userEvent.setup();

    const mockSupabase = createClient();
    vi.mocked(mockSupabase.from).mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({
            data: [mockKYCSessions[0]],
            error: null
          }))
        }))
      }))
    } as any);

    render(<AdminCompliancePage />);

    await waitFor(() => {
      expect(screen.getByText(/QT-2025-001/i)).toBeInTheDocument();
    });

    // Click on session row to open detail panel
    const sessionRow = screen.getByText(/QT-2025-001/i).closest('tr');
    await user.click(sessionRow!);

    await waitFor(() => {
      expect(screen.getByText(/KYC Details/i)).toBeInTheDocument();
    });

    // Verify extracted data is displayed
    expect(screen.getByText(/8501015800081/i)).toBeInTheDocument(); // ID Number
    expect(screen.getByText(/John Smith/i)).toBeInTheDocument(); // Full Name
    expect(screen.getByText(/CK2023\/123456\/23/i)).toBeInTheDocument(); // Company Reg

    // Verify Didit verification details
    expect(screen.getByText(/Liveness Score/i)).toBeInTheDocument();
    expect(screen.getByText(/92/i)).toBeInTheDocument();
  });

  it('allows searching by customer name or quote number', async () => {
    const user = userEvent.setup();

    const mockSupabase = createClient();
    vi.mocked(mockSupabase.from).mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({
            data: mockKYCSessions,
            error: null
          }))
        }))
      }))
    } as any);

    render(<AdminCompliancePage />);

    await waitFor(() => {
      expect(screen.getByText(/QT-2025-001/i)).toBeInTheDocument();
      expect(screen.getByText(/QT-2025-002/i)).toBeInTheDocument();
    });

    // Search for specific quote number
    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'QT-2025-001');

    await waitFor(() => {
      // Should only show matching session
      expect(screen.getByText(/QT-2025-001/i)).toBeInTheDocument();
      expect(screen.queryByText(/QT-2025-002/i)).not.toBeInTheDocument();
    });
  });
});
