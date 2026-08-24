import { issuedCodesAfterAttempt } from '@/app/admin/integrations/radius/issued-codes'

describe('issuedCodesAfterAttempt', () => {
  it('returns an empty list after a failed retry', () => {
    expect(issuedCodesAfterAttempt(undefined, 2)).toEqual([])
  })

  it('returns a complete successful batch', () => {
    expect(issuedCodesAfterAttempt(['CODE-1', 'CODE-2'], 2)).toEqual([
      'CODE-1',
      'CODE-2',
    ])
  })
})
