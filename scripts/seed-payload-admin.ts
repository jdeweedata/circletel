/**
 * Seed the first Payload admin user.
 * Run while the Next.js dev server is active on port 3015.
 */
import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

async function main() {
  // Payload Local API requires the config
  const { getPayload } = await import('payload')
  const payloadConfig = (await import('@payload-config')).default

  const payload = await getPayload({ config: payloadConfig })

  // Check if any users exist
  const { totalDocs } = await payload.find({ collection: 'users', limit: 1 })
  if (totalDocs > 0) {
    console.log(`Users already exist (${totalDocs} found). Skipping seed.`)
    process.exit(0)
  }

  // Create first admin user
  const user = await payload.create({
    collection: 'users',
    data: {
      email: 'jeffrey.de.wee@circletel.co.za',
      password: 'changeme123!',
      role: 'admin',
      name: 'Jeffrey de Wee',
    },
  })

  console.log(`Admin user created: ${user.email} (ID: ${user.id})`)
  console.log('Login at http://localhost:3015/cms')
}

main().catch((e) => {
  console.error('Failed to seed user:', e.message)
  process.exit(1)
})
