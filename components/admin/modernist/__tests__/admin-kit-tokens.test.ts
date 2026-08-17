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

const ALLOWED_HEX = new Set(['#fff', '#FFF', '#ffffff', '#FFFFFF']);

function cssSelectors(css: string): string[] {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const withoutAt = withoutComments.replace(/@[^{]+\{/g, '');
  return withoutAt
    .split('}')
    .map((chunk) => chunk.split('{')[0].trim())
    .filter((selector) => selector.length > 0 && !selector.startsWith('@'));
}

/** Split a selector list without breaking `:is(button, a)`. */
function splitSelectorList(selector: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (const ch of selector) {
    if (ch === '(') depth += 1;
    else if (ch === ')') depth = Math.max(0, depth - 1);
    if (ch === ',' && depth === 0) {
      parts.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.length > 0) parts.push(current);
  return parts;
}

describe('admin-kit.css', () => {
  const css = read('components/admin/modernist/admin-kit.css');

  it('scopes every selector under .portal-root', () => {
    for (const selector of cssSelectors(css)) {
      for (const part of splitSelectorList(selector)) {
        expect(part).toMatch(/\.portal-root/);
      }
    }
  });

  it('does not invent hex or circleTel values', () => {
    const hexes = css.match(/#[0-9a-fA-F]{3,8}/g) ?? [];
    for (const hex of hexes) {
      expect(ALLOWED_HEX.has(hex)).toBe(true);
    }
    // Scan declaration blocks only — `:is(..., .bg-circleTel-orange)` is a
    // selector target, not an invented value.
    const blocks = css.match(/\{[^{}]*\}/g) ?? [];
    const decls = blocks.flatMap((block) => block.match(/:[^;{}]+/g) ?? []);
    for (const decl of decls) {
      expect(decl).not.toMatch(/circleTel/);
    }
  });

  it('covers the spec hooks and shadcn class targets', () => {
    const required = [
      "[data-pm='page-eyebrow']",
      "[data-pm='info-row']",
      "[data-pm='info-label']",
      "[data-pm='info-value']",
      "[data-pm='stat-subtitle']",
      "[data-pm='metric-subtitle']",
      "[data-pm='breadcrumb-current']",
      "[data-pm='breadcrumb-link']",
      "[data-pm='console-tabs']",
      "[data-pm='underline-tabs']",
      "[data-pm='loading-state']",
      "[data-pm='empty-state']",
      "[data-pm='error-state']",
      "[role='combobox']",
      '.bg-primary',
      '.bg-circleTel-orange',
      '.bg-gradient-cta',
      '.border-input',
      '.bg-secondary',
      '.underline-offset-4',
      '.border-circleTel-orange',
      "input:not([type='checkbox'])",
    ];
    for (const needle of required) {
      expect(css).toContain(needle);
    }
  });
});
