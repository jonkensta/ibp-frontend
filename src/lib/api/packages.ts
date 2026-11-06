import type { Package } from '@/types';
import { apiGet } from './client';

/**
 * Get a filled request's package: the request, its inmate, the books recorded
 * and the inmate's warnings. `code` is passed as scanned (the backend parses
 * it case-insensitively). 404 for an unknown or malformed code, 409 for a
 * tossed request.
 */
export async function getPackage(code: string): Promise<Package> {
  return apiGet<Package>(`/requests/${encodeURIComponent(code)}`);
}
