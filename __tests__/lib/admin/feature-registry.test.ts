import {
  featureSections,
  bottomSections,
  getVisibleSections,
  hasChildren,
  type NavSection,
} from '@/lib/admin/feature-registry';

describe('feature registry data', () => {
  it('contains the known top-level entries', () => {
    const names = featureSections.flatMap((s) => s.items.map((i) => i.name));
    expect(names).toContain('Dashboard');
    expect(names).toContain('Products');
    expect(names).toContain('Quotes');
  });

  it('every item has a name and an icon; every leaf has an /admin href', () => {
    for (const section of [...featureSections, ...bottomSections]) {
      for (const item of section.items) {
        expect(item.name).toBeTruthy();
        expect(item.icon).toBeDefined();
        const leaves = hasChildren(item) ? item.children : [item];
        for (const leaf of leaves) {
          if ('href' in leaf && leaf.href) {
            expect(leaf.href.startsWith('/admin')).toBe(true);
          }
        }
      }
    }
  });
});

describe('getVisibleSections', () => {
  const sections: NavSection[] = [
    {
      label: 'Test',
      items: [
        { name: 'Visible', href: '/admin/a', icon: (() => null) as never },
        { name: 'Hidden', href: '/admin/b', icon: (() => null) as never, maturity: 'hidden' },
        { name: 'Internal', href: '/admin/c', icon: (() => null) as never, maturity: 'internal' },
        { name: 'AdminOnly', href: '/admin/d', icon: (() => null) as never, adminOnly: true },
      ],
    },
  ];

  it('filters hidden and internal items for everyone', () => {
    const out = getVisibleSections(sections, { isAdmin: true });
    const names = out.flatMap((s) => s.items.map((i) => i.name));
    expect(names).not.toContain('Hidden');
    expect(names).not.toContain('Internal');
  });

  it('filters adminOnly items for non-admins and keeps them for admins', () => {
    const admin = getVisibleSections(sections, { isAdmin: true }).flatMap((s) => s.items.map((i) => i.name));
    const nonAdmin = getVisibleSections(sections, { isAdmin: false }).flatMap((s) => s.items.map((i) => i.name));
    expect(admin).toContain('AdminOnly');
    expect(nonAdmin).not.toContain('AdminOnly');
  });

  it('drops sections whose items are all filtered out', () => {
    const onlyHidden: NavSection[] = [
      { label: 'Ghost', items: [{ name: 'H', href: '/admin/h', icon: (() => null) as never, maturity: 'hidden' }] },
    ];
    expect(getVisibleSections(onlyHidden, { isAdmin: true })).toEqual([]);
  });
});

import {
  ITEM_MODULE,
  ITEM_WORKSPACE,
  WORKSPACES,
  getWorkspaceNav,
  workspaceForPath,
} from '@/lib/admin/feature-registry';

describe('module + workspace axes', () => {
  const allItems = [...featureSections, ...bottomSections].flatMap((s) => s.items);

  it('every top-level item has a workspace and a module tag', () => {
    for (const item of allItems) {
      expect(ITEM_WORKSPACE[item.name]).toBeDefined();
      expect(ITEM_MODULE[item.name]).toBeDefined();
    }
  });

  it('tag maps reference only real item names (no typos / stale keys)', () => {
    const names = new Set(allItems.map((i) => i.name));
    for (const k of Object.keys(ITEM_WORKSPACE)) expect(names.has(k)).toBe(true);
    for (const k of Object.keys(ITEM_MODULE)) expect(names.has(k)).toBe(true);
  });

  it('WORKSPACES ids cover every workspace referenced by items', () => {
    const wsIds = new Set(WORKSPACES.map((w) => w.id));
    for (const ws of Object.values(ITEM_WORKSPACE)) expect(wsIds.has(ws)).toBe(true);
  });

  it('super_admin sees all workspaces incl. Administration', () => {
    const ws = getWorkspaceNav({ role: 'super_admin' }).map((w) => w.id);
    expect(ws).toContain('admin');
    expect(ws).toContain('finance');
  });

  it('editor and viewer never see the Administration workspace', () => {
    for (const role of ['editor', 'viewer'] as const) {
      expect(getWorkspaceNav({ role }).map((w) => w.id)).not.toContain('admin');
    }
  });

  it('module entitlement hides a disabled module’s items', () => {
    const withoutBilling = getWorkspaceNav({ role: 'super_admin', modules: ['core'] });
    const finance = withoutBilling.find((w) => w.id === 'finance');
    expect(finance).toBeUndefined(); // Billing & Revenue + Payments are module "billing"
  });

  it('workspaceForPath resolves known routes', () => {
    expect(workspaceForPath('/admin/quotes')).toBe('sales');
    expect(workspaceForPath('/admin/billing/invoices')).toBe('finance');
    expect(workspaceForPath('/admin/settings')).toBe('admin');
    expect(workspaceForPath('/admin/nonexistent')).toBeNull();
  });
});

describe('B1a role -> workspace mapping', () => {
  it('viewer sees only read-oriented workspaces (executive, support)', () => {
    const ws = getWorkspaceNav({ role: 'viewer' }).map((w) => w.id);
    expect(ws.every((id) => id === 'executive' || id === 'support')).toBe(true);
    expect(ws).toContain('support');
  });
  it('editor sees operational workspaces but not Administration', () => {
    const ws = getWorkspaceNav({ role: 'editor' }).map((w) => w.id);
    expect(ws).toEqual(expect.arrayContaining(['finance', 'sales', 'ops', 'platform']));
    expect(ws).not.toContain('admin');
  });
  it('elevated roles see Administration', () => {
    for (const role of ['super_admin', 'product_manager'] as const) {
      expect(getWorkspaceNav({ role }).map((w) => w.id)).toContain('admin');
    }
  });
});
