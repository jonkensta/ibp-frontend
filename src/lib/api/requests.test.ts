import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createRequest,
  deleteRequest,
  getRequestLabel,
  getInmateWarnings,
  validateRequest,
} from './requests';
import type { RequestCreate } from '@/types';

const mockFetch = vi.fn();
window.fetch = mockFetch;

describe('Requests API', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('createRequest', () => {
    it('should create a request with correct URL and data', async () => {
      const mockRequest = {
        index: 1,
        date_postmarked: '2024-12-20',
        date_processed: '2024-12-21',
        action: 'Filled' as const,
      };

      mockFetch.mockResolvedValue(
        new Response(JSON.stringify(mockRequest), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const requestData: RequestCreate = {
        date_postmarked: '2024-12-20',
        date_processed: '2024-12-21',
        action: 'Filled',
      };

      const result = await createRequest('Texas', 12345, requestData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/inmates/Texas/12345/requests'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestData),
        })
      );
      expect(result).toEqual(mockRequest);
    });

    it('should handle jurisdiction with spaces', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({}), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const requestData: RequestCreate = {
        date_postmarked: '2024-12-20',
        date_processed: '2024-12-21',
        action: 'Filled',
      };

      await createRequest('New York', 12345, requestData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('New%20York'),
        expect.anything()
      );
    });
  });

  describe('deleteRequest', () => {
    it('should delete a request with correct URL', async () => {
      mockFetch.mockResolvedValue(
        new Response(null, {
          status: 204,
        })
      );

      await deleteRequest('Texas', 12345, 1);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/inmates/Texas/12345/requests/1'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('getRequestLabel', () => {
    it('should fetch label as blob', async () => {
      const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' });
      mockFetch.mockResolvedValue(
        new Response(mockBlob, {
          status: 200,
          headers: { 'Content-Type': 'application/pdf' },
        })
      );

      const result = await getRequestLabel('Texas', 12345, 1);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/inmates/Texas/12345/requests/1/label'),
        expect.objectContaining({
          method: 'GET',
        })
      );
      expect(result).toBeInstanceOf(Blob);
    });

    it('should throw error for failed response', async () => {
      mockFetch.mockResolvedValue(
        new Response('Not Found', {
          status: 404,
          statusText: 'Not Found',
        })
      );

      await expect(getRequestLabel('Texas', 12345, 1)).rejects.toThrow();
    });
  });

  describe('getInmateWarnings', () => {
    it('should fetch inmate warnings', async () => {
      const mockWarnings = {
        entry_age: 'Entry is older than 30 days',
        release: null,
      };

      mockFetch.mockResolvedValue(
        new Response(JSON.stringify(mockWarnings), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const result = await getInmateWarnings('Texas', 12345);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/inmates/Texas/12345/warnings'),
        expect.objectContaining({
          method: 'GET',
        })
      );
      expect(result).toEqual(mockWarnings);
    });
  });

  describe('validateRequest', () => {
    it('should validate request and return warnings', async () => {
      const mockWarnings = {
        entry_age: null,
        release: 'Inmate released',
        postmarkdate: null,
      };

      mockFetch.mockResolvedValue(
        new Response(JSON.stringify(mockWarnings), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const requestData: RequestCreate = {
        date_postmarked: '2024-12-20',
        date_processed: '2024-12-21',
        action: 'Filled',
      };

      const result = await validateRequest('Texas', 12345, requestData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/inmates/Texas/12345/requests/validate'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestData),
        })
      );
      expect(result).toEqual(mockWarnings);
    });
  });
});
