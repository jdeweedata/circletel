import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { HomeLanding20260607 } from '../HomeLanding20260607';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function textOf(node: TestRenderer.ReactTestInstance | string | number): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);

  return node.children.map((child) => textOf(child as TestRenderer.ReactTestInstance | string | number)).join('');
}

jest.mock('@/components/home/PlanCards', () => ({
  PlanCards: ({ activeSegment }: { activeSegment: string }) => (
    <div data-testid="plan-cards">plans:{activeSegment}</div>
  ),
}));

jest.mock('@/components/home/HowItWorks', () => ({
  HowItWorks: () => <div data-testid="how-it-works">how it works</div>,
}));

jest.mock('@/components/home/Testimonials', () => ({
  Testimonials: ({ activeSegment }: { activeSegment: string }) => (
    <div data-testid="testimonials">testimonials:{activeSegment}</div>
  ),
}));

jest.mock('@/components/home/FAQ', () => ({
  FAQ: () => <div data-testid="faq">faq</div>,
}));

jest.mock('@/components/coverage/AddressAutocomplete', () => ({
  AddressAutocomplete: ({ placeholder }: { placeholder: string }) => (
    <input aria-label="Coverage address" placeholder={placeholder} />
  ),
}));

jest.mock('@/components/coverage/InteractiveCoverageMapModal', () => ({
  InteractiveCoverageMapModal: () => <div data-testid="coverage-map-modal" />,
}));

describe('HomeLanding20260607', () => {
  it('renders the redesigned home shell and preserves active segment props', () => {
    const onSegmentChange = jest.fn();

    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <HomeLanding20260607
          activeSegment="business"
          onSegmentChange={onSegmentChange}
        />
      );
    });

    const tree = renderer!.toJSON();
    const serialized = JSON.stringify(tree);

    expect(serialized).toContain('Internet that works as hard as you do');
    expect(serialized).toContain('Built around how you actually connect');

    const planCards = renderer!.root.findByProps({ 'data-testid': 'plan-cards' });
    const testimonials = renderer!.root.findByProps({ 'data-testid': 'testimonials' });

    expect(planCards.props.children).toEqual(['plans:', 'business']);
    expect(testimonials.props.children).toEqual(['testimonials:', 'business']);

    const workFromHomeButton = renderer!.root.findAllByType('button').find((button) => (
      textOf(button).includes('Work from home')
    ));

    expect(workFromHomeButton).toBeDefined();
    act(() => {
      workFromHomeButton!.props.onClick();
    });

    expect(onSegmentChange).toHaveBeenCalledWith('wfh');
  });
});
