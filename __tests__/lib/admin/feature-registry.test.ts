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
