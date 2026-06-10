import React from 'react';

import {
  getNavbarPresentation,
} from '@/components/layout/Navbar';
import { Logo } from '@/components/navigation/Logo';
import { SEARCH_INDEX } from '@/components/navigation/SearchModal';

describe('navigation header', () => {
  it('keeps the navbar logo compact enough for the 2026 header', () => {
    const logo = Logo({});
    expect(React.isValidElement(logo)).toBe(true);

    const image = logo.props.children as React.ReactElement<{ className: string; src: string }>;

    expect(image.props.src).toBe('/images/circletel-logo-white.png');
    expect(image.props.className).toContain('h-14');
    expect(image.props.className).toContain('lg:h-20');
    expect(image.props.className).not.toContain('lg:h-32');
  });

  it('keeps the enclosed logo for the footer lockup', () => {
    const logo = Logo({ variant: 'footer' });
    expect(React.isValidElement(logo)).toBe(true);

    const image = logo.props.children as React.ReactElement<{ src: string }>;

    expect(image.props.src).toBe('/images/circletel-enclosed-logo.png');
  });

  it('uses live partner routes in the search index', () => {
    expect(SEARCH_INDEX).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Partner Portal',
          href: '/partner/login',
        }),
        expect.objectContaining({
          title: 'Become a Partner',
          href: '/become-a-partner',
        }),
      ])
    );

    expect(SEARCH_INDEX).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ href: '/partners' }),
        expect.objectContaining({ href: '/partners/register' }),
      ])
    );
  });

  it('collapses the header chrome into a compact nav after scroll', () => {
    expect(getNavbarPresentation(false, false)).toEqual(
      expect.objectContaining({
        isCompact: false,
        helpBarClassName: expect.stringContaining('opacity-100'),
        navShellClassName: expect.stringContaining('py-2'),
        logoClassName: '',
      })
    );

    expect(getNavbarPresentation(true, false)).toEqual(
      expect.objectContaining({
        isCompact: true,
        helpBarClassName: expect.stringContaining('max-h-0'),
        navShellClassName: expect.stringContaining('py-1.5'),
        logoClassName: expect.stringContaining('max-h-14'),
      })
    );
  });

  it('keeps the full header chrome available while the mobile menu is open', () => {
    expect(getNavbarPresentation(true, true)).toEqual(
      expect.objectContaining({
        isCompact: false,
        helpBarClassName: expect.stringContaining('opacity-100'),
        navShellClassName: expect.stringContaining('py-2'),
        logoClassName: '',
      })
    );
  });
});
