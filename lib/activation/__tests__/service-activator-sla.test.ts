/**
 * Service Activator — SLA tracking guard
 *
 * Ensures SLA update continues (no throw) when public.sla_tracking is missing
 * (PGRST205 / 42P01). Live DB currently has no sla_tracking table; activation
 * must not hard-fail. activateService delegates to updateSlaTrackingOnActivation.
 */

import { describe, it, expect, jest } from '@jest/globals';
import {
  isMissingRelationError,
  updateSlaTrackingOnActivation,
} from '@/lib/activation/service-activator';
import { activationLogger } from '@/lib/logging';

describe('isMissingRelationError', () => {
  it('detects PostgREST schema-cache miss (PGRST205)', () => {
    expect(
      isMissingRelationError({
        code: 'PGRST205',
        message: "Could not find the table 'public.sla_tracking' in the schema cache",
      })
    ).toBe(true);
  });

  it('detects Postgres undefined_table (42P01)', () => {
    expect(
      isMissingRelationError({
        code: '42P01',
        message: 'relation "public.sla_tracking" does not exist',
      })
    ).toBe(true);
  });

  it('returns false for unrelated errors', () => {
    expect(
      isMissingRelationError({ code: '42501', message: 'permission denied' })
    ).toBe(false);
    expect(isMissingRelationError(null)).toBe(false);
  });
});

describe('updateSlaTrackingOnActivation (guard)', () => {
  it('does not throw and warns when sla_tracking is missing (PGRST205)', async () => {
    const warnSpy = jest.spyOn(activationLogger, 'warn').mockImplementation(() => undefined);
    const errorSpy = jest.spyOn(activationLogger, 'error').mockImplementation(() => undefined);

    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: {
              code: 'PGRST205',
              message:
                "Could not find the table 'public.sla_tracking' in the schema cache",
            },
          }),
        }),
      }),
    };

    await expect(
      updateSlaTrackingOnActivation(mockSupabase as never, 'order-missing-sla')
    ).resolves.toBeUndefined();

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('sla_tracking table missing'),
      expect.objectContaining({ orderId: 'order-missing-sla', code: 'PGRST205' })
    );
    expect(errorSpy).not.toHaveBeenCalled();

    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('does not throw and logs error for non-missing SLA failures', async () => {
    const errorSpy = jest.spyOn(activationLogger, 'error').mockImplementation(() => undefined);

    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: {
              code: '42501',
              message: 'permission denied for table sla_tracking',
            },
          }),
        }),
      }),
    };

    await expect(
      updateSlaTrackingOnActivation(mockSupabase as never, 'order-perm')
    ).resolves.toBeUndefined();

    expect(errorSpy).toHaveBeenCalledWith(
      'Failed to update SLA tracking',
      expect.objectContaining({ orderId: 'order-perm', code: '42501' })
    );

    errorSpy.mockRestore();
  });

  it('does not throw when supabase client throws', async () => {
    const errorSpy = jest.spyOn(activationLogger, 'error').mockImplementation(() => undefined);

    const mockSupabase = {
      from: jest.fn(() => {
        throw new Error('network down');
      }),
    };

    await expect(
      updateSlaTrackingOnActivation(mockSupabase as never, 'order-throw')
    ).resolves.toBeUndefined();

    expect(errorSpy).toHaveBeenCalledWith(
      'SLA tracking update threw unexpectedly',
      expect.objectContaining({ orderId: 'order-throw', error: 'network down' })
    );

    errorSpy.mockRestore();
  });

  it('logs info on successful SLA update', async () => {
    const infoSpy = jest.spyOn(activationLogger, 'info').mockImplementation(() => undefined);

    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    };

    await expect(
      updateSlaTrackingOnActivation(mockSupabase as never, 'order-ok')
    ).resolves.toBeUndefined();

    expect(infoSpy).toHaveBeenCalledWith(
      'SLA tracking updated',
      expect.objectContaining({ orderId: 'order-ok' })
    );

    infoSpy.mockRestore();
  });
});
