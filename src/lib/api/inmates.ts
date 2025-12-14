import type { Inmate, InmateSearchResults, Jurisdiction } from '@/types';
import { apiGet } from './client';

export async function searchInmates(query: string): Promise<InmateSearchResults> {
  return apiGet<InmateSearchResults>(`/inmates?query=${encodeURIComponent(query)}`);
}

export async function getInmate(jurisdiction: Jurisdiction, id: number): Promise<Inmate> {
  return apiGet<Inmate>(`/inmates/${encodeURIComponent(jurisdiction)}/${id}`);
}
