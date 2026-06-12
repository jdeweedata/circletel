import { NextRequest } from 'next/server';

import { POST } from '../route';
import { authenticateAdmin, requirePermission } from '@/lib/auth/admin-api-auth';
import { svc } from '@/lib/onboarding/onboarding-service';

jest.mock('@/lib/auth/admin-api-auth', () => ({
  authenticateAdmin: jest.fn(),
  requirePermission: jest.fn(),
}));

jest.mock('@/lib/onboarding/onboarding-service', () => ({
  svc: jest.fn(),
}));

jest.mock('@/lib/logging/logger', () => ({
  apiLogger: {
    error: jest.fn(),
    info: jest.fn(),
  },
}));

const mockAuthenticateAdmin = authenticateAdmin as jest.MockedFunction<typeof authenticateAdmin>;
const mockRequirePermission = requirePermission as jest.MockedFunction<typeof requirePermission>;
const mockSvc = svc as jest.MockedFunction<typeof svc>;

function request(body: Record<string, unknown>) {
  return new Request('http://localhost/api/admin/unjani/update-contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as NextRequest;
}

describe('POST /api/admin/unjani/update-contact', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthenticateAdmin.mockResolvedValue({
      success: true,
      user: { id: 'user-1', email: 'admin@circletel.co.za' } as any,
      adminUser: { email: 'admin@circletel.co.za', role: 'admin' } as any,
    });
    mockRequirePermission.mockReturnValue(null);
  });

  it('requires the customer-write permission for contact edits', async () => {
    await POST(request({ customerId: 'clinic-1', phone: 'not-a-phone' }));

    expect(mockRequirePermission).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'admin@circletel.co.za' }),
      'customers:write'
    );
  });

  it('rejects malformed phone numbers before touching the database', async () => {
    const response = await POST(request({ customerId: 'clinic-1', phone: 'abcdef' }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/valid phone/i);
    expect(mockSvc).not.toHaveBeenCalled();
  });

  it('rejects blank email values instead of saving an empty customer email', async () => {
    const response = await POST(request({ customerId: 'clinic-1', email: '   ' }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/email/i);
    expect(mockSvc).not.toHaveBeenCalled();
  });

  it('normalizes phone and email before saving valid contact details', async () => {
    const customerLookup = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          id: 'clinic-1',
          business_name: 'Unjani Clinic - Training Demo',
          account_type: 'business',
          clinic_details: { province: 'Gauteng' },
        },
        error: null,
      }),
    };
    const emailLookup = {
      select: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    };
    const updateEq = jest.fn().mockResolvedValue({ error: null });
    const updateTable = {
      update: jest.fn().mockReturnValue({ eq: updateEq }),
    };

    mockSvc.mockReturnValue({
      from: jest
        .fn()
        .mockReturnValueOnce(customerLookup)
        .mockReturnValueOnce(emailLookup)
        .mockReturnValueOnce(updateTable),
    } as any);

    const response = await POST(
      request({
        customerId: 'clinic-1',
        nurseName: ' Training Nurse ',
        phone: '073 728-8016',
        email: ' JEFFREY.DE.WEE+UNJANI-TRAINING@CIRCLETEL.CO.ZA ',
      })
    );

    expect(response.status).toBe(200);
    expect(updateTable.update).toHaveBeenCalledWith(
      expect.objectContaining({
        phone: '0737288016',
        email: 'jeffrey.de.wee+unjani-training@circletel.co.za',
        clinic_details: expect.objectContaining({ nurse_owner_name: 'Training Nurse' }),
      })
    );
  });
});
