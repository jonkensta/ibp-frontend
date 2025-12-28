import type { Unit, UnitCreate, UnitUpdate, Jurisdiction } from '@/types';
import { apiGet, apiPost, apiPut } from './client';

export async function getAllUnits(): Promise<Unit[]> {
  return apiGet<Unit[]>('/units');
}

export async function createUnit(data: UnitCreate): Promise<Unit> {
  return apiPost<Unit>('/units', data);
}

export async function getUnit(jurisdiction: Jurisdiction, name: string): Promise<Unit> {
  return apiGet<Unit>(`/units/${encodeURIComponent(jurisdiction)}/${encodeURIComponent(name)}`);
}

export async function updateUnit(
  jurisdiction: Jurisdiction,
  name: string,
  data: UnitUpdate
): Promise<Unit> {
  return apiPut<Unit>(
    `/units/${encodeURIComponent(jurisdiction)}/${encodeURIComponent(name)}`,
    data
  );
}
