import { estateKind } from '@/lib/radius/estate-kind'

describe('estateKind', () => {
  it('calls a flipped clinic with no overlay a candidate', () => {
    expect(estateKind({ isSite: false, overlayIp: null })).toBe('candidate')
  })

  it('calls a NAS that can reach RADIUS over the Overlay a Site', () => {
    expect(estateKind({ isSite: true, overlayIp: '10.10.0.2' })).toBe('site')
  })

  it('does not treat overlay-less rows as Sites when isSite is omitted', () => {
    expect(estateKind({ overlayIp: null })).toBe('candidate')
  })

  it('treats an overlay IP as a Site when FWA omits isSite', () => {
    expect(estateKind({ overlayIp: '10.10.0.10' })).toBe('site')
  })
})
