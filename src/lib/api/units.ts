import type { Unit, UnitUpdate, Jurisdiction } from '@/types';
import { apiGet, apiPut } from './client';

export async function getAllUnits(): Promise<Unit[]> {
  return apiGet<Unit[]>('/units');
}

export async function getUnit(jurisdiction: Jurisdiction, name: string): Promise<Unit> {
  return apiGet<Unit>(`/units/${encodeURIComponent(jurisdiction)}/${encodeURIComponent(name)}`);
}

export async function updateUnit(
  jurisdiction: Jurisdiction,
  name: string,
  data: UnitUpdate,
): Promise<Unit> {
  return apiPut<Unit>(
    `/units/${encodeURIComponent(jurisdiction)}/${encodeURIComponent(name)}`,
    data,
  );
}
