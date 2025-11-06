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

    // Perform health checks
    let healthChecks;

    if (providerParam) {
      // Check specific provider
      if (!PaymentProviderFactory.isProviderAvailable(providerParam)) {
        return NextResponse.json(
          {
            error: 'Provider not found',
            message: `Payment provider '${providerParam}' is not available`,
            available_providers: PaymentProviderFactory.getAvailableProviders()
          },
          { status: 404 }
        );
      }

      const provider = PaymentProviderFactory.getProvider(providerParam);
      const isConfigured = provider.isConfigured();
      const capabilities = detailed ? provider.getCapabilities() : undefined;

      healthChecks = [{
        provider: providerParam,
        healthy: isConfigured,
        configured: isConfigured,
        available: true,
        response_time_ms: Date.now() - startTime,
        ...(detailed && { capabilities })
      }];
    } else {
      // Check all providers
      healthChecks = await PaymentProviderFactory.healthCheckAll();

      // Add capabilities if detailed mode
      if (detailed) {
        healthChecks = healthChecks.map(check => {
          const capabilities = PaymentProviderFactory.getProviderCapabilities(check.provider);
          return {
            ...check,
            capabilities
          };
        });
      }
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
