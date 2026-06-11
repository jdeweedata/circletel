import { NextResponse } from 'next/server';

/**
 * Guard for development-only API routes (test/debug scaffolding).
 *
 * Returns a 404 response when running in production so these endpoints do not
 * expose functionality or information to the public internet, while remaining
 * usable in local/dev environments. Returns null when the route may proceed.
 *
 * Usage at the top of a route handler:
 *   const blocked = devOnlyGuard();
 *   if (blocked) return blocked;
 */
export function devOnlyGuard(): NextResponse | null {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return null;
}
