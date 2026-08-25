import { summarizeTopClients, type ClientHourRow } from '@/lib/ruijie/sta-client-rollups';

describe('summarizeTopClients', () => {
  const rows: ClientHourRow[] = [
    {
      device_sn: 'AP1',
      mac: 'aa:bb:cc:dd:ee:01',
      ssid: 'Unjani Clinic Staff',
      hour_bucket: '2026-08-11T10:00:00.000Z',
      rx_bytes: 1000,
      tx_bytes: 100,
      hostname: null,
      manufacture: 'Apple',
      band: '5G',
    },
    {
      device_sn: 'AP1',
      mac: 'aa:bb:cc:dd:ee:01',
      ssid: 'Unjani Clinic Staff',
      hour_bucket: '2026-08-11T11:00:00.000Z',
      rx_bytes: 500,
      tx_bytes: 50,
      hostname: 'nurse-tablet',
      manufacture: 'Apple',
      band: '5G',
    },
    {
      device_sn: 'AP1',
      mac: 'aa:bb:cc:dd:ee:02',
      ssid: 'Unjani Clinic Free WiFi',
      hour_bucket: '2026-08-11T10:00:00.000Z',
      rx_bytes: 9000,
      tx_bytes: 200,
      hostname: 'guest-phone',
      manufacture: 'Samsung',
      band: '2.4G',
    },
  ];

  it('aggregates by AP+MAC+SSID and ranks by total bytes', () => {
    const top = summarizeTopClients(rows, 10);
    expect(top).toHaveLength(2);
    expect(top[0]).toMatchObject({
      mac: 'aa:bb:cc:dd:ee:02',
      ssid: 'Unjani Clinic Free WiFi',
      total_bytes: 9200,
      hostname: 'guest-phone',
    });
    expect(top[1]).toMatchObject({
      mac: 'aa:bb:cc:dd:ee:01',
      ssid: 'Unjani Clinic Staff',
      rx_bytes: 1500,
      tx_bytes: 150,
      total_bytes: 1650,
      hostname: 'nurse-tablet',
      manufacture: 'Apple',
    });
  });

  it('respects limit', () => {
    expect(summarizeTopClients(rows, 1)).toHaveLength(1);
    expect(summarizeTopClients(rows, 0)).toHaveLength(0);
  });
});
