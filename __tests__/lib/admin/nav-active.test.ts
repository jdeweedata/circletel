import { isActiveNavHref } from '@/lib/admin/nav-active';

describe('isActiveNavHref', () => {
  it('highlights only the matching Product Workspace section', () => {
    const workspace = '/admin/products';
    const portfolio = '/admin/products?section=portfolio';
    const suppliers = '/admin/products?section=suppliers';
    const promote = '/admin/products/hardware/promote';

    expect(isActiveNavHref('/admin/products', 'section=portfolio', workspace, { exactPath: true })).toBe(false);
    expect(isActiveNavHref('/admin/products', 'section=portfolio', portfolio, { exactPath: true })).toBe(true);
    expect(isActiveNavHref('/admin/products', 'section=portfolio', suppliers, { exactPath: true })).toBe(false);
    expect(isActiveNavHref('/admin/products', 'section=portfolio', promote, { exactPath: true })).toBe(false);
  });

  it('treats the bare /admin/products href as the default catalogue tab', () => {
    expect(isActiveNavHref('/admin/products', '', '/admin/products', { exactPath: true })).toBe(true);
    expect(isActiveNavHref('/admin/products', 'section=catalogue', '/admin/products', { exactPath: true })).toBe(true);
    expect(isActiveNavHref('/admin/products', 'section=suppliers', '/admin/products', { exactPath: true })).toBe(false);
  });

  it('does not treat /admin/products as active on Promote or Add Product', () => {
    expect(isActiveNavHref('/admin/products/hardware/promote', '', '/admin/products', { exactPath: true })).toBe(false);
    expect(isActiveNavHref('/admin/products/new', '', '/admin/products', { exactPath: true })).toBe(false);
    expect(isActiveNavHref('/admin/products/hardware/promote', '', '/admin/products/hardware/promote', { exactPath: true })).toBe(true);
  });

  it('keeps prefix matching for top-level items unless end is set', () => {
    expect(isActiveNavHref('/admin/orders/abc', '', '/admin/orders')).toBe(true);
    expect(isActiveNavHref('/admin/orders/abc', '', '/admin', { end: true })).toBe(false);
    expect(isActiveNavHref('/admin', '', '/admin', { end: true })).toBe(true);
  });
});
