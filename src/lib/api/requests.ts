import type {
  Request,
  RequestCreate,
  Jurisdiction,
  InmateWarnings,
  RequestValidationWarnings,
} from '@/types';
import { apiGet, apiPost, apiDelete } from './client';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export async function createRequest(
  jurisdiction: Jurisdiction,
  inmateId: number,
  data: RequestCreate
): Promise<Request> {
  return apiPost<Request>(
    `/inmates/${encodeURIComponent(jurisdiction)}/${inmateId}/requests`,
    data
  );
}

export async function deleteRequest(
  jurisdiction: Jurisdiction,
  inmateId: number,
  requestIndex: number
): Promise<void> {
  return apiDelete<void>(
    `/inmates/${encodeURIComponent(jurisdiction)}/${inmateId}/requests/${requestIndex}`
  );
}

export async function getRequestLabel(
  jurisdiction: Jurisdiction,
  inmateId: number,
  requestIndex: number
): Promise<Blob> {
  const response = await fetch(
    `${API_BASE_URL}/inmates/${encodeURIComponent(jurisdiction)}/${inmateId}/requests/${requestIndex}/label`,
    {
      method: 'GET',
    }
  );

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(message);
  }

  return response.blob();
}

export async function getInmateWarnings(
  jurisdiction: Jurisdiction,
  inmateId: number
): Promise<InmateWarnings> {
  return apiGet<InmateWarnings>(
    `/inmates/${encodeURIComponent(jurisdiction)}/${inmateId}/warnings`
  );
}

export async function validateRequest(
  jurisdiction: Jurisdiction,
  inmateId: number,
  data: RequestCreate
): Promise<RequestValidationWarnings> {
  return apiPost<RequestValidationWarnings>(
    `/inmates/${encodeURIComponent(jurisdiction)}/${inmateId}/requests/validate`,
    data
  );
}
