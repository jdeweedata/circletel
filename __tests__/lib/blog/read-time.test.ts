import { readMinutes } from '@/lib/blog/read-time'

describe('readMinutes', () => {
  it('returns 1 for null', () => {
    expect(readMinutes(null)).toBe(1)
  })

  it('returns 1 for empty string', () => {
    expect(readMinutes('')).toBe(1)
  })

  it('strips HTML tags and counts words', () => {
    const html = '<p>This is a test article with ten words in total.</p>'
    // 10 words / 200 wpm = 0.05 → rounds to 0 → Math.max(1, 0) = 1
    expect(readMinutes(html)).toBe(1)
  })

  it('calculates ~2 minutes for ~400 words', () => {
    // 400 words / 200 wpm = 2 minutes
    const words = Array(400).fill('word').join(' ')
    const html = `<p>${words}</p>`
    expect(readMinutes(html)).toBe(2)
  })

  it('handles multiple HTML tags', () => {
    const html = `
      <h1>Title</h1>
      <p>This is a paragraph with some words.</p>
      <p>And another paragraph with more words here.</p>
    `
    // 13 words / 200 = 0.065 → rounds to 0 → 1
    expect(readMinutes(html)).toBe(1)
  })

  it('handles nested tags', () => {
    const html = '<div><p>Some <strong>bold</strong> text here.</p></div>'
    // 5 words / 200 = 0.025 → rounds to 0 → 1
    expect(readMinutes(html)).toBe(1)
  })
})
