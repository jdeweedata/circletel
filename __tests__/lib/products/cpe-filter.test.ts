import { filterCpeDevices, isCpeDevice } from '@/lib/products/cpe-filter';

describe('isCpeDevice', () => {
  it('keeps MiFi and 5G CPE', () => {
    expect(isCpeDevice({ sku: 'E5576', name: 'Huawei E5576-321 MiFi' })).toBe(true);
    expect(isCpeDevice({ sku: 'X100', name: 'Tozed ZLT X100 Pro 5G CPE' })).toBe(true);
    expect(
      isCpeDevice({ sku: 'R1', name: 'Zyxel LTE7480', category: 'Networking', subcategory: 'LTE Router' })
    ).toBe(true);
  });

  it('drops PCs, memory and printers', () => {
    expect(isCpeDevice({ sku: 'SSD1', name: 'Samsung 2TB SSD' })).toBe(false);
    expect(isCpeDevice({ sku: 'T1', name: 'HP LaserJet toner' })).toBe(false);
    expect(isCpeDevice({ sku: 'RAM', name: 'Corsair 32GB DDR5' })).toBe(false);
  });

  it('limits the curated list', () => {
    const rows = Array.from({ length: 5 }, (_, i) => ({
      sku: `MIFI-${i}`,
      name: `Vida M2 MiFi ${i}`,
    }));
    expect(filterCpeDevices(rows, 3)).toHaveLength(3);
  });
});
