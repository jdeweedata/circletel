import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { mkdtempSync, rmSync, writeFileSync, existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import {
  resolveLatestRectronFile,
  downloadRectronPricelist,
  RECTRON_CDN_BASE,
} from '../rectron-downloader'

const PAGE_URL = 'https://www.rectronzone.co.za/rectron/downloadzone'
const FILENAME = 'RECTRON_PRICE_LIST_20260626_0733.xlsm'
const FIXTURE_HTML = `<html><body><table>
  <tr><td>Price List</td><td>${FILENAME}</td><td>2026-06-26</td></tr>
</table></body></html>`

// Minimal valid xlsx: PK zip header + padding above the 10KB sanity floor
const ZIP_BYTES = Buffer.concat([
  Buffer.from([0x50, 0x4b, 0x03, 0x04]),
  Buffer.alloc(10_001),
])

function mockFetchRouting() {
  return jest.fn(async (input: any) => {
    const url = String(input)
    if (url === PAGE_URL) {
      return { ok: true, status: 200, text: async () => FIXTURE_HTML } as any
    }
    if (url.startsWith(RECTRON_CDN_BASE)) {
      return {
        ok: true,
        status: 200,
        arrayBuffer: async () => ZIP_BYTES.buffer.slice(
          ZIP_BYTES.byteOffset,
          ZIP_BYTES.byteOffset + ZIP_BYTES.byteLength
        ),
      } as any
    }
    throw new Error(`Unexpected fetch URL: ${url}`)
  })
}

describe('rectron-downloader', () => {
  let dir: string
  const realFetch = global.fetch

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'rectron-dl-'))
  })
  afterEach(() => {
    global.fetch = realFetch
    rmSync(dir, { recursive: true, force: true })
  })

  it('resolves the latest filename and CDN url from the public page', async () => {
    global.fetch = mockFetchRouting() as any
    const { filename, url } = await resolveLatestRectronFile()
    expect(filename).toBe(FILENAME)
    expect(url).toBe(RECTRON_CDN_BASE + FILENAME)
  })

  it('throws when the page has no matching filename', async () => {
    global.fetch = jest.fn(async () => ({
      ok: true, status: 200, text: async () => '<html>no file here</html>',
    })) as any
    await expect(resolveLatestRectronFile()).rejects.toThrow(/could not find.*filename/i)
  })

  it('downloads and validates the file when not already present', async () => {
    global.fetch = mockFetchRouting() as any
    const res = await downloadRectronPricelist({ watchDir: dir })
    expect(res.downloaded).toBe(true)
    expect(res.filename).toBe(FILENAME)
    expect(existsSync(res.filePath)).toBe(true)
    const head = readFileSync(res.filePath).subarray(0, 4)
    expect(Array.from(head)).toEqual([0x50, 0x4b, 0x03, 0x04])
  })

  it('skips download when the file already exists (idempotent)', async () => {
    writeFileSync(join(dir, FILENAME), ZIP_BYTES)
    const fetchMock = mockFetchRouting()
    global.fetch = fetchMock as any
    const res = await downloadRectronPricelist({ watchDir: dir })
    expect(res.downloaded).toBe(false)
    expect(res.filePath).toBe(join(dir, FILENAME))
    // Only the page was fetched (to learn the filename); the CDN was NOT hit
    const cdnCalls = fetchMock.mock.calls.filter(([u]) =>
      String(u).startsWith(RECTRON_CDN_BASE)
    )
    expect(cdnCalls.length).toBe(0)
  })

  it('throws on a CDN HTTP error', async () => {
    global.fetch = jest.fn(async (input: any) => {
      const url = String(input)
      if (url.startsWith(RECTRON_CDN_BASE)) {
        return { ok: false, status: 404 } as any
      }
      return { ok: true, status: 200, text: async () => FIXTURE_HTML } as any
    }) as any
    await expect(downloadRectronPricelist({ watchDir: dir })).rejects.toThrow(/HTTP 404/)
  })

  it('rejects an undersized download', async () => {
    global.fetch = jest.fn(async (input: any) => {
      const url = String(input)
      if (url.startsWith(RECTRON_CDN_BASE)) {
        const tiny = Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.alloc(9_000)])
        return {
          ok: true, status: 200,
          arrayBuffer: async () => tiny.buffer.slice(tiny.byteOffset, tiny.byteOffset + tiny.byteLength),
        } as any
      }
      return { ok: true, status: 200, text: async () => FIXTURE_HTML } as any
    }) as any
    await expect(downloadRectronPricelist({ watchDir: dir })).rejects.toThrow(/too small/)
  })

  it('rejects a download with bad magic bytes', async () => {
    global.fetch = jest.fn(async (input: any) => {
      const url = String(input)
      if (url.startsWith(RECTRON_CDN_BASE)) {
        const notZip = Buffer.concat([Buffer.from('<html>404</html>'), Buffer.alloc(11_000)])
        return {
          ok: true, status: 200,
          arrayBuffer: async () => notZip.buffer.slice(notZip.byteOffset, notZip.byteOffset + notZip.byteLength),
        } as any
      }
      return { ok: true, status: 200, text: async () => FIXTURE_HTML } as any
    }) as any
    await expect(downloadRectronPricelist({ watchDir: dir })).rejects.toThrow(/magic bytes/)
  })
})
