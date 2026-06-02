import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { seoPlugin } from '@payloadcms/plugin-seo'
import path from 'path'
import { fileURLToPath } from 'url'

import { Users } from './payload/collections/Users'
import { Media } from './payload/collections/Media'
import { Pages } from './payload/collections/Pages'
import { BlogPosts } from './payload/collections/BlogPosts'
import { Products } from './payload/collections/Products'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000',
  secret: process.env.PAYLOAD_SECRET || 'dev-secret-change-in-production',
  
  admin: {
    user: 'users',
    meta: {
      titleSuffix: ' | CircleTel CMS',
    },
    routes: {
      admin: '/cms',
    },
  },

  collections: [
    Users,
    Media,
    Pages,
    BlogPosts,
    Products,
  ],

  editor: lexicalEditor(),

  db: postgresAdapter({
    pool: {
      connectionString: `${process.env.DATABASE_URL || ''}`,
      ssl: {
        rejectUnauthorized: false,
      },
    },
    schemaName: 'payload',
    // Push: true auto-creates tables on first load (dev/convenience)
    push: true,
  }),

  plugins: [
    seoPlugin({
      collections: ['pages', 'blog-posts', 'products'],
      uploadsCollection: 'media',
      generateTitle: ({ doc }: { doc: any }) => `${doc.title} | CircleTel`,
      generateDescription: ({ doc }: { doc: any }) => doc.excerpt || doc.tagline || '',
    }),
  ],

  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },

  // Rate limiting for admin API
  rateLimit: {
    max: 500,
    window: 60,
    trustProxy: true,
  },
})
