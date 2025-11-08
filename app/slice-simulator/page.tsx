'use client'

import { SliceSimulator } from '@slicemachine/adapter-next/simulator'
import { SliceZone } from '@prismicio/react'

import { components } from '@/slices'

/**
 * Slice Simulator for Prismic
 *
 * This page is used by the Slice Machine to preview slices during development.
 * It should only be accessible in development mode.
 *
 * @see https://prismic.io/docs/slice-simulator
 */
export default function SliceSimulatorPage() {
  return (
    <SliceSimulator
      sliceZone={(props) => <SliceZone {...props} components={components} />}
      state={{}}
    />
  )
}
