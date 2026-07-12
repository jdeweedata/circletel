/**
 * Runtime tests for the admin Sidebar workspace switcher (PR #613).
 *
 * The Sidebar renders role-scoped, workspace-grouped nav via getWorkspaceNav()
 * and workspaceForPath() from the feature registry. These tests mount the REAL
 * component and drive its interactions (switch workspace, expand accordion) to
 * prove the wiring — not just re-test the registry selectors.
 *
 * Renderer: react-test-renderer. The repo's jest env is jest-environment-node
 * (no jsdom), so RTL is unavailable; react-test-renderer runs the component with
 * hooks + effects and lets us invoke handlers without a DOM.
 *
 * NOT covered here (no layout engine): visual position / clipping of the
 * collapsed-rail switcher dropdown — that needs a real browser.
 */
import { describe, it, expect, jest } from '@jest/globals';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import {
  getWorkspaceNav,
  hasChildren,
  type WorkspaceId,
} from '@/lib/admin/feature-registry';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// ---- environment shims (not the logic under test) ----
// `mock`-prefixed so it is hoisting-safe inside the jest.mock factory.
let mockPath = '/admin';
jest.mock('next/navigation', () => ({
  usePathname: () => mockPath,
  useRouter: () => ({ push() {} }),
}));
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...p }: any) => React.createElement('a', { href, ...p }, children),
}));
jest.mock('next/image', () => ({
  __esModule: true,
  default: (p: any) =>
    React.createElement('img', { alt: p.alt, src: typeof p.src === 'string' ? p.src : '' }),
}));
// Radix Tooltip pulls DOM APIs; the Sidebar's nav logic is what we test, so the
// tooltip is stubbed to pass its children through (TooltipContent renders them
// under a data-tooltip marker so the collapsed-rail label is still assertable).
jest.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: any) => children,
  Tooltip: ({ children }: any) => children,
  TooltipTrigger: ({ children }: any) => children,
  TooltipContent: ({ children }: any) =>
    React.createElement('span', { 'data-tooltip': true }, children),
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Sidebar } = require('@/components/admin/layout/Sidebar');

// ---- helpers ----
const text = (inst: any): string => {
  const out: string[] = [];
  const walk = (c: any) => {
    if (c == null || c === false) return;
    if (typeof c === 'string') { out.push(c); return; }
    if (Array.isArray(c)) { c.forEach(walk); return; }
    if (c.children) c.children.forEach(walk);
  };
  inst.children.forEach(walk);
  return out.join('').trim();
};

function mount(role: string, isOpen = true, path = '/admin') {
  mockPath = path;
  let r: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(
      React.createElement(Sidebar, { isOpen, onToggle() {}, user: { role, full_name: 'Test User' } })
    );
  });
  return r!.root;
}

const openSwitcher = (root: any) => {
  const toggle = root.findByProps({ 'aria-label': 'Switch workspace' });
  act(() => toggle.props.onClick());
  return root.findAll((n: any) => n.props && n.props.role === 'menuitem');
};

const switcherLabels = (root: any): string[] => openSwitcher(root).map(text);

const activeWorkspaceLabel = (root: any): string => {
  const toggle = root.findByProps({ 'aria-label': 'Switch workspace' });
  const span = toggle.findAll(
    (n: any) =>
      n.type === 'span' &&
      /flex-1/.test(n.props.className || '') &&
      /truncate/.test(n.props.className || '')
  )[0];
  return text(span);
};

const navTopLevelNames = (root: any): string[] => {
  const nav = root.findByType('nav');
  return nav
    .findAll((n: any) => n.type === 'span' && /flex-1/.test(n.props.className || ''))
    .map(text)
    .filter(Boolean);
};

