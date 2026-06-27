/**
 * Rectron Price-List Downloader
 *
 * The RectronZone download page is public (no login) and lists the current
 * datestamped price-list filename. The file itself is served publicly by the
 * storefront7 CDN. This module resolves the current filename from the page and
 * downloads it into the watch directory for the existing Rectron sync to parse.
 *
 * No authentication or credentials are required.
 */

import { existsSync, mkdirSync } from 'fs'
import { writeFile, rename, unlink } from 'fs/promises'
import { join } from 'path'

export const RECTRON_DOWNLOAD_PAGE_URL =
  'https://www.rectronzone.co.za/rectron/downloadzone'
export const RECTRON_CDN_BASE =
  'https://content.storefront7.co.za/stores/za.co.storefront7.rectron/pricelists/'
export const RECTRON_FILENAME_RE = /RECTRON_PRICE_LIST_\d{8}_\d{4}\.xlsm/
/** Sanity floor — the real file is hundreds of KB; anything tiny is an error page. */
const MIN_BYTES = 10_000
/** xlsx is a zip; first four bytes must be the local-file-header magic "PK\x03\x04". */
const ZIP_MAGIC = [0x50, 0x4b, 0x03, 0x04]

export interface RectronDownloadResult {
  filePath: string
  filename: string
  downloaded: boolean
}

/**
 * Fetch the public download page and extract the current price-list filename,
 * returning it together with its full CDN URL.
 */
export async function resolveLatestRectronFile(
  config: { pageUrl?: string; cdnBase?: string } = {}
): Promise<{ filename: string; url: string }> {
  const pageUrl = config.pageUrl || RECTRON_DOWNLOAD_PAGE_URL
  const cdnBase = config.cdnBase || RECTRON_CDN_BASE

  const res = await fetch(pageUrl)
  if (!res.ok) {
    throw new Error(
      `Rectron download page returned HTTP ${res.status} (${pageUrl})`
    )
  }
  const html = await res.text()
  const match = html.match(RECTRON_FILENAME_RE)
  if (!match) {
    throw new Error(
      `Could not find a RECTRON_PRICE_LIST filename on the download page`
    )
  }
  const filename = match[0]
  return { filename, url: cdnBase + filename }
}

/**
 * Ensure the latest Rectron price-list file is present in `watchDir`.
 * Skips the download if a file of that name already exists.
 */
export async function downloadRectronPricelist(config: {
  watchDir: string
  pageUrl?: string
  cdnBase?: string
}): Promise<RectronDownloadResult> {
  const { filename, url } = await resolveLatestRectronFile(config)

  mkdirSync(config.watchDir, { recursive: true })
  const filePath = join(config.watchDir, filename)

  if (existsSync(filePath)) {
    return { filePath, filename, downloaded: false }
  }

  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Rectron CDN returned HTTP ${res.status} for ${filename}`)
  }
  const buf = Buffer.from(await res.arrayBuffer())

  if (buf.length < MIN_BYTES) {
    throw new Error(
      `Downloaded Rectron file is too small (${buf.length} bytes) — likely not the real price list`
    )
  }
  const magicOk = ZIP_MAGIC.every((b, i) => buf[i] === b)
  if (!magicOk) {
    throw new Error(
      `Downloaded Rectron file is not a valid xlsx/zip (bad magic bytes)`
    )
  }

  // Write to a temp file then atomically rename, so the parser never sees a partial file.
  const tmpPath = `${filePath}.tmp`
  try {
    await writeFile(tmpPath, buf)
    await rename(tmpPath, filePath)
  } catch (err) {
    await unlink(tmpPath).catch(() => {})
    throw err
  }

  return { filePath, filename, downloaded: true }
}
