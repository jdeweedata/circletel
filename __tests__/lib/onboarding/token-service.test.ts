import { generateToken, hashToken } from '@/lib/onboarding/token-service';

describe('token-service', () => {
  it('generates a URL-safe token of sufficient length', () => {
    const t = generateToken();
    expect(t).toMatch(/^[A-Za-z0-9_-]{40,}$/);
  });
  it('generates unique tokens', () => {
    expect(generateToken()).not.toEqual(generateToken());
  });
  it('hashes deterministically (same input -> same hash)', () => {
    expect(hashToken('abc')).toEqual(hashToken('abc'));
  });
  it('hashes differently for different input', () => {
    expect(hashToken('abc')).not.toEqual(hashToken('abd'));
  });
});
