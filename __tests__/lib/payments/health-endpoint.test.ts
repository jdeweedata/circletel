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
        // Arrange
        const mockHealthChecks = [
          {
            provider: 'netcash' as PaymentProviderType,
            healthy: true,
            configured: true,
            available: true,
            response_time_ms: 150
          },
          {
            provider: 'payfast' as PaymentProviderType,
            healthy: true,
            configured: true,
            available: true,
            response_time_ms: 120
          }
        ];

        mockedFactory.healthCheckAll.mockResolvedValue(mockHealthChecks);

        const request = new NextRequest('http://localhost:3000/api/payments/health');

        // Act
        const response = await GET(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(data.status).toBe('healthy');
        expect(data.providers).toHaveLength(2);
        expect(data.summary.total_providers).toBe(2);
        expect(data.summary.healthy_providers).toBe(2);
        expect(data.summary.unhealthy_providers).toBe(0);
        expect(data.summary.configured_providers).toBe(2);
        expect(data.summary.unconfigured_providers).toBe(0);
        expect(data.timestamp).toBeDefined();
        expect(data.response_time_ms).toBeGreaterThan(0);
      });

      it('should return degraded status when some providers are unhealthy', async () => {
        // Arrange
        const mockHealthChecks = [
          {
            provider: 'netcash' as PaymentProviderType,
            healthy: true,
            configured: true,
            available: true,
            response_time_ms: 150
          },
          {
            provider: 'zoho_billing' as PaymentProviderType,
            healthy: false,
            configured: false,
            available: true,
            response_time_ms: 50
          }
        ];

        mockedFactory.healthCheckAll.mockResolvedValue(mockHealthChecks);

        const request = new NextRequest('http://localhost:3000/api/payments/health');

        // Act
        const response = await GET(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(data.status).toBe('degraded');
        expect(data.summary.healthy_providers).toBe(1);
        expect(data.summary.unhealthy_providers).toBe(1);
      });

      it('should return unhealthy status when all providers are unhealthy', async () => {
        // Arrange
        const mockHealthChecks = [
          {
            provider: 'netcash' as PaymentProviderType,
            healthy: false,
            configured: false,
            available: true,
            response_time_ms: 50
          },
          {
            provider: 'zoho_billing' as PaymentProviderType,
            healthy: false,
            configured: false,
            available: true,
            response_time_ms: 50
          }
        ];

        mockedFactory.healthCheckAll.mockResolvedValue(mockHealthChecks);

        const request = new NextRequest('http://localhost:3000/api/payments/health');

        // Act
        const response = await GET(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(data.status).toBe('unhealthy');
        expect(data.summary.healthy_providers).toBe(0);
        expect(data.summary.unhealthy_providers).toBe(2);
      });

      it('should include capabilities when detailed=true', async () => {
        // Arrange
        const mockHealthChecks = [
          {
            provider: 'netcash' as PaymentProviderType,
            healthy: true,
            configured: true,
            available: true,
            response_time_ms: 150
          }
        ];

        const mockCapabilities = {
          supports_cards: true,
          supports_eft: true,
          supports_instant_eft: true,
          supports_recurring: true,
          supports_refunds: true,
          supported_currencies: ['ZAR'],
          max_amount: null,
          min_amount: 1.0
        };

        mockedFactory.healthCheckAll.mockResolvedValue(mockHealthChecks);
        mockedFactory.getProviderCapabilities.mockReturnValue(mockCapabilities);

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
        const mockHealthChecks = [
          {
            provider: 'netcash' as PaymentProviderType,
            healthy: true,
            configured: true,
            available: true,
            response_time_ms: 150
          }
        ];

        mockedFactory.healthCheckAll.mockResolvedValue(mockHealthChecks);

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
        const mockProvider = {
          name: 'netcash' as PaymentProviderType,
          isConfigured: jest.fn().mockReturnValue(true),
          getCapabilities: jest.fn().mockReturnValue({
            supports_cards: true,
            supports_eft: true,
            supports_instant_eft: true,
            supports_recurring: true,
            supports_refunds: true,
            supported_currencies: ['ZAR'],
            max_amount: null,
            min_amount: 1.0
          })
        };

        mockedFactory.isProviderAvailable.mockReturnValue(true);
        mockedFactory.getProvider.mockReturnValue(mockProvider as any);

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
        mockedFactory.isProviderAvailable.mockReturnValue(false);
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
          supports_cards: true,
          supports_eft: true,
          supports_instant_eft: true,
          supports_recurring: true,
          supports_refunds: true,
          supported_currencies: ['ZAR'],
          max_amount: null,
          min_amount: 1.0
        };

        const mockProvider = {
          name: 'netcash' as PaymentProviderType,
          isConfigured: jest.fn().mockReturnValue(true),
          getCapabilities: jest.fn().mockReturnValue(mockCapabilities)
        };

        mockedFactory.isProviderAvailable.mockReturnValue(true);
        mockedFactory.getProvider.mockReturnValue(mockProvider as any);

        const request = new NextRequest('http://localhost:3000/api/payments/health?provider=netcash&detailed=true');

        // Act
        const response = await GET(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(data.providers[0].capabilities).toEqual(mockCapabilities);
        expect(mockProvider.getCapabilities).toHaveBeenCalled();
      });
    });

    describe('Error Handling', () => {
      it('should return 500 when health check throws error', async () => {
        // Arrange
        mockedFactory.healthCheckAll.mockRejectedValue(new Error('Database connection failed'));

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
        mockedFactory.healthCheckAll.mockRejectedValue('String error');

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
        const mockHealthChecks = [
          {
            provider: 'netcash' as PaymentProviderType,
            healthy: true,
            configured: true,
            available: true,
            response_time_ms: 150
          }
        ];

        mockedFactory.healthCheckAll.mockResolvedValue(mockHealthChecks);

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
        const mockHealthChecks = [
          {
            provider: 'netcash' as PaymentProviderType,
            healthy: true,
            configured: true,
            available: true,
            response_time_ms: 150
          }
        ];

        mockedFactory.healthCheckAll.mockResolvedValue(mockHealthChecks);

        const request = new NextRequest('http://localhost:3000/api/payments/health');

        // Act
        const response = await GET(request);
        const data = await response.json();

        // Assert
        expect(data.response_time_ms).toBeGreaterThan(0);
        expect(typeof data.response_time_ms).toBe('number');
      });

      it('should include all summary fields', async () => {
        // Arrange
        const mockHealthChecks = [
          {
            provider: 'netcash' as PaymentProviderType,
            healthy: true,
            configured: true,
            available: true,
            response_time_ms: 150
          },
          {
            provider: 'zoho_billing' as PaymentProviderType,
            healthy: false,
            configured: false,
            available: true,
            response_time_ms: 50
          }
        ];

        mockedFactory.healthCheckAll.mockResolvedValue(mockHealthChecks);

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

        expect(data.summary.total_providers).toBe(2);
        expect(data.summary.healthy_providers).toBe(1);
        expect(data.summary.unhealthy_providers).toBe(1);
        expect(data.summary.configured_providers).toBe(1);
        expect(data.summary.unconfigured_providers).toBe(1);
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
      // Arrange
      const mockHealthChecks = [
        {
          provider: 'netcash' as PaymentProviderType,
          healthy: true,
          configured: true,
          available: true,
          response_time_ms: 150
        },
        {
          provider: 'zoho_billing' as PaymentProviderType,
          healthy: false,
          configured: false,
          available: true,
          response_time_ms: 50
        },
        {
          provider: 'payfast' as PaymentProviderType,
          healthy: true,
          configured: true,
          available: true,
          response_time_ms: 200
        },
        {
          provider: 'paygate' as PaymentProviderType,
          healthy: false,
          configured: false,
          available: true,
          response_time_ms: 30
        }
      ];

      mockedFactory.healthCheckAll.mockResolvedValue(mockHealthChecks);

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
      const mockHealthChecks = [
        {
          provider: 'netcash' as PaymentProviderType,
          healthy: true,
          configured: true,
          available: true,
          response_time_ms: 150
        }
      ];

      // Simulate slow health check
      mockedFactory.healthCheckAll.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return mockHealthChecks;
      });

      const request = new NextRequest('http://localhost:3000/api/payments/health');

      // Act
      const startTime = Date.now();
      const response = await GET(request);
      const endTime = Date.now();
      const data = await response.json();

      // Assert
      const actualDuration = endTime - startTime;
      expect(data.response_time_ms).toBeGreaterThan(90); // At least 90ms (accounting for test overhead)
      expect(data.response_time_ms).toBeLessThan(actualDuration + 50); // Within 50ms of actual
    });
  });
});
