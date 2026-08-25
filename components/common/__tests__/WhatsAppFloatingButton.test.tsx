import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { WhatsAppFloatingButton } from '../WhatsAppFloatingButton';

jest.mock('next/navigation', () => ({
  usePathname: () => '/5g-deals',
}));

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

beforeAll(() => {
  Object.defineProperty(globalThis, 'IntersectionObserver', {
    configurable: true,
    writable: true,
    value: class {
      observe() {}
      disconnect() {}
    },
  });
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: {
      getElementById: () => ({ id: 'coverage-checker' }),
    },
  });
});

describe('WhatsAppFloatingButton', () => {
  it('sits above the sticky mobile coverage bar on compact viewports', () => {
    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(<WhatsAppFloatingButton />);
    });

    const serialized = JSON.stringify(renderer!.toJSON());

    expect(serialized).toContain('max-lg:bottom-24');
    expect(serialized).toContain('bottom-6');
    expect(serialized).toContain('Chat with CircleTel on WhatsApp');
  });
});
