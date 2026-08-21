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

    expect(serialized).toContain('R649');
    expect(serialized).toContain('R549');
    expect(serialized).toContain('MTN shop R699');
    expect(serialized).toContain('MTN shop R599');
    expect(serialized).toContain('Huawei H155-386');
    expect(serialized).toContain('/5g-deals/circleconnect-5g-60-mbps');
    expect(serialized).toContain('/5g-deals/circleconnect-uncapped-20-mbps');
    expect(serialized).toContain('View deal');
    expect(serialized).toContain('Check coverage');
    expect(serialized).toContain('24-month + router');
    expect(serialized).toContain('Month-to-month SIM only');
    expect(serialized).toContain('CircleConnect 5G 35 Mbps');
    expect(serialized).toContain('CircleConnect 5G FWA 500 GB');
    expect(serialized).not.toContain('/products/circleconnect-5g-35-mbps');
  });
});
