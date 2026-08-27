import { NextRequest } from 'next/server';
import { getConsumerOrder } from '@/lib/orders/get-consumer-order';
import { createClient, createClientWithSession } from '@/lib/supabase/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { getOrderCreditReview } from '@/lib/credit-risk/review-store';

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
  createClientWithSession: jest.fn(),
}));

jest.mock('@/lib/auth/admin-api-auth', () => ({
  authenticateAdmin: jest.fn(),
}));

jest.mock('@/lib/credit-risk/review-store', () => ({
  getOrderCreditReview: jest.fn(),
}));

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
const mockCreateClientWithSession = createClientWithSession as jest.MockedFunction<
  typeof createClientWithSession
>;
const mockAuthenticateAdmin = authenticateAdmin as jest.MockedFunction<typeof authenticateAdmin>;
const mockGetOrderCreditReview = getOrderCreditReview as jest.MockedFunction<
  typeof getOrderCreditReview
>;

const ORDER = {
  id: '5a486aed-818a-45e0-aadd-e7a3445b32f7',
  order_number: 'ORD-20260821-9026',
  customer_id: 'cust-1',
  email: 'ishmael.poloko@yahoo.com',
  first_name: 'Ishmael',
  last_name: 'Makoanyane',
  phone: '+27681452806',
  installation_address: 'Flat 10, 69 Volta Street, Ext 10, Lenasia',
};

function request(url: string, headers?: Record<string, string>) {
  return new Request(url, {
    method: 'GET',
    headers,
  }) as NextRequest;
}

function mockFrom(orderResult: { data: unknown; error: unknown }) {
  const query = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'cust-1' }, error: null }),
    single: jest.fn().mockResolvedValue(orderResult),
  };
  mockCreateClient.mockResolvedValue({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'user-1', email: 'ishmael.poloko@yahoo.com' } },
      }),
    },
    from: jest.fn().mockReturnValue(query),
  } as any);
  return query;
}

describe('GET /api/orders/create ownership', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetOrderCreditReview.mockResolvedValue(null);
    mockCreateClientWithSession.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
      },
    } as any);
  });

  it('returns 401 when no admin or customer session exists', async () => {
    mockAuthenticateAdmin.mockResolvedValue({ success: false } as any);
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
      },
      from: jest.fn(),
    } as any);

    const response = await getConsumerOrder(
      request('http://localhost/api/orders/create?id=5a486aed-818a-45e0-aadd-e7a3445b32f7')
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toMatch(/unauthorized/i);
  });

  it('returns the order to the owning customer and strips bureau fields', async () => {
    mockAuthenticateAdmin.mockResolvedValue({ success: false } as any);
    mockFrom({ data: ORDER, error: null });
    mockGetOrderCreditReview.mockResolvedValue({
      consumer_order_id: ORDER.id,
      decision: 'HARD_FAIL',
      flags: { debt_review: true, debt_review_date: '2017-12-19', score: 12 },
      private_note: 'Do not quote the date.',
    } as any);

    const response = await getConsumerOrder(
      request('http://localhost/api/orders/create?id=5a486aed-818a-45e0-aadd-e7a3445b32f7', {
        authorization: 'Bearer customer-token',
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.order.email).toBe(ORDER.email);
    expect(body.order.credit_outcome.code).toBe('cannot_take_credit');
    expect(JSON.stringify(body)).not.toMatch(/debt_review|2017-12-19|TransUnion|score/i);
  });

  it('returns 404 to a signed-in customer who does not own the order', async () => {
    mockAuthenticateAdmin.mockResolvedValue({ success: false } as any);
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-other', email: 'kassim@example.com' } },
        }),
      },
      from: jest.fn((table: string) => {
        if (table === 'customers') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'cust-other' }, error: null }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: ORDER, error: null }),
        };
      }),
    } as any);

    const response = await getConsumerOrder(
      request('http://localhost/api/orders/create?id=5a486aed-818a-45e0-aadd-e7a3445b32f7', {
        authorization: 'Bearer other-token',
      })
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toMatch(/not found/i);
    expect(body.order).toBeUndefined();
  });

  it('allows an admin to read any order', async () => {
    mockAuthenticateAdmin.mockResolvedValue({
      success: true,
      user: { email: 'vineshs@circletel.co.za' },
    } as any);
    mockFrom({ data: ORDER, error: null });

    const response = await getConsumerOrder(
      request('http://localhost/api/orders/create?id=5a486aed-818a-45e0-aadd-e7a3445b32f7')
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.order.order_number).toBe('ORD-20260821-9026');
  });

  it('rejects a customer listing another email', async () => {
    mockAuthenticateAdmin.mockResolvedValue({ success: false } as any);
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-1', email: 'ishmael.poloko@yahoo.com' } },
        }),
      },
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'cust-1' }, error: null }),
      }),
    } as any);

    const response = await getConsumerOrder(
      request('http://localhost/api/orders/create?email=kassim@example.com', {
        authorization: 'Bearer customer-token',
      })
    );

    expect(response.status).toBe(401);
  });
});
