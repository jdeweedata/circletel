import {
  featureSections,
  bottomSections,
  ITEM_WORKSPACE,
  WORKSPACES,
  hasChildren,
} from '@/lib/admin/feature-registry';
import { WORKSPACE_ROLES, workspaceForPathname } from '@/lib/admin/workspace-access';

/**
 * Locks the edge-safe workspace-access module to the icon-laden feature-registry
 * (which middleware can't import). If either drifts, these fail in CI.
 */
describe('workspace-access parity with feature-registry', () => {
  it('WORKSPACE_ROLES matches WORKSPACES[].roles for every workspace', () => {
    for (const w of WORKSPACES) {
      const a = [...WORKSPACE_ROLES[w.id]].sort();
      const b = [...w.roles].sort();
      expect(a).toEqual(b);
    }
  });

  it('every nav href resolves to the workspace the registry assigns its item', () => {
    const items = [...featureSections, ...bottomSections].flatMap((s) => s.items);
    for (const item of items) {
      const expected = ITEM_WORKSPACE[item.name];
      const hrefs = hasChildren(item) ? item.children.map((c) => c.href) : [item.href];
      for (const href of hrefs) {
        expect({ href, ws: workspaceForPathname(href) }).toEqual({ href, ws: expected });
      }
    }
  });
});
