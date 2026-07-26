/**
 * Render tests for UnavailableDataPanel.
 *
 * Renderer: react-test-renderer. The repo's jest env is jest-environment-node
 * (no jsdom), so RTL is unavailable.
 */
import { describe, it, expect } from '@jest/globals';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { UnavailableDataPanel } from '@/components/admin/network/performance/UnavailableDataPanel';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

type Renderer = ReturnType<typeof TestRenderer.create>;

/**
 * React 19 renders concurrently — TestRenderer.create() does not flush
 * synchronously, so toJSON() returns null unless create is wrapped in act().
 */
function render(element: React.ReactElement): Renderer {
  let tree!: Renderer;
  act(() => {
    tree = TestRenderer.create(element);
  });
  return tree;
}

function textOf(tree: Renderer): string {
  return JSON.stringify(tree.toJSON());
}

describe('UnavailableDataPanel', () => {
  it('renders nothing when there are no items', () => {
    const tree = render(<UnavailableDataPanel items={[]} />);
    expect(tree.toJSON()).toBeNull();
  });

  it('renders a row per item with its title and reason', () => {
    const tree = render(
      <UnavailableDataPanel
        items={[
          { key: 'apps', title: 'Top Applications', reason: 'No app-flow data.' },
          { key: 'radio', title: 'Channel / Radio Util', reason: 'No radio utilization.' },
        ]}
      />
    );
    const out = textOf(tree);
    expect(out).toContain('Top Applications');
    expect(out).toContain('No app-flow data.');
    expect(out).toContain('Channel / Radio Util');
    expect(out).toContain('No radio utilization.');
  });

  it('names the card so the reason for the missing panels is visible', () => {
    const tree = render(
      <UnavailableDataPanel items={[{ key: 'a', title: 'A', reason: 'r' }]} />
    );
    expect(textOf(tree)).toContain('Not available for this group');
  });
});
