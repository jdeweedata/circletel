import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { FiveGProductPage } from '../FiveGProductPage';
import { fiveG60Product, uncapped20Product } from './five-g-fixtures';

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
      renderer = TestRenderer.create(
        <FiveGProductPage product={fiveG60Product} slug="circleconnect-5g-60-mbps" />
      );
    });

    const serialized = JSON.stringify(renderer!.toJSON());

    expect(serialized).toContain('CircleConnect 5G 60 Mbps');
    expect(serialized).toContain('R649');
    expect(serialized).toContain('R699');
    expect(serialized).toContain('MTN shop R699');
    expect(serialized).toContain('Check coverage');
    expect(serialized).toContain('Huawei H155-386');
    expect(serialized).toContain('/5g-deals');
    expect(serialized).toContain('/coverage');
    expect(serialized).toContain('24-month + router');
    expect(serialized).toContain('60');
    expect(serialized).toContain('wa.me');
  });

  it('renders the Uncapped 20 Mbps promo at R549', () => {
    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <FiveGProductPage product={uncapped20Product} slug="circleconnect-uncapped-20-mbps" />
      );
    });

    const serialized = JSON.stringify(renderer!.toJSON());

    expect(serialized).toContain('CircleConnect Uncapped 20 Mbps');
    expect(serialized).toContain('R549');
    expect(serialized).toContain('MTN shop R599');
    expect(serialized).toContain('Check coverage');
    expect(serialized).toContain('Huawei H155-386');
  });
});
