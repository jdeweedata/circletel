import { describe, it, expect, jest } from '@jest/globals';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { CompactPackageCard } from '@/components/ui/compact-package-card';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => children,
  Tooltip: ({ children }: { children: React.ReactNode }) => children,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => children,
  TooltipContent: ({ children }: { children: React.ReactNode }) =>
    React.createElement('span', { 'data-tooltip': true }, children),
}));

function collectText(node: TestRenderer.ReactTestInstance): string {
  const out: string[] = [];
  const walk = (child: unknown) => {
    if (child == null || child === false) return;
    if (typeof child === 'string' || typeof child === 'number') {
      out.push(String(child));
      return;
    }
    if (Array.isArray(child)) {
      child.forEach(walk);
      return;
    }
    const inst = child as TestRenderer.ReactTestInstance;
    if (inst.children) inst.children.forEach(walk);
  };
  walk(node);
  return out.join('');
}

describe('CompactPackageCard', () => {
  it('renders package name and term label', () => {
    let tree: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        <CompactPackageCard
          promoPrice={489}
          name="CircleConnect 5G 35 Mbps"
          termLabel="24-month + router"
          downloadSpeed={35}
          uploadSpeed={10}
        />
      );
    });
    const text = collectText(tree!.root);
    expect(text).toContain('CircleConnect 5G 35 Mbps');
    expect(text).toContain('24-month + router');
    expect(text).toContain('35Mbps');
  });

  it('shows data cap instead of 0Mbps when both speeds are zero', () => {
    let tree: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        <CompactPackageCard
          promoPrice={649}
          name="CircleConnect 5G FWA 500 GB"
          type="capped"
          dataTooltip="500GB hard cap monthly data allowance"
          downloadSpeed={0}
          uploadSpeed={0}
        />
      );
    });
    const text = collectText(tree!.root);
    expect(text).toContain('500 GB');
    expect(text).not.toMatch(/\b0Mbps\b/);
  });
});
