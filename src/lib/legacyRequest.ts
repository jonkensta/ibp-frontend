// Legacy request IDs: the old app's request autoid, kept as Request.request_id
// by ibp-backend's migrate.py and printed (bare) on package labels before the
// 2026-11-02 cutover. Requests made since get none, so the range is closed.
// Mirrors ibp-book-portal-extension/scan.js.
export const LEGACY_MAX_REQUEST_ID = 270049;

// Lowest legacy ID on a package processed in the six months before the
// cutover. A bare legacy ID looks like a 6-digit inmate ID, so only numbers in
// [LEGACY_RECENT_MIN, LEGACY_MAX_REQUEST_ID] are taken as one; no TDCJ inmate
// numbered in that range had a package in that time (checked 2026-11-05).
export const LEGACY_RECENT_MIN = 264807;

/**
 * The legacy request ID a search query names, or null if it's not one: a bare
 * number in the recent legacy range. Old labels never have leading zeros, so
 * a number typed with them (`00268213`) is always an inmate ID.
 */
export function parseLegacyRequestId(query: string): number | null {
  const s = query.trim();
  if (!/^[1-9]\d*$/.test(s)) return null;
  const n = Number(s);
  return n >= LEGACY_RECENT_MIN && n <= LEGACY_MAX_REQUEST_ID ? n : null;
}
