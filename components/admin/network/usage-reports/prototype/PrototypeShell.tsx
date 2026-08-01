'use client';

/** PROTOTYPE — throwaway. Mounts the #688 variants on the real route. */

import { PrototypeSwitcher, type ProtoVariantKey } from './PrototypeSwitcher';
import { VariantA } from './VariantA';
import { VariantB } from './VariantB';
import { VariantC } from './VariantC';

export function PrototypeShell({ variant }: { variant: ProtoVariantKey }) {
  return (
    <>
      {variant === 'A' && <VariantA />}
      {variant === 'B' && <VariantB />}
      {variant === 'C' && <VariantC />}
      <PrototypeSwitcher current={variant} />
    </>
  );
}
