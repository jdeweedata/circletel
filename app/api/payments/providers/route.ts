/**
 * Payment Providers API
 *
 * GET /api/payments/providers
 *
 * Returns all payment provider configurations and health status from database.
 * This endpoint loads directly from the database, not from the factory cache.
 *
 * @module app/api/payments/providers
 */

import { NextRequest, NextResponse } from 'next/server';
import { PaymentProviderSettingsLoader } from '@/lib/payments/payment-provider-settings-loader';
import { PaymentProviderFactory } from '@/lib/payments/payment-provider-factory';
import type { PaymentProviderType } from '@/lib/types/payment.types';

/**
 * GET handler - Load all payment provider configurations
 */
export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const providerParam = searchParams.get('provider') as PaymentProviderType | null;
    const healthCheck = searchParams.get('health') === 'true';

    // Load from database
    if (healthCheck) {
      // Load provider health from database view
      const healthData = await PaymentProviderSettingsLoader.loadProviderHealth();

      // Add capabilities for each provider
      const providersWithCapabilities = await Promise.all(
        healthData.map(async (health) => {
          let configured = false;
          let capabilities = null;

          // Try to get capabilities from factory
          try {
            const caps = PaymentProviderFactory.getProviderCapabilities(health.provider);
            capabilities = caps;
            configured = caps !== null;
          } catch (error) {
            // Provider not available in factory
            configured = false;
          }

          return {
            provider: health.provider,
            enabled: health.enabled,
            priority: health.priority,
            test_mode: health.test_mode,
            healthy: health.enabled && configured,
            configured,
            available: configured,
            capabilities,
            stats: {
              total_transactions: health.total_transactions,
              completed_transactions: health.completed_transactions,
              failed_transactions: health.failed_transactions,
              total_amount: health.total_amount,
              avg_completion_time_seconds: health.avg_completion_time_seconds
            }
          };
        })
      );

      // Calculate summary
      const summary = {
        total_providers: providersWithCapabilities.length,
        healthy_providers: providersWithCapabilities.filter(p => p.healthy).length,
        unhealthy_providers: providersWithCapabilities.filter(p => !p.healthy).length,
        configured_providers: providersWithCapabilities.filter(p => p.configured).length,
        unconfigured_providers: providersWithCapabilities.filter(p => !p.configured).length
      };

      // Determine overall status
      const overallStatus = summary.healthy_providers > 0
        ? (summary.unhealthy_providers === 0 ? 'healthy' : 'degraded')
        : 'unhealthy';

      return NextResponse.json({
        status: overallStatus,
        timestamp: new Date().toISOString(),
        response_time_ms: Date.now() - startTime,
        providers: providersWithCapabilities,
        summary
      });
    }

    // Regular provider list (no health check)
    let providers;

    if (providerParam) {
      // Load specific provider
      const provider = await PaymentProviderSettingsLoader.loadProvider(providerParam);
      if (!provider) {
        return NextResponse.json(
          {
            error: 'Provider not found',
            message: `Payment provider '${providerParam}' not found in database`
          },
          { status: 404 }
        );
      }
      providers = [provider];
    } else {
      // Load all providers
      providers = await PaymentProviderSettingsLoader.loadAllProviders();
    }

    // Remove sensitive data
    const safeProviders = providers.map(p => ({
      provider: p.provider,
      enabled: p.enabled,
      priority: p.priority,
      test_mode: p.test_mode,
      min_amount: p.min_amount,
      max_amount: p.max_amount,
      daily_limit: p.daily_limit,
      webhook_url: p.webhook_url,
      webhook_events: p.webhook_events,
      created_at: p.created_at,
      updated_at: p.updated_at
      // Omit credentials, webhook_secret, settings
    }));

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      response_time_ms: Date.now() - startTime,
      providers: safeProviders,
      total: safeProviders.length
    });

  } catch (error) {
    console.error('Provider API error:', error);

    return NextResponse.json(
      {
        error: 'Failed to load providers',
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
