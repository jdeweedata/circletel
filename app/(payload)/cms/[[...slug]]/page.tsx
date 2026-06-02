import type { Metadata } from 'next'
import { generatePageMetadata } from '@payloadcms/next/views'
import config from '@payload-config'
import Page from './page.client'

type Args = {
  params: Promise<{ segments: string[] }>
  searchParams: Promise<{ [key: string]: string | string[] }>
}

export const generateMetadata = ({ params, searchParams }: Args): Promise<Metadata> =>
  generatePageMetadata({ config, params, searchParams })

export default Page
