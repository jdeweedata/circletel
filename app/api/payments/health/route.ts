import { NextRequest, NextResponse } from 'next/server';
import { PaymentProviderFactory } from '@/lib/payments/payment-provider-factory';
import type { PaymentProviderType } from '@/lib/types/payment.types';

/**
 * Payment Provider Health Check Endpoint
 *
 * GET /api/payments/health
 *
 * Returns health status for all configured payment providers
 * Includes configuration status, availability, and response times
 *
 * @example Response
 * {
 *   "status": "healthy",
 *   "timestamp": "2025-11-06T01:50:00.000Z",
 *   "providers": [
 *     {
 *       "provider": "netcash",
 *       "healthy": true,
 *       "configured": true,
 *       "available": true,
 *       "response_time_ms": 145,
 *       "capabilities": {
 *         "supports_cards": true,
 *         "supports_eft": true,
 *         "supports_instant_eft": true,
 *         "supports_recurring": true,
 *         "supports_refunds": true,
 *         "supported_currencies": ["ZAR"],
 *         "max_amount": null,
 *         "min_amount": 1.0
 *       }
 *     }
 *   ],
 *   "summary": {
 *     "total_providers": 4,
 *     "healthy_providers": 1,
 *     "unhealthy_providers": 3,
 *     "configured_providers": 1,
 *     "unconfigured_providers": 3
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const providerParam = searchParams.get('provider') as PaymentProviderType | null;
    const detailed = searchParams.get('detailed') === 'true';

    // All known payment providers
    const allProviders: PaymentProviderType[] = ['netcash', 'zoho_billing', 'payfast', 'paygate'];

    // Perform health checks
    let healthChecks: Array<{
      provider: PaymentProviderType;
      healthy: boolean;
      configured: boolean;
      available: boolean;
      response_time_ms: number;
      capabilities?: {
        supports_cards: boolean;
        supports_eft: boolean;
        supports_instant_eft: boolean;
        supports_recurring: boolean;
        supports_refunds: boolean;
        supported_currencies: string[];
        max_amount: number | null;
        min_amount: number;
      };
    }>;

    if (providerParam) {
      // Check specific provider
      const isKnownProvider = allProviders.includes(providerParam);
      if (!isKnownProvider) {
        return NextResponse.json(
          {
            error: 'Provider not found',
            message: `Payment provider '${providerParam}' is not a known provider`,
            available_providers: PaymentProviderFactory.getAvailableProviders()
          },
          { status: 404 }
        );
      }

      const isAvailable = PaymentProviderFactory.isProviderAvailable(providerParam);
      let capabilities = undefined;

      if (isAvailable && detailed) {
        try {
          const provider = PaymentProviderFactory.getProvider(providerParam);
          const caps = provider.getCapabilities?.();
          if (caps) {
            capabilities = {
              supports_cards: caps.payment_methods?.includes('card') ?? false,
              supports_eft: caps.payment_methods?.includes('eft') ?? false,
              supports_instant_eft: caps.payment_methods?.includes('instant_eft') ?? false,
              supports_recurring: caps.recurring_payments ?? false,
              supports_refunds: caps.refunds ?? false,
              supported_currencies: ['ZAR'],
              max_amount: null,
              min_amount: 1.0
            };
          }
        } catch {
          // Provider not configured, skip capabilities
        }
      }

      healthChecks = [{
        provider: providerParam,
        healthy: isAvailable,
        configured: isAvailable,
        available: isAvailable,
        response_time_ms: Date.now() - startTime,
        ...(capabilities && { capabilities })
      }];
    } else {
      // Check all providers - include all known providers, not just available ones
      healthChecks = await Promise.all(
        allProviders.map(async (providerType) => {
          const checkStart = Date.now();
          const isAvailable = PaymentProviderFactory.isProviderAvailable(providerType);

          let capabilities = undefined;
          if (isAvailable && detailed) {
            try {
              const provider = PaymentProviderFactory.getProvider(providerType);
              const caps = provider.getCapabilities?.();
              if (caps) {
                capabilities = {
                  supports_cards: caps.payment_methods?.includes('card') ?? false,
                  supports_eft: caps.payment_methods?.includes('eft') ?? false,
                  supports_instant_eft: caps.payment_methods?.includes('instant_eft') ?? false,
                  supports_recurring: caps.recurring_payments ?? false,
                  supports_refunds: caps.refunds ?? false,
                  supported_currencies: ['ZAR'],
                  max_amount: null,
                  min_amount: 1.0
                };
              }
            } catch {
              // Provider not configured, skip capabilities
            }
          }

          return {
            provider: providerType,
            healthy: isAvailable,
            configured: isAvailable,
            available: isAvailable,
            response_time_ms: Date.now() - checkStart,
            ...(capabilities && { capabilities })
          };
        })
      );
    }

    // Calculate summary
    const summary = {
      total_providers: healthChecks.length,
      healthy_providers: healthChecks.filter(c => c.healthy).length,
      unhealthy_providers: healthChecks.filter(c => !c.healthy).length,
      configured_providers: healthChecks.filter(c => c.configured).length,
      unconfigured_providers: healthChecks.filter(c => !c.configured).length
    };

    // Determine overall status
    const overallStatus = summary.healthy_providers > 0
      ? (summary.unhealthy_providers === 0 ? 'healthy' : 'degraded')
      : 'unhealthy';

    // Calculate total response time
    const totalResponseTime = Date.now() - startTime;

    return NextResponse.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      response_time_ms: totalResponseTime,
      providers: healthChecks,
      summary
    });

  } catch (error) {
    console.error('Health check error:', error);

    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS handler for CORS support
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
