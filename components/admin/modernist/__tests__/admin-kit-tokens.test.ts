import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { portalModernist } from '@/components/portal/modernist/tokens';

const ROOT = resolve(__dirname, '../../../..');

function read(rel: string): string {
  return readFileSync(resolve(ROOT, rel), 'utf8');
}

describe('portalModernist tokens', () => {
  it('exposes muted and the existing hover/active/danger hexes', () => {
    expect(portalModernist.muted).toBe('#6B7280');
    expect(portalModernist.accentPressed).toBe('#E97B26');
    expect(portalModernist.accentDeep).toBe('#D76026');
    expect(portalModernist.danger).toBe('#DC2626');
  });
});

describe('PORTAL_MODERNIST_STYLE', () => {
  it('mounts the four admin-kit vars from portalModernist', () => {
    const src = read('components/portal/modernist/PortalModernistShell.tsx');
    expect(src).toMatch(/--pm-accent-hover/);
    expect(src).toMatch(/--pm-accent-active/);
    expect(src).toMatch(/--pm-muted/);
    expect(src).toMatch(/--pm-danger/);
    expect(src).toMatch(/from ['"]\.\/tokens['"]/);
    expect(src).toMatch(/portalModernist\.accentPressed/);
    expect(src).toMatch(/portalModernist\.accentDeep/);
    expect(src).toMatch(/portalModernist\.muted/);
    expect(src).toMatch(/portalModernist\.danger/);
  });
});
