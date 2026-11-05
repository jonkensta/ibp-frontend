import type { Inmate, InmateSearchResults, Jurisdiction } from '@/types';
import { apiGet, apiPost } from './client';

export async function searchInmates(query: string): Promise<InmateSearchResults> {
  return apiGet<InmateSearchResults>(`/inmates?query=${encodeURIComponent(query)}`);
}

export async function getInmate(jurisdiction: Jurisdiction, id: number): Promise<Inmate> {
  return apiGet<Inmate>(`/inmates/${encodeURIComponent(jurisdiction)}/${id}`);
}

/**
 * Record one deliberate view ("lookup") of an inmate and return the inmate,
 * refreshed from the providers if stale. Call once per inmate page view;
 * use `getInmate` (read-only) for every refetch.
 */
export async function recordLookup(jurisdiction: Jurisdiction, id: number): Promise<Inmate> {
  return apiPost<Inmate>(`/inmates/${encodeURIComponent(jurisdiction)}/${id}/lookups`, undefined);
}
