'use client'

import { RootPage } from '@payloadcms/next/views'
import { importMap } from '../importMap.js'
import config from '@payload-config'

type Args = {
  params: Promise<{ segments: string[] }>
  searchParams: Promise<{ [key: string]: string | string[] }>
}

export default function Page({ params, searchParams }: Args) {
  return RootPage({ config, params, searchParams, importMap } as any)
}
