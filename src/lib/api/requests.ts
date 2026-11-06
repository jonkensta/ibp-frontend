import type {
  Request,
  RequestCreate,
  Jurisdiction,
  InmateWarnings,
  RequestValidationWarnings,
} from '@/types';
import { apiGet, apiPost, apiDelete, API_BASE_URL } from './client';

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

export async function deleteRequest(code: string): Promise<void> {
  return apiDelete<void>(`/requests/${encodeURIComponent(code)}`);
}

export async function getRequestLabel(code: string): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/requests/${encodeURIComponent(code)}/label`, {
    method: 'GET',
  });

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(message);
  }

  return response.blob();
}

/**
 * URL of a request label as a one-page PDF sized exactly to the 85 x 32 mm
 * label stock, for printing from the browser when the print server is down.
 */
export function getRequestLabelPdfUrl(code: string): string {
  return `${API_BASE_URL}/requests/${encodeURIComponent(code)}/label.pdf`;
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
