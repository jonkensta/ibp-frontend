import type { Inmate, InmateSearchResults, Jurisdiction } from '@/types';
import { apiGet, apiPost } from './client';

export async function searchInmates(query: string): Promise<InmateSearchResults> {
  return apiGet<InmateSearchResults>(`/inmates?query=${encodeURIComponent(query)}`);
}

export async function getInmate(jurisdiction: Jurisdiction, id: number): Promise<Inmate> {
  return apiGet<Inmate>(`/inmates/${encodeURIComponent(jurisdiction)}/${id}`);
}

/**
 * Read-only: the inmate a legacy request ID (from an old package label)
 * belongs to. Throws an ApiError with status 404 if no request has that ID.
 */
export async function getInmateByLegacyRequest(requestId: number): Promise<Inmate> {
  return apiGet<Inmate>(`/inmates/by-request/${requestId}`);
}

/**
 * Record one deliberate view ("lookup") of an inmate and return the inmate,
 * refreshed from the providers if stale. Call once per inmate page view;
 * use `getInmate` (read-only) for every refetch.
 */
export async function recordLookup(jurisdiction: Jurisdiction, id: number): Promise<Inmate> {
  return apiPost<Inmate>(`/inmates/${encodeURIComponent(jurisdiction)}/${id}/lookups`, undefined);
}
