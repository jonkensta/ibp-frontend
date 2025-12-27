import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiGet, apiPost, apiDelete, ApiError } from './client';

// Mock fetch globally
const mockFetch = vi.fn();
window.fetch = mockFetch;

describe('API Client', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('apiGet', () => {
    it('should make GET request with correct URL', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({ id: 1, name: 'test' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const result = await apiGet('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'GET',
        })
      );
      expect(result).toEqual({ id: 1, name: 'test' });
    });

    it('should throw ApiError for failed response', async () => {
      mockFetch.mockResolvedValue(
        new Response('Not Found', {
          status: 404,
          statusText: 'Not Found',
        })
      );

      await expect(apiGet('/test')).rejects.toThrow(ApiError);
    });

    it('should extract error message from JSON response', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({ detail: 'Query must be an inmate name or ID.' }), {
          status: 400,
          statusText: 'Bad Request',
          headers: { 'Content-Type': 'application/json' },
        })
      );

      try {
        await apiGet('/test');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).message).toBe('Query must be an inmate name or ID.');
        expect((error as ApiError).status).toBe(400);
      }
    });
  });

  describe('apiPost', () => {
    it('should make POST request with body', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({ id: 1 }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const data = { name: 'test' };
      await apiPost('/test', data);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(data),
        })
      );
    });
  });

  describe('apiDelete', () => {
    it('should handle 204 No Content response', async () => {
      mockFetch.mockResolvedValue(
        new Response(null, {
          status: 204,
        })
      );

      const result = await apiDelete('/test/1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test/1'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
      expect(result).toBeUndefined();
    });
  });
});
