import { createHash } from 'crypto';

/**
 * Deterministic pseudo-random helpers for mock data generation.
 *
 * All functions are pure — same userId always produces the same output,
 * ensuring demo consistency across multiple calls (backend-rules §6).
 */

/** Returns a stable integer 0–(max-1) from a userId + salt. */
export function deterministicInt(
  userId: string,
  salt: string,
  max: number,
): number {
  const hash = createHash('sha256')
    .update(userId + salt)
    .digest('hex');
  return parseInt(hash.slice(0, 8), 16) % max;
}

/** Returns a stable float 0–1 from a userId + salt. */
export function deterministicFloat(userId: string, salt: string): number {
  return deterministicInt(userId, salt, 1_000_000) / 1_000_000;
}

/** Picks a stable element from an array. */
export function deterministicPick<T>(
  userId: string,
  salt: string,
  arr: T[],
): T {
  return arr[deterministicInt(userId, salt, arr.length)];
}

/**
 * Returns a stable past date within the last N days.
 * Useful for "last payment date", "last sync date", etc.
 */
export function deterministicPastDate(
  userId: string,
  salt: string,
  maxDaysAgo: number,
): string {
  const daysAgo = deterministicInt(userId, salt, maxDaysAgo) + 1;
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

/**
 * Returns a stable future date within the next N days.
 * Useful for "due date", "expiry date", etc.
 */
export function deterministicFutureDate(
  userId: string,
  salt: string,
  maxDaysAhead: number,
): string {
  const daysAhead = deterministicInt(userId, salt, maxDaysAhead) + 1;
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}
