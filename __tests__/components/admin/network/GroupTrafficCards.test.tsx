/**
 * Render tests for GroupTrafficCards grid vs list layout.
 *
 * Renderer: react-test-renderer (jest env is node, no jsdom).
 */
import { describe, it, expect, jest } from '@jest/globals';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { GroupTrafficCards } from '@/components/admin/network/performance/GroupTrafficCards';

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

function buttons(tree: Renderer) {
  return tree.root.findAllByType('button');
}

/** Every className string in the rendered tree, joined. */
function classNames(tree: Renderer): string {
  return tree.root
    .findAll((n) => typeof n.props?.className === 'string', { deep: true })
    .map((n) => n.props.className as string)
    .join(' ');
}

const GROUPS = [
  {
    groupId: 'g1',
    groupName: 'Unjani',
    totalBytes: 21_367_610_000,
    totalRxBytes: 20_294_000_000,
    totalTxBytes: 1_073_610_000,
    sampleCount: 2,
  },
  {
    groupId: 'g2',
    groupName: 'Newgen Network',
    totalBytes: 1_018_000_000,
    totalRxBytes: 991_200_000,
    totalTxBytes: 26_800_000,
    sampleCount: 2,
  },
];

describe('GroupTrafficCards', () => {
  it('lays groups out as a multi-column grid by default', () => {
    const tree = render(<GroupTrafficCards groups={GROUPS} />);
    expect(buttons(tree)).toHaveLength(2);
    expect(JSON.stringify(tree.toJSON())).toContain('Unjani');
    expect(classNames(tree)).toContain('sm:grid-cols-2');
  });

  it('drops the multi-column grid in list layout so it fits a narrow column', () => {
    const tree = render(<GroupTrafficCards groups={GROUPS} layout="list" />);
    expect(buttons(tree)).toHaveLength(2);
    expect(JSON.stringify(tree.toJSON())).toContain('Newgen Network');
    expect(classNames(tree)).not.toContain('sm:grid-cols-2');
  });

  it('calls onSelectGroup with the group id in list layout', () => {
    const onSelectGroup = jest.fn();
    const tree = render(
      <GroupTrafficCards groups={GROUPS} layout="list" onSelectGroup={onSelectGroup} />
    );
    act(() => {
      buttons(tree)[1].props.onClick();
    });
    expect(onSelectGroup).toHaveBeenCalledWith('g2');
  });

  it('falls back to the empty state when there are no groups', () => {
    const tree = render(<GroupTrafficCards groups={[]} layout="list" />);
    expect(buttons(tree)).toHaveLength(0);
    expect(JSON.stringify(tree.toJSON())).toContain('Group Traffic');
  });
});
