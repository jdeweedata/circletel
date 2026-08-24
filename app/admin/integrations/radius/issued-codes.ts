export function issuedCodesAfterAttempt(
  codes: unknown,
  expectedCount: number
): string[] {
  return Array.isArray(codes)
    && codes.length === expectedCount
    && codes.every((code): code is string => typeof code === 'string')
    ? codes
    : []
}
