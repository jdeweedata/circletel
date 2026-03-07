// scripts/prismic-inventory.mjs
// Run with: node scripts/prismic-inventory.mjs

import * as prismic from '@prismicio/client'
import fs from 'fs/promises'

const repositoryName = process.env.PRISMIC_REPOSITORY_NAME || 'circletel'

console.log(`\nConnecting to Prismic repository: ${repositoryName}\n`)

const client = prismic.createClient(repositoryName)

try {
  const allDocs = await client.dangerouslyGetAll()

  // Group by type
  const byType = allDocs.reduce((acc, doc) => {
    acc[doc.type] = (acc[doc.type] || 0) + 1
    return acc
  }, {})

  console.log('Document types in Prismic:')
  console.table(byType)
  console.log(`\nTotal documents: ${allDocs.length}`)

  // Save export
  await fs.writeFile('prismic-export.json', JSON.stringify(allDocs, null, 2))
  console.log('\nExported to: prismic-export.json')

  // Also show document UIDs for each type
  console.log('\n--- Documents by Type ---')
  const grouped = allDocs.reduce((acc, doc) => {
    if (!acc[doc.type]) acc[doc.type] = []
    acc[doc.type].push({
      uid: doc.uid || doc.id,
      title: doc.data?.title?.[0]?.text || doc.data?.meta_title || doc.data?.name || '(no title)',
      lastPublished: doc.last_publication_date,
    })
    return acc
  }, {})

  for (const [type, docs] of Object.entries(grouped)) {
    console.log(`\n${type} (${docs.length}):`)
    docs.forEach(d => console.log(`  - ${d.uid}: ${d.title}`))
  }

} catch (error) {
  console.error('Error fetching from Prismic:', error.message)

  if (error.message.includes('repository')) {
    console.log('\nTip: Make sure PRISMIC_REPOSITORY_NAME is set correctly')
    console.log('Or check if the repository exists at: https://circletel.prismic.io')
  }
}