// =====================================================================
describe('Sidebar workspace switcher', () => {
  it('lists all 7 workspaces incl. Administration for elevated roles', () => {
    for (const role of ['super_admin', 'product_manager'] as const) {
      const labels = switcherLabels(mount(role));
      expect(labels).toContain('Administration');
      expect(labels).toContain('Executive');
      expect(labels).toHaveLength(7);
    }
  });

  it('hides Administration from editor & viewer but keeps the feature workspaces', () => {
    for (const role of ['editor', 'viewer'] as const) {
      const labels = switcherLabels(mount(role));
      expect(labels).not.toContain('Administration');
      expect(labels).toContain('Executive');
      expect(labels.length).toBeGreaterThan(0);
    }
  });

  it('falls back to least privilege (viewer) for an unknown role', () => {
    const labels = switcherLabels(mount('totally-not-a-role'));
    expect(labels).not.toContain('Administration');
    expect(labels).toContain('Executive');
  });

  it('swaps the nav to only the selected workspace’s items', () => {
    const root = mount('super_admin', true, '/admin'); // starts on Executive
    const before = navTopLevelNames(root);
    const finance = openSwitcher(root).find((m: any) => text(m) === 'Finance');
    expect(finance).toBeTruthy();
    act(() => finance!.props.onClick());
    const after = navTopLevelNames(root);
    const expected = getWorkspaceNav({ role: 'super_admin' })
      .find((w) => w.id === 'finance')!
      .items.map((i) => i.name);
    expect(after.sort()).toEqual([...expected].sort());
    expect(after).not.toEqual(before);
  });

  it('opens the workspace matching the current route', () => {
    const cases: Array<[string, string, string]> = [
      ['/admin/quotes', 'super_admin', 'Sales & Marketing'],
      ['/admin/contracts', 'super_admin', 'Ops & Onboarding'],
      ['/admin/settings', 'super_admin', 'Administration'],
    ];
    for (const [path, role, label] of cases) {
      expect(activeWorkspaceLabel(mount(role, true, path))).toBe(label);
    }
  });

  it('falls back to the first accessible workspace for an unknown route (no crash)', () => {
    expect(activeWorkspaceLabel(mount('viewer', true, '/admin/totally-unknown'))).toBe('Executive');
  });

  it('renders item tooltips on the collapsed rail', () => {
    const root = mount('super_admin', false, '/admin');
    const tooltips = root
      .findAll((n: any) => n.props && n.props['data-tooltip'] === true)
      .map(text)
      .filter(Boolean);
    expect(tooltips.length).toBeGreaterThan(0);
  });

  it('expands/collapses an accordion item and highlights the active child', () => {
    // Discover a super_admin workspace + parent item with children.
    let found: { ws: WorkspaceId; itemName: string; childHref: string } | null = null;
    for (const w of getWorkspaceNav({ role: 'super_admin' })) {
      for (const it of w.items) {
        if (hasChildren(it)) {
          found = { ws: w.id, itemName: it.name, childHref: it.children[0].href };
          break;
        }
      }
      if (found) break;
    }
    expect(found).toBeTruthy();

    // (a) manual expand/collapse from a neutral route
    const root = mount('super_admin', true, '/admin');
    const wsLabel = getWorkspaceNav({ role: 'super_admin' }).find((w) => w.id === found!.ws)!.label;
    const wsBtn = openSwitcher(root).find((m: any) => text(m) === wsLabel);
    act(() => wsBtn!.props.onClick());

    const childCount = () =>
      root.findAll((n: any) => n.type === 'a' && n.props.href === found!.childHref).length;
    expect(childCount()).toBe(0);
    const parentBtn = root
      .findAll((n: any) => n.type === 'button' && /w-full/.test(n.props.className || ''))
      .find((b: any) => text(b).startsWith(found!.itemName));
    expect(parentBtn).toBeTruthy();
    act(() => parentBtn!.props.onClick());
    expect(childCount()).toBeGreaterThan(0);
    act(() => parentBtn!.props.onClick());
    expect(childCount()).toBe(0);

    // (b) auto-expand + active highlight when the route is a child href
    const root2 = mount('super_admin', true, found!.childHref.split('?')[0]);
    const activeAnchor = root2.findAll(
      (n: any) => n.type === 'a' && n.props.href === found!.childHref
    );
    expect(activeAnchor.length).toBeGreaterThan(0);
    expect(activeAnchor[0].props.className || '').toMatch(/bg-gray-100/);
  });
});
