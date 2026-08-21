import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { FiveGProductPage } from '../FiveGProductPage';
import {
  bestEffortSimProduct,
  fiveG60Product,
  fwa500Product,
  uncapped20Product,
} from './five-g-fixtures';

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

describe('FiveGProductPage', () => {
  it('renders the 5G 60 promo with live price, Huawei alt, and Check coverage', () => {
    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(<FiveGProductPage product={fiveG60Product} />);
    });

    const serialized = JSON.stringify(renderer!.toJSON());

    expect(serialized).toContain('CircleConnect 5G 60 Mbps');
    expect(serialized).toContain('R649');
    expect(serialized).toContain('R699');
    expect(serialized).not.toContain('MTN shop');
    expect(serialized).not.toContain('OP19627');
    expect(serialized).toContain('Check coverage');
    expect(serialized).toContain('Huawei H155-386');
    expect(serialized).toContain('/5g-deals');
    expect(serialized).toContain('/coverage');
    expect(serialized).toContain('24-month');
    expect(serialized).toContain('Router included');
    expect(serialized).toContain('60');
    expect(serialized).toContain('wa.me');
  });

  it('renders the Uncapped 20 Mbps promo at R549', () => {
    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(<FiveGProductPage product={uncapped20Product} />);
    });

    const serialized = JSON.stringify(renderer!.toJSON());

    expect(serialized).toContain('CircleConnect Uncapped 20 Mbps');
    expect(serialized).toContain('R549');
    expect(serialized).not.toContain('MTN shop');
    expect(serialized).toContain('Check coverage');
    expect(serialized).toContain('Huawei H155-386');
  });

  it('renders the FWA 500 GB SIM-only package', () => {
    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(<FiveGProductPage product={fwa500Product} />);
    });

    const serialized = JSON.stringify(renderer!.toJSON());

    expect(serialized).toContain('CircleConnect 5G FWA 500 GB');
    expect(serialized).toContain('R649');
    expect(serialized).toContain('500GB hard cap');
    expect(serialized).toContain('SIM only');
    expect(serialized).toContain('No router or equipment included');
    expect(serialized).toContain('/images/hardware/sim/circletel-nano-sim.png');
    expect(serialized).toContain('Check coverage');
    expect(serialized).not.toContain('Add router');
    expect(serialized).not.toContain('OP19627');
  });

  it('renders Best Effort SIM only with the 24-month router sibling', () => {
    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(<FiveGProductPage product={bestEffortSimProduct} />);
    });

    const serialized = JSON.stringify(renderer!.toJSON());

    expect(serialized).toContain('CircleConnect 5G Best Effort SIM Only');
    expect(serialized).toContain('R1,079');
    expect(serialized).toContain('1.5TB');
    expect(serialized).toContain('100–300 Mbps');
    expect(serialized).toContain('Add router');
    expect(serialized).toContain('/5g-deals/circleconnect-5g-best-effort');
    expect(serialized).toContain('SIM only');
    expect(serialized).not.toContain('PROMO');
    expect(serialized).not.toContain('MTN shop');
  });
});
