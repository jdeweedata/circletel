import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { FiveGDealsListing } from '../FiveGDealsListing';
import { fiveGListingPackages } from './five-g-fixtures';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('FiveGDealsListing', () => {
  it('renders promo prices, Huawei CPE, and grouped remaining deals', () => {
    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(<FiveGDealsListing packages={fiveGListingPackages} />);
    });

    const serialized = JSON.stringify(renderer!.toJSON());

    expect(serialized).toContain('5G home internet, minus the runaround.');
    expect(serialized).toContain('Promo to 30 Sep. Router included on 24-month deals.');
    expect(serialized).toContain('Ts&Cs apply');
    expect(serialized).not.toContain('OP19627');
    expect(serialized).not.toContain('MTN shop');
    expect(serialized).not.toContain('less than MTN');
    expect(serialized).toContain('R649');
    expect(serialized).toContain('R549');
    expect(serialized).toContain('5G 60 + Huawei CPE');
    expect(serialized).toContain('Uncapped 20 Mbps + Huawei CPE');
    expect(serialized).toContain('Get this deal');
    expect(serialized).toContain('View deal');
    expect(serialized).toContain('Check coverage');
    expect(serialized).toContain('huawei-h155-386-desk.png');
    expect(serialized).toContain('/images/hardware/sim/circletel-nano-sim.png');
    expect(serialized).toContain('CircleTel 5G nano SIM');
    expect(serialized).toContain('/5g-deals/circleconnect-5g-60-mbps');
    expect(serialized).toContain('/5g-deals/circleconnect-uncapped-20-mbps');
    expect(serialized).toContain('/5g-deals/circleconnect-5g-35-mbps');
    expect(serialized).toContain('/5g-deals/circleconnect-5g-fwa-500-gb');
    expect(serialized).toContain('/5g-deals/circleconnect-5g-best-effort-sim-only');
    expect(serialized).toContain('24-month + router');
    expect(serialized).toContain('Month-to-month SIM only');
    expect(serialized).toContain('Router included');
    expect(serialized).toContain('BYO router');
    expect(serialized).toContain('35 Mbps');
    expect(serialized).toContain('FWA 500GB');
    expect(serialized).not.toContain('/products/circleconnect-5g-35-mbps');
  });
});
