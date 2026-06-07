/**
 * Calculate reading time in minutes for a given HTML string.
 * Strips HTML tags, counts words, and divides by 200 WPM.
 * Minimum 1 minute.
 */
export function readMinutes(html: string | null): number {
  if (!html) return 1

  // Strip HTML tags
  const text = html.replace(/<[^>]*>/g, '')

  // Count words (simple split on whitespace)
  const words = text.trim().split(/\s+/).filter(Boolean).length

  // Average reading speed: 200 words per minute
  const minutes = Math.round(words / 200)

  return Math.max(1, minutes)
}
