import { NextRequest } from 'next/server';

import { POST } from '../route';
import { authenticateAdmin, requirePermission } from '@/lib/auth/admin-api-auth';
import { svc } from '@/lib/onboarding/onboarding-service';
import { saveManualB2BIntake } from '@/lib/onboarding/manual-intake';

jest.mock('@/lib/auth/admin-api-auth', () => ({
  authenticateAdmin: jest.fn(),
  requirePermission: jest.fn(),
}));

jest.mock('@/lib/onboarding/onboarding-service', () => ({
  svc: jest.fn(),
}));

jest.mock('@/lib/onboarding/manual-intake', () => {
  const actual = jest.requireActual('@/lib/onboarding/manual-intake');
  return {
    ...actual,
    saveManualB2BIntake: jest.fn(),
  };
});

jest.mock('@/lib/logging/logger', () => ({
  apiLogger: {
    error: jest.fn(),
    info: jest.fn(),
  },
}));

const mockAuthenticateAdmin = authenticateAdmin as jest.MockedFunction<typeof authenticateAdmin>;
const mockRequirePermission = requirePermission as jest.MockedFunction<typeof requirePermission>;
const mockSvc = svc as jest.MockedFunction<typeof svc>;
const mockSaveManualB2BIntake = saveManualB2BIntake as jest.MockedFunction<typeof saveManualB2BIntake>;

function request(body: Record<string, unknown>) {
  return new Request('http://localhost/api/admin/b2b/manual-intake', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as NextRequest;
}

const validBody = {
  segment: 'unjani',
  business: {
    businessName: 'Unjani Alexandra Clinic',
    entityType: 'Private Company',
    registrationNumber: '2026/123456/07',
    vatRegistered: false,
    registeredAddress: '10 Clinic Road, Alexandra',
  },
  contact: {
    contactName: 'Thandi Maseko',
    email: 'thandi@example.co.za',
    phone: '0821234567',
  },
  site: {
    clinicName: 'Unjani Alexandra',
    province: 'Gauteng',
    siteAddress: '10 Clinic Road, Alexandra',
  },
};

describe('POST /api/admin/b2b/manual-intake', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthenticateAdmin.mockResolvedValue({
      success: true,
      user: { id: 'user-1', email: 'admin@circletel.co.za' } as any,
      adminUser: {
        id: 'admin-1',
        email: 'admin@circletel.co.za',
        role: 'admin',
      } as any,
    });
    mockRequirePermission.mockReturnValue(null);
    mockSvc.mockReturnValue({ from: jest.fn() } as any);
    mockSaveManualB2BIntake.mockResolvedValue({
      customerId: 'customer-1',
      accountNumber: 'CT-2026-00042',
      submissionId: 'submission-1',
      createdCustomer: true,
      createdSubmission: true,
    });
  });

  it('requires customer write or KYC verification permission', async () => {
    await POST(request(validBody));

    expect(mockRequirePermission).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'admin@circletel.co.za' }),
      ['customers:write', 'kyc:verify']
    );
  });

  it('delegates valid manual intake payloads to the domain service', async () => {
    const response = await POST(request(validBody));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      success: true,
      intake: {
        customerId: 'customer-1',
        accountNumber: 'CT-2026-00042',
        submissionId: 'submission-1',
        createdCustomer: true,
        createdSubmission: true,
      },
    });
    expect(mockSaveManualB2BIntake).toHaveBeenCalledWith(
      expect.any(Object),
      validBody,
      { adminId: 'admin-1', adminEmail: 'admin@circletel.co.za' }
    );
  });

  it('rejects malformed payloads before touching Supabase', async () => {
    const response = await POST(request({ business: { businessName: 'A' } }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBe('validation_failed');
    expect(mockSvc).not.toHaveBeenCalled();
    expect(mockSaveManualB2BIntake).not.toHaveBeenCalled();
  });
});
