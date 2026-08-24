import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('provisioning adapter import isolation', () => {
  it('does not import lib/radius from the Interstellio adapter', () => {
    const source = readFileSync(
      join(process.cwd(), 'lib/provisioning/interstellio.ts'),
      'utf8'
    )

    expect(source).not.toMatch(/(?:@\/lib\/radius|\.\.\/radius)/)
  })

  it('does not import lib/interstellio from the radius adapter', () => {
    const source = readFileSync(
      join(process.cwd(), 'lib/provisioning/radius.ts'),
      'utf8'
    )

    expect(source).not.toMatch(/(?:@\/lib\/interstellio|\.\.\/interstellio)/)
  })
})
