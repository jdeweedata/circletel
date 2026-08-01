'use client';

/** PROTOTYPE — throwaway. Mounts the #692 chart variants on the real route. */

import {
  ChartVariantGallery,
  CHART_VARIANT_KEYS,
  chartVariantName,
  type ChartVariantKey,
} from './ChartVariants';
import { PrototypeSwitcher } from './PrototypeSwitcher';

const CHART_SWITCHER = CHART_VARIANT_KEYS.map((key) => ({
  key,
  name: chartVariantName(key),
}));

export function ChartPrototypeShell({ variant }: { variant: ChartVariantKey }) {
  return (
    <>
      <ChartVariantGallery variant={variant} />
      <PrototypeSwitcher current={variant} variants={CHART_SWITCHER} param="chart" />
    </>
  );
}
