export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Extracts a human-readable error message from response text.
 * Attempts to parse as JSON and extract from common error fields (detail, message, error).
 * Falls back to raw text if JSON parsing fails.
 */
function extractErrorMessage(text: string): string {
  if (!text) return '';

  try {
    const json = JSON.parse(text);
    // FastAPI uses 'detail', but check common alternatives
    const message = json.detail ?? json.message ?? json.error ?? text;
    // If the message field is an object/array, stringify it
    return typeof message === 'string' ? message : JSON.stringify(message);
  } catch {
    // Not valid JSON, return raw text
    return text;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = response.statusText;

    try {
      const text = await response.text();
      const extracted = extractErrorMessage(text);
      if (extracted) {
        message = extracted;
      }
    } catch (error) {
      console.error('Failed to read error response:', error);
    }

    throw new ApiError(response.status, message);
  }

  // Handle 204 No Content (no response body)
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return handleResponse<T>(response);
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return handleResponse<T>(response);
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return handleResponse<T>(response);
}

export async function apiDelete<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return handleResponse<T>(response);
}
