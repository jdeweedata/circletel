import { renderToString } from 'react-dom/server'
import { EstateTable } from '@/app/admin/integrations/radius/EstateTable'

const delmasId = 'cfdccb00-9124-4eca-8080-9dbd90aa5059'
const labId = '22222222-2222-4222-8222-222222222222'

const rows = [
  {
    id: delmasId,
    name: 'Unjani Clinic - Delmas',
    siteCode: 'FWA-DELMAS-PILOT',
    status: 'pending',
    radiusProvider: 'radius' as const,
    nasType: 'routeros',
    tunnelType: 'direct',
    overlayIp: null,
    isSite: false,
    openSessions: 0,
    lastAcceptAt: null,
  },
  {
    id: labId,
    name: 'Lab hEX',
    siteCode: 'LAB-HEX',
    status: 'active',
    radiusProvider: 'radius' as const,
    nasType: 'routeros',
    tunnelType: 'wireguard',
    overlayIp: '10.10.0.2',
    isSite: true,
    openSessions: 1,
    lastAcceptAt: '2026-08-25T10:00:00.000Z',
  },
]

describe('EstateTable', () => {
  it('shows Delmas as a candidate and an overlay NAS as a Site', () => {
    const html = renderToString(<EstateTable rows={rows} onSelectSite={() => {}} />)

    expect(html).toMatch(
      /data-estate-kind="candidate"[\s\S]*?Unjani Clinic - Delmas[\s\S]*?Candidate/
    )
    expect(html).toMatch(/data-estate-kind="site"[\s\S]*?Lab hEX[\s\S]*?>Site</)
  })

  it('exposes the corporate site id for the existing site tools', () => {
    const html = renderToString(<EstateTable rows={rows} onSelectSite={() => {}} />)

    expect(html).toContain(`data-site-id="${delmasId}"`)
    expect(html).toContain(`data-site-id="${labId}"`)
  })
})
