export type EstateKind = 'site' | 'candidate'

export function estateKind(row: {
  isSite?: boolean
  overlayIp?: string | null
}): EstateKind {
  if (row.isSite === true) return 'site'
  if (row.isSite === false) return 'candidate'
  return row.overlayIp != null && row.overlayIp !== '' ? 'site' : 'candidate'
}
