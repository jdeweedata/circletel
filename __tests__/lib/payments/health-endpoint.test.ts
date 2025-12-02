/**
 * Tests for Payment Provider Health Check API Endpoint
 *
 * @group api
 * @group payments
 * @group health-check
 */

import { NextRequest } from 'next/server';
import { GET, OPTIONS } from '@/app/api/payments/health/route';
import { PaymentProviderFactory } from '@/lib/payments/payment-provider-factory';
import type { PaymentProviderType } from '@/lib/types/payment.types';

// Mock PaymentProviderFactory
jest.mock('@/lib/payments/payment-provider-factory');

describe('Payment Health Check API Endpoint', () => {
  const mockedFactory = PaymentProviderFactory as jest.Mocked<typeof PaymentProviderFactory>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Set up default mock environment
    process.env.NETCASH_SERVICE_KEY = 'test-service-key';
    process.env.NETCASH_MERCHANT_ID = 'test-merchant-id';
  });

  afterEach(() => {
    // Clean up environment
    delete process.env.NETCASH_SERVICE_KEY;
    delete process.env.NETCASH_MERCHANT_ID;
  });

  describe('GET /api/payments/health', () => {
    describe('All Providers Health Check', () => {
      it('should return healthy status when all providers are configured', async () => {
        // Arrange - Mock all providers as available
        mockedFactory.isProviderAvailable.mockReturnValue(true);
        mockedFactory.getProvider.mockReturnValue({
          name: 'netcash' as PaymentProviderType,
          isConfigured: jest.fn().mockReturnValue(true),
          getCapabilities: jest.fn().mockReturnValue({
            payment_methods: ['card', 'eft', 'instant_eft'],
            recurring_payments: true,
            refunds: true
          })
        } as any);

        const request = new NextRequest('http://localhost:3000/api/payments/health');

        // Act
        const response = await GET(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(data.status).toBe('healthy');
        expect(data.providers).toHaveLength(4); // netcash, zoho_billing, payfast, paygate
        expect(data.summary.total_providers).toBe(4);
        expect(data.summary.healthy_providers).toBe(4);
        expect(data.summary.unhealthy_providers).toBe(0);
        expect(data.summary.configured_providers).toBe(4);
        expect(data.summary.unconfigured_providers).toBe(0);
        expect(data.timestamp).toBeDefined();
        expect(data.response_time_ms).toBeGreaterThanOrEqual(0);
      });

      it('should return degraded status when some providers are unhealthy', async () => {
        // Arrange - Only netcash is available
        mockedFactory.isProviderAvailable.mockImplementation((provider: PaymentProviderType) => {
          return provider === 'netcash';
        });

        const request = new NextRequest('http://localhost:3000/api/payments/health');

        // Act
        const response = await GET(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(data.status).toBe('degraded');
        expect(data.summary.healthy_providers).toBe(1);
        expect(data.summary.unhealthy_providers).toBe(3);
      });

      it('should return unhealthy status when all providers are unhealthy', async () => {
        // Arrange - No providers available
        mockedFactory.isProviderAvailable.mockReturnValue(false);

        const request = new NextRequest('http://localhost:3000/api/payments/health');

        // Act
        const response = await GET(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(data.status).toBe('unhealthy');
        expect(data.summary.healthy_providers).toBe(0);
        expect(data.summary.unhealthy_providers).toBe(4);
      });

      it('should include capabilities when detailed=true', async () => {
        // Arrange
        mockedFactory.isProviderAvailable.mockReturnValue(true);
        mockedFactory.getProvider.mockReturnValue({
          name: 'netcash' as PaymentProviderType,
          isConfigured: jest.fn().mockReturnValue(true),
          getCapabilities: jest.fn().mockReturnValue({
            payment_methods: ['card', 'eft', 'instant_eft'],
            recurring_payments: true,
            refunds: true
          })
        } as any);

        const request = new NextRequest('http://localhost:3000/api/payments/health?detailed=true');

        // Act
        const response = await GET(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(data.providers[0].capabilities).toBeDefined();
        expect(data.providers[0].capabilities.supports_cards).toBe(true);
        expect(data.providers[0].capabilities.supported_currencies).toContain('ZAR');
      });

      it('should not include capabilities when detailed=false', async () => {
        // Arrange
        mockedFactory.isProviderAvailable.mockReturnValue(false);

        const request = new NextRequest('http://localhost:3000/api/payments/health');

        // Act
        const response = await GET(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(data.providers[0].capabilities).toBeUndefined();
      });
    });

    describe('Specific Provider Health Check', () => {
      it('should return health check for specific provider', async () => {
        // Arrange
        mockedFactory.isProviderAvailable.mockReturnValue(true);
        mockedFactory.getProvider.mockReturnValue({
          name: 'netcash' as PaymentProviderType,
          isConfigured: jest.fn().mockReturnValue(true),
          getCapabilities: jest.fn().mockReturnValue({
            payment_methods: ['card', 'eft', 'instant_eft'],
            recurring_payments: true,
            refunds: true
          })
        } as any);

        const request = new NextRequest('http://localhost:3000/api/payments/health?provider=netcash');

        // Act
        const response = await GET(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(data.providers).toHaveLength(1);
        expect(data.providers[0].provider).toBe('netcash');
        expect(data.providers[0].healthy).toBe(true);
        expect(data.providers[0].configured).toBe(true);
      });

      it('should return 404 for unknown provider', async () => {
        // Arrange
        mockedFactory.getAvailableProviders.mockReturnValue(['netcash', 'payfast']);

        const request = new NextRequest('http://localhost:3000/api/payments/health?provider=unknown');

        // Act
        const response = await GET(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(404);
        expect(data.error).toBe('Provider not found');
        expect(data.available_providers).toContain('netcash');
        expect(data.available_providers).toContain('payfast');
      });

      it('should include capabilities for specific provider when detailed=true', async () => {
        // Arrange
        const mockCapabilities = {
          payment_methods: ['card', 'eft', 'instant_eft'],
          recurring_payments: true,
          refunds: true
        };

        mockedFactory.isProviderAvailable.mockReturnValue(true);
        mockedFactory.getProvider.mockReturnValue({
          name: 'netcash' as PaymentProviderType,
          isConfigured: jest.fn().mockReturnValue(true),
          getCapabilities: jest.fn().mockReturnValue(mockCapabilities)
        } as any);

        const request = new NextRequest('http://localhost:3000/api/payments/health?provider=netcash&detailed=true');

        // Act
        const response = await GET(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(data.providers[0].capabilities).toBeDefined();
        expect(data.providers[0].capabilities.supports_cards).toBe(true);
        expect(data.providers[0].capabilities.supports_eft).toBe(true);
        expect(data.providers[0].capabilities.supports_recurring).toBe(true);
        expect(data.providers[0].capabilities.supports_refunds).toBe(true);
      });
    });

    describe('Error Handling', () => {
      it('should return 500 when isProviderAvailable throws error', async () => {
        // Arrange
        mockedFactory.isProviderAvailable.mockImplementation(() => {
          throw new Error('Database connection failed');
        });

        const request = new NextRequest('http://localhost:3000/api/payments/health');

        // Act
        const response = await GET(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(500);
        expect(data.status).toBe('error');
        expect(data.error).toBe('Health check failed');
        expect(data.message).toBe('Database connection failed');
        expect(data.timestamp).toBeDefined();
      });

      it('should handle non-Error exceptions gracefully', async () => {
        // Arrange
        mockedFactory.isProviderAvailable.mockImplementation(() => {
          throw 'String error';
        });

        const request = new NextRequest('http://localhost:3000/api/payments/health');

        // Act
        const response = await GET(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(500);
        expect(data.status).toBe('error');
        expect(data.message).toBe('Unknown error occurred');
      });
    });

    describe('Response Format', () => {
      it('should include timestamp in ISO format', async () => {
        // Arrange
        mockedFactory.isProviderAvailable.mockReturnValue(true);
        mockedFactory.getProvider.mockReturnValue({
          name: 'netcash' as PaymentProviderType,
          isConfigured: jest.fn().mockReturnValue(true),
          getCapabilities: jest.fn().mockReturnValue({
            payment_methods: ['card'],
            recurring_payments: false,
            refunds: false
          })
        } as any);

        const request = new NextRequest('http://localhost:3000/api/payments/health');

        // Act
        const response = await GET(request);
        const data = await response.json();

        // Assert
        expect(data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        expect(new Date(data.timestamp).toISOString()).toBe(data.timestamp);
      });

      it('should include response time in milliseconds', async () => {
        // Arrange
        mockedFactory.isProviderAvailable.mockReturnValue(true);
        mockedFactory.getProvider.mockReturnValue({
          name: 'netcash' as PaymentProviderType,
          isConfigured: jest.fn().mockReturnValue(true),
          getCapabilities: jest.fn().mockReturnValue({
            payment_methods: ['card'],
            recurring_payments: false,
            refunds: false
          })
        } as any);

        const request = new NextRequest('http://localhost:3000/api/payments/health');

        // Act
        const response = await GET(request);
        const data = await response.json();

        // Assert
        expect(data.response_time_ms).toBeGreaterThanOrEqual(0);
        expect(typeof data.response_time_ms).toBe('number');
      });

      it('should include all summary fields', async () => {
        // Arrange - netcash configured, others not
        mockedFactory.isProviderAvailable.mockImplementation((provider: PaymentProviderType) => {
          return provider === 'netcash' || provider === 'payfast';
        });

        const request = new NextRequest('http://localhost:3000/api/payments/health');

        // Act
        const response = await GET(request);
        const data = await response.json();

        // Assert
        expect(data.summary).toHaveProperty('total_providers');
        expect(data.summary).toHaveProperty('healthy_providers');
        expect(data.summary).toHaveProperty('unhealthy_providers');
        expect(data.summary).toHaveProperty('configured_providers');
        expect(data.summary).toHaveProperty('unconfigured_providers');

        expect(data.summary.total_providers).toBe(4);
        expect(data.summary.healthy_providers).toBe(2);
        expect(data.summary.unhealthy_providers).toBe(2);
        expect(data.summary.configured_providers).toBe(2);
        expect(data.summary.unconfigured_providers).toBe(2);
      });
    });
  });

  describe('OPTIONS /api/payments/health', () => {
    it('should return CORS headers', async () => {
      // Act
      const response = await OPTIONS();

      // Assert
      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, OPTIONS');
      expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Content-Type');
      expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Authorization');
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle scenario with mixed provider states', async () => {
      // Arrange - netcash and payfast available, zoho_billing and paygate not
      mockedFactory.isProviderAvailable.mockImplementation((provider: PaymentProviderType) => {
        return provider === 'netcash' || provider === 'payfast';
      });

      const request = new NextRequest('http://localhost:3000/api/payments/health');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(data.status).toBe('degraded'); // Some healthy, some unhealthy
      expect(data.summary.total_providers).toBe(4);
      expect(data.summary.healthy_providers).toBe(2);
      expect(data.summary.unhealthy_providers).toBe(2);
      expect(data.summary.configured_providers).toBe(2);
      expect(data.summary.unconfigured_providers).toBe(2);
    });

    it('should measure actual response time', async () => {
      // Arrange
      mockedFactory.isProviderAvailable.mockReturnValue(true);
      mockedFactory.getProvider.mockReturnValue({
        name: 'netcash' as PaymentProviderType,
        isConfigured: jest.fn().mockReturnValue(true),
        getCapabilities: jest.fn().mockReturnValue({
          payment_methods: ['card'],
          recurring_payments: false,
          refunds: false
        })
      } as any);

      const request = new NextRequest('http://localhost:3000/api/payments/health');

      // Act
      const startTime = Date.now();
      const response = await GET(request);
      const endTime = Date.now();
      const data = await response.json();

      // Assert
      const actualDuration = endTime - startTime;
      expect(data.response_time_ms).toBeGreaterThanOrEqual(0);
      expect(data.response_time_ms).toBeLessThan(actualDuration + 100); // Within reasonable bounds
    });
  });
});
