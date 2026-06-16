import { createClient } from '@/lib/supabase/server';
import { checkBaseStationProximity } from '@/lib/coverage/mtn/base-station-service';

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe('checkBaseStationProximity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('hydrates missing RPC device_status before deciding whether a BN is online', async () => {
    const rpc = jest.fn().mockResolvedValue({
      data: [
        {
          id: '5b21d2e2-6861-4ef0-b426-4027875a4cf2',
          serial_number: 'BN-LEHLABILE',
          hostname: 'BN-LEHLABILE',
          site_name: 'Lehlabile Secondary School',
          active_connections: 0,
          market: 'GAUTENG_TSH',
          lat: -25.7088,
          lng: 28.3912,
          distance_km: 0.61,
        },
      ],
      error: null,
    });

    const inFilter = jest.fn().mockResolvedValue({
      data: [
        {
          serial_number: 'BN-LEHLABILE',
          device_status: 1,
          active_connections: 0,
        },
      ],
      error: null,
    });
    const select = jest.fn().mockReturnValue({ in: inFilter });
    const from = jest.fn().mockReturnValue({ select });

    mockCreateClient.mockResolvedValue({ rpc, from } as any);

    const result = await checkBaseStationProximity({
      lat: -25.7134413,
      lng: 28.3962027,
    });

    expect(from).toHaveBeenCalledWith('tarana_base_stations');
    expect(result.nearestStation?.siteName).toBe('Lehlabile Secondary School');
    expect(result.nearestStation?.deviceStatus).toBe(1);
    expect(result.hasCoverage).toBe(true);
    expect(result.confidence).toBe('low');
    expect(result.installationNote).toContain('no active customer connections');
  });
});
